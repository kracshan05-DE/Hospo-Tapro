import { sendInquiryNotification, type NotifiableInquiry, type SendResult } from './email';
import { logServerError } from './log';

export type EmailRecord =
  | { email_status: 'sent'; email_sent_at: string; email_error: null }
  | { email_status: 'failed'; email_error: string };

type Deps = {
  send?: (inquiry: NotifiableInquiry) => Promise<SendResult>;
  record: (inquiryId: string, update: EmailRecord) => Promise<void>;
};

// Sends the notification for an inquiry that is ALREADY saved, and records the
// outcome on the inquiry row. Never throws: an email problem must never turn a
// saved customer inquiry into an error, and a failure stays visible in the
// dashboard (email_status = 'failed') where it can be re-sent.
export async function deliverNotification(inquiry: NotifiableInquiry, deps: Deps): Promise<SendResult> {
  let result: SendResult;
  try {
    result = await (deps.send ?? sendInquiryNotification)(inquiry);
  } catch (error) {
    result = { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  if (!result.ok) logServerError('inquiries.notify', result.error);

  try {
    await deps.record(
      inquiry.id,
      result.ok
        ? { email_status: 'sent', email_sent_at: new Date().toISOString(), email_error: null }
        : { email_status: 'failed', email_error: result.error.slice(0, 500) }
    );
  } catch (error) {
    logServerError('inquiries.notify.record', error);
  }
  return result;
}
