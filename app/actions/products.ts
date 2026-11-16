'use server';

import { revalidatePath } from 'next/cache';
import { getAdmin } from '@/lib/admin';
import { logServerError } from '@/lib/log';
import type { ProductInput } from '@/lib/types';

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_NAME = 200;
const MAX_VOLUME = 80;
const MAX_DESCRIPTION = 2000;
const IMAGE_URL_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\//i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalise(input: ProductInput): ProductInput {
  return {
    name: String(input.name ?? '').trim(),
    volume: String(input.volume ?? '').trim(),
    description: String(input.description ?? '').trim(),
    image_url: String(input.image_url ?? '').trim(),
    sort_order: Number.isFinite(Number(input.sort_order)) ? Math.trunc(Number(input.sort_order)) : 0,
  };
}

function validate(input: ProductInput): string | null {
  if (!input.name) return 'Product name is required.';
  if (input.name.length > MAX_NAME) return `Product name must be under ${MAX_NAME} characters.`;
  if (input.volume.length > MAX_VOLUME) return `Volume must be under ${MAX_VOLUME} characters.`;
  if (input.description.length > MAX_DESCRIPTION) return `Description must be under ${MAX_DESCRIPTION} characters.`;
  // Only image URLs from our own storage bucket (also enforced by a DB constraint).
  if (input.image_url && !IMAGE_URL_RE.test(input.image_url)) return 'Invalid image reference.';
  return null;
}

function storagePath(imageUrl: string): string | null {
  const marker = '/product-images/';
  const idx = imageUrl.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(imageUrl.slice(idx + marker.length));
}

function refresh() {
  revalidatePath('/tapro');
  revalidatePath('/admin/dashboard/tapro');
}

// All product writes run with the admin's session: RLS (is_admin()) is the
// real gate; the getAdmin() check gives a clear error. The audit log is
// written by a database trigger, not here.
export async function createProduct(raw: ProductInput): Promise<ActionResult> {
  const input = normalise(raw);
  const fieldError = validate(input);
  if (fieldError) return { ok: false, error: fieldError };

  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) return { ok: false, error: 'Not authorised.' };

  const { error } = await admin.supabase.from('products').insert(input);
  if (error) {
    logServerError('products.create', error);
    return { ok: false, error: 'Could not save the product. Please try again.' };
  }
  refresh();
  return { ok: true };
}

export async function updateProduct(id: string, raw: ProductInput): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Invalid product.' };
  const input = normalise(raw);
  const fieldError = validate(input);
  if (fieldError) return { ok: false, error: fieldError };

  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) return { ok: false, error: 'Not authorised.' };

  const { data: existing } = await admin.supabase.from('products').select('image_url').eq('id', id).maybeSingle();

  const { error, count } = await admin.supabase.from('products').update(input, { count: 'exact' }).eq('id', id);
  if (error || count === 0) {
    logServerError('products.update', error ?? 'no row updated');
    return { ok: false, error: 'Could not save changes. Please try again.' };
  }

  // A replaced photo is removed from storage so files don't pile up.
  const oldPath = existing?.image_url && existing.image_url !== input.image_url ? storagePath(existing.image_url) : null;
  if (oldPath) {
    const { error: storageError } = await admin.supabase.storage.from('product-images').remove([oldPath]);
    if (storageError) logServerError('products.update.storage', storageError);
  }

  refresh();
  return { ok: true };
}

// The image to delete is read from the product row in the database, never
// taken from the browser, so a request can't delete arbitrary files.
export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, error: 'Invalid product.' };

  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) return { ok: false, error: 'Not authorised.' };

  const { data: existing } = await admin.supabase.from('products').select('image_url').eq('id', id).maybeSingle();

  const { error, count } = await admin.supabase.from('products').delete({ count: 'exact' }).eq('id', id);
  if (error || count === 0) {
    logServerError('products.delete', error ?? 'no row deleted');
    return { ok: false, error: 'Could not delete the product. Please try again.' };
  }

  const path = existing?.image_url ? storagePath(existing.image_url) : null;
  if (path) {
    const { error: storageError } = await admin.supabase.storage.from('product-images').remove([path]);
    if (storageError) logServerError('products.delete.storage', storageError);
  }

  refresh();
  return { ok: true };
}
