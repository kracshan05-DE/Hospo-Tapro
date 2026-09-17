import { createClient } from './supabase-server';
import { logServerError } from './log';

// Fire-and-forget audit trail for admin mutations. Never blocks or fails the
// calling action — losing an audit row is far better than losing the user's
// actual save because logging hiccupped.
export async function logAdminAction(
  actorEmail: string,
  action: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    await supabase.from('admin_audit_log').insert({
      actor_email: actorEmail,
      action,
      entity_id: entityId ?? null,
      details: details ?? null,
    });
  } catch (error) {
    logServerError('audit.log', error);
  }
}
