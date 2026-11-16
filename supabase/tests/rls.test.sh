#!/usr/bin/env bash
# Security tests for supabase/migrations/20261116130000_admin_security_and_inquiry_management.sql
#
# Builds a throwaway database that mirrors the live project (shim + live
# baseline), applies the migration, then attacks it as four identities:
#   anon      – a website visitor using the public anon key
#   stranger  – someone who managed to create a login, but is NOT an admin
#   admin     – a user listed in public.admin_users
#   service   – the server (service_role key)
# Then proves the rollback restores the original policies and that the
# migration can be re-applied. Each check runs in its own rolled-back
# transaction unless stated otherwise.
#
# Usage: PGHOST=... PGPORT=... PGUSER=postgres supabase/tests/rls.test.sh
set -uo pipefail
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$DIR/.."
MIGRATION="$ROOT/migrations/20261116130000_admin_security_and_inquiry_management.sql"
ROLLBACK="$ROOT/rollbacks/20261116130000_admin_security_and_inquiry_management.rollback.sql"
DB="${TEST_DB:-hospo_rls_test}"

ADMIN_ID=11111111-1111-1111-1111-111111111111
STRANGER_ID=22222222-2222-2222-2222-222222222222

pass=0; fail=0
psqlq() { psql -X -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

claims_for() {
  case "$1" in
    anon)     echo "anon|{\"role\":\"anon\"}" ;;
    stranger) echo "authenticated|{\"role\":\"authenticated\",\"sub\":\"$STRANGER_ID\",\"email\":\"stranger@example.com\"}" ;;
    admin)    echo "authenticated|{\"role\":\"authenticated\",\"sub\":\"$ADMIN_ID\",\"email\":\"admin@gmail.com\"}" ;;
    service)  echo "service_role|{\"role\":\"service_role\"}" ;;
  esac
}

# run_as <identity> <sql>  -> prints last query result; exit code of psql
run_as() {
  local who="$1" sql="$2" role claims
  IFS='|' read -r role claims <<<"$(claims_for "$who")"
  psql -X -q -At -v ON_ERROR_STOP=1 -d "$DB" 2>&1 <<SQL
begin;
set local role $role;
select set_config('request.jwt.claims', '$claims', true) \\g /dev/null
$sql;
rollback;
SQL
}

ok()   { pass=$((pass+1)); printf '  PASS  %s\n' "$1"; }
bad()  { fail=$((fail+1)); printf '  FAIL  %s\n        got: %s\n' "$1" "$2"; }

expect_value() { # <desc> <identity> <sql> <expected>
  local out; out=$(run_as "$2" "$3"); local rc=$?
  if [[ $rc -eq 0 && "$(echo "$out" | tail -1)" == "$4" ]]; then ok "$1"; else bad "$1" "$out"; fi
}
expect_denied() { # <desc> <identity> <sql>
  local out; out=$(run_as "$2" "$3"); local rc=$?
  if [[ $rc -ne 0 && "$out" =~ (permission\ denied|row-level\ security) ]]; then ok "$1"; else bad "$1" "rc=$rc $out"; fi
}
expect_violation() { # <desc> <identity> <sql>
  local out; out=$(run_as "$2" "$3"); local rc=$?
  if [[ $rc -ne 0 && "$out" =~ violates\ check\ constraint ]]; then ok "$1"; else bad "$1" "rc=$rc $out"; fi
}

affected() { echo "with x as ($1 returning 1) select count(*) from x"; }

NEW_INQ="insert into public.inquiries (brand,name,email,message) values ('tapro','Bot','bot@x.com','spam spam spam')"
NEW_PROD="insert into public.products (name,volume,description,image_url,sort_order) values ('Test','1kg','d','',9)"

echo "== Setting up test database ($DB) from live baseline"
dropdb --if-exists "$DB" >/dev/null && createdb "$DB" || exit 1
psqlq -f "$DIR/00_supabase_shim.sql" >/dev/null || exit 1
psqlq -f "$DIR/01_live_baseline_2026-11-16.sql" >/dev/null || exit 1

echo "== Baseline: confirm the live vulnerabilities exist before the fix"
expect_value  "BEFORE: stranger can read all customer inquiries"   stranger "select count(*) from public.inquiries" "4"
expect_value  "BEFORE: anon can insert inquiries directly via API" anon     "$(affected "$NEW_INQ")" "1"
expect_value  "BEFORE: stranger can delete products"                stranger "$(affected "delete from public.products")" "3"

BEFORE_COUNTS=$(psqlq -At -c "select (select count(*) from public.products)||','||(select count(*) from public.inquiries)||','||(select count(*) from public.admin_audit_log)")

echo "== Applying migration"
psqlq -f "$MIGRATION" >/dev/null || { echo "MIGRATION FAILED"; exit 1; }
echo "== Applying migration a second time (must be idempotent)"
psqlq -f "$MIGRATION" >/dev/null 2>&1 && ok "migration is re-runnable" || bad "migration is re-runnable" "second run failed"

