import { describe, expect, it, vi } from 'vitest';
import { deliverNotification } from '@/lib/inquiry-notify';

const inquiry = {
  id: 'i1', brand: 'tapro' as const, name: 'A', email: 'a@b.co', business: null, phone: null,
  enquiry_type: null, message: 'hello there', created_at: '2026-11-16T10:00:00Z',
};

describe('deliverNotification', () => {
  it('never throws, even if both sending and recording fail', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await deliverNotification(inquiry, {
      send: async () => { throw new Error('boom'); },
      record: async () => { throw new Error('db down'); },
    });
    expect(result).toEqual({ ok: false, error: 'boom' });
  });
  it('truncates long provider errors before storing them', async () => {
    const record = vi.fn(async () => {});
    await deliverNotification(inquiry, { send: async () => ({ ok: false, error: 'x'.repeat(2000) }), record });
    const stored = (record.mock.calls[0] as unknown[])[1] as { email_error: string };
    expect(stored.email_error).toHaveLength(500);
  });
});