AFTER_COUNTS=$(psqlq -At -c "select (select count(*) from public.products)||','||(select count(*) from public.inquiries)||','||(select count(*) from public.admin_audit_log)")
[[ "$BEFORE_COUNTS" == "$AFTER_COUNTS" ]] && ok "all existing rows preserved ($AFTER_COUNTS products,inquiries,audit)" || bad "rows preserved" "$BEFORE_COUNTS -> $AFTER_COUNTS"

# Seed the first admin (this is the one-line step done in the SQL editor in production)
psqlq -c "insert into public.admin_users (user_id,email,role) values ('$ADMIN_ID','admin@gmail.com','owner')" >/dev/null

echo "== Existing inquiry rows after migration"
expect_value "existing inquiries default to status 'new'"          admin "select string_agg(distinct status, ',') from public.inquiries" "new"
expect_value "existing inquiries marked email_status 'skipped'"    admin "select string_agg(distinct email_status, ',') from public.inquiries" "skipped"

echo "== Admin allowlist"
expect_value  "is_admin() is false for anon"                anon     "select public.is_admin()" "f"
expect_value  "is_admin() is false for stranger"            stranger "select public.is_admin()" "f"
expect_value  "is_admin() is true for admin"                admin    "select public.is_admin()" "t"
expect_value  "stranger cannot see the admin list"          stranger "select count(*) from public.admin_users" "0"
expect_value  "admin can see the admin list"                admin    "select count(*) from public.admin_users" "1"
expect_denied "stranger cannot add themselves as admin"     stranger "insert into public.admin_users (user_id,email) values ('$STRANGER_ID','s@x.com')"
expect_denied "admin cannot add admins from the website"    admin    "insert into public.admin_users (user_id,email) values ('$STRANGER_ID','s@x.com')"
expect_denied "admin cannot remove admins from the website" admin    "delete from public.admin_users"
expect_denied "admin cannot clear their own must_change_password flag" admin "update public.admin_users set must_change_password=false"
expect_value  "server can clear must_change_password"       service  "$(affected "update public.admin_users set must_change_password=false")" "1"
expect_denied "anon cannot read the admin list"             anon     "select count(*) from public.admin_users"

echo "== Products"
expect_value     "anon can read products (public site)"         anon     "select count(*) from public.products" "3"
expect_denied    "anon cannot insert products"                  anon     "$NEW_PROD"
expect_denied    "anon cannot delete products"                  anon     "delete from public.products"
expect_denied    "stranger cannot insert products"              stranger "$NEW_PROD"
expect_value     "stranger cannot update products (0 rows)"     stranger "$(affected "update public.products set name='hacked'")" "0"
expect_value     "stranger cannot delete products (0 rows)"     stranger "$(affected "delete from public.products")" "0"
expect_value     "admin can insert a product"                   admin    "$(affected "$NEW_PROD")" "1"
expect_value     "admin can update a product"                   admin    "$(affected "update public.products set volume='2kg' where name='Seeni Sambol'")" "1"
expect_value     "admin can delete a product"                   admin    "$(affected "delete from public.products where name='Seeni Sambol'")" "1"
expect_violation "product image must be our storage URL"        admin    "insert into public.products (name,image_url) values ('X','https://evil.example/x.svg')"
expect_violation "product name cannot be blank"                 admin    "insert into public.products (name) values ('   ')"

echo "== Inquiries"
expect_denied    "anon cannot insert inquiries directly"        anon     "$NEW_INQ"
expect_denied    "anon cannot read inquiries"                   anon     "select count(*) from public.inquiries"
expect_denied    "stranger cannot insert inquiries directly"    stranger "$NEW_INQ"
expect_value     "stranger sees no inquiries"                   stranger "select count(*) from public.inquiries" "0"
expect_value     "stranger cannot change status (0 rows)"       stranger "$(affected "update public.inquiries set status='resolved'")" "0"
expect_value     "stranger cannot delete inquiries (0 rows)"    stranger "$(affected "delete from public.inquiries")" "0"
expect_value     "admin can read all inquiries"                 admin    "select count(*) from public.inquiries" "4"
expect_value     "admin can change status + notes"              admin    "$(affected "update public.inquiries set status='in_progress', admin_notes='Called back' where name='Raj Patel'")" "1"
expect_denied    "admin cannot alter the customer's message"    admin    "update public.inquiries set message='edited' where name='Raj Patel'"
expect_denied    "admin cannot alter the customer's email"      admin    "update public.inquiries set email='x@y.com'"
expect_denied    "admin cannot fake email delivery status"      admin    "update public.inquiries set email_status='sent'"
expect_violation "status must be new/in_progress/resolved"      admin    "update public.inquiries set status='bogus' where name='Raj Patel'"
expect_denied    "admin cannot create inquiries directly"       admin    "$NEW_INQ"
expect_value     "admin can delete an inquiry"                  admin    "$(affected "delete from public.inquiries where name='Tom Lee'")" "1"
expect_value     "updated_at is maintained by the database"     service  "update public.inquiries set status='resolved', updated_at = '2000-01-01' where name='Ama Silva'; select (updated_at > now() - interval '1 minute')::text from public.inquiries where name='Ama Silva'" "true"

echo "== Server (service role) inserts"
expect_value     "server can insert an inquiry; email_status defaults to 'pending'" service "$NEW_INQ returning email_status" "pending"
expect_value     "server can record email delivery"             service  "$(affected "update public.inquiries set email_status='sent', email_sent_at=now() where name='Jane Buyer'")" "1"
expect_violation "brand must be hospo_fresh or tapro"           service  "insert into public.inquiries (brand,name,email,message) values ('other','A','a@b.co','hello there')"
expect_violation "email must look like an email"                service  "insert into public.inquiries (brand,name,email,message) values ('tapro','A','not-an-email','hello there')"
expect_violation "message capped at 5000 chars"                 service  "insert into public.inquiries (brand,name,email,message) values ('tapro','A','a@b.co',repeat('x',5001))"
expect_violation "name cannot be blank"                         service  "insert into public.inquiries (brand,name,email,message) values ('tapro','  ','a@b.co','hello there')"

echo "== Audit log"
expect_denied "anon cannot read the audit log"                  anon     "select count(*) from public.admin_audit_log"
expect_value  "stranger sees no audit entries"                  stranger "select count(*) from public.admin_audit_log" "0"
expect_denied "stranger cannot write audit entries"             stranger "insert into public.admin_audit_log (actor_email,action) values ('x','fake')"
expect_denied "admin cannot forge audit entries"                admin    "insert into public.admin_audit_log (actor_email,action) values ('x','fake')"
expect_denied "admin cannot erase audit entries"                admin    "delete from public.admin_audit_log"
expect_value  "product change is audited with the admin's email" admin   "$NEW_PROD; select actor_email||' '||action from public.admin_audit_log order by created_at desc limit 1" "admin@gmail.com product.create"
expect_value  "status change is audited without customer PII"   admin    "update public.inquiries set status='resolved' where name='Raj Patel'; select action||' '||details::text from public.admin_audit_log order by created_at desc limit 1" 'inquiry.update {"status_to": "resolved", "status_from": "new"}'
expect_value  "server email bookkeeping is NOT audited"         service  "update public.inquiries set email_status='failed' where name='Jane Buyer'; select count(*) from public.admin_audit_log where action like 'inquiry.%'" "0"

echo "== Storage (product-images)"
expect_value  "bucket limited to 5 MB, jpeg/png/webp"           service  "select file_size_limit||' '||array_to_string(allowed_mime_types,',') from storage.buckets where id='product-images'" "5242880 image/jpeg,image/png,image/webp"
expect_value  "anyone can view product images"                  anon     "select count(*) from storage.objects where bucket_id='product-images'" "1"
expect_denied "anon cannot upload images"                       anon     "insert into storage.objects (bucket_id,name) values ('product-images','x.jpg')"
expect_denied "stranger cannot upload images"                   stranger "insert into storage.objects (bucket_id,name) values ('product-images','x.jpg')"
expect_value  "stranger cannot delete images (0 rows)"          stranger "$(affected "delete from storage.objects")" "0"
expect_value  "admin can upload an image"                       admin    "$(affected "insert into storage.objects (bucket_id,name) values ('product-images','new.jpg')")" "1"
expect_value  "admin can delete an image"                       admin    "$(affected "delete from storage.objects where name='a.jpg'")" "1"

echo "== Rollback restores the original live policies exactly"
SNAP_SQL="select string_agg(p, E'\n' order by p) from (select schemaname||'.'||tablename||':'||policyname||':'||cmd||':'||array_to_string(roles,'/') as p from pg_policies where schemaname in ('public','storage')) s"
psqlq -f "$ROLLBACK" >/dev/null || { bad "rollback runs" "failed"; }
ORIG=$(dropdb --if-exists "${DB}_orig" >/dev/null; createdb "${DB}_orig" && psql -X -q -d "${DB}_orig" -f "$DIR/00_supabase_shim.sql" >/dev/null && psql -X -q -d "${DB}_orig" -f "$DIR/01_live_baseline_2026-11-16.sql" >/dev/null && psql -X -At -d "${DB}_orig" -c "$SNAP_SQL")
NOW=$(psqlq -At -c "$SNAP_SQL")
[[ "$ORIG" == "$NOW" ]] && ok "policies after rollback == live snapshot" || bad "policies after rollback == live snapshot" "$(diff <(echo "$ORIG") <(echo "$NOW"))"
expect_value "customer inquiries kept through rollback"         service  "select count(*) from public.inquiries" "4"
dropdb --if-exists "${DB}_orig" >/dev/null

echo "== Re-applying migration after rollback"
psqlq -f "$MIGRATION" >/dev/null && ok "migration re-applies cleanly after rollback" || bad "re-apply after rollback" "failed"
psqlq -c "insert into public.admin_users (user_id,email,role) values ('$ADMIN_ID','admin@gmail.com','owner')" >/dev/null
expect_value "security holds after re-apply (stranger sees 0 inquiries)" stranger "select count(*) from public.inquiries" "0"

dropdb --if-exists "$DB" >/dev/null
echo
echo "RESULT: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
