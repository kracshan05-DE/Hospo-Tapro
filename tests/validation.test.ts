import { describe, expect, it } from 'vitest';
import { isInquiryStatus, parseInquiry, sanitizeSearch, validateNewPassword } from '@/lib/validation';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
  return fd;
};
const valid = { name: 'Jane Buyer', email: 'jane@cafe.com.au', message: 'Please send your wholesale catalogue.' };

describe('parseInquiry', () => {
  it('accepts a valid enquiry and trims / nulls optional fields', () => {
    const r = parseInquiry('tapro', form({ ...valid, name: '  Jane Buyer ', phone: '', business: 'Cafe One' }));
    expect(r).toEqual({
      ok: true,
      value: { brand: 'tapro', name: 'Jane Buyer', email: 'jane@cafe.com.au', business: 'Cafe One', phone: null, enquiry_type: null, message: valid.message },
    });
  });
  it.each([
    [{ ...valid, name: '' }, 'name, email and message'],
    [{ ...valid, email: 'not-an-email' }, 'valid email'],
    [{ ...valid, name: '12345' }, 'full name'],
    [{ ...valid, phone: 'call me maybe' }, 'phone'],
    [{ ...valid, message: 'short' }, 'between 10 and 5000'],
    [{ ...valid, message: 'x'.repeat(5001) }, 'between 10 and 5000'],
    [{ ...valid, business: 'b'.repeat(201) }, 'Business name'],
  ])('rejects invalid input %#', (fields, expected) => {
    const r = parseInquiry('hospo_fresh', form(fields));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(expected);
  });
});

describe('isInquiryStatus', () => {
  it('only allows the three statuses', () => {
    expect(['new', 'in_progress', 'resolved'].every(isInquiryStatus)).toBe(true);
    expect(isInquiryStatus('deleted')).toBe(false);
    expect(isInquiryStatus(undefined)).toBe(false);
  });
});

describe('sanitizeSearch', () => {
  it('removes characters that could change a PostgREST filter, keeps email searches working', () => {
    expect(sanitizeSearch('jane@cafe.com.au')).toBe('jane@cafe.com.au');
    expect(sanitizeSearch('a),email.eq.x,(b')).toBe('a email.eq.x b');
    expect(sanitizeSearch('100%_*')).toBe('100');
    expect(sanitizeSearch('x'.repeat(300))).toHaveLength(100);
  });
});

describe('validateNewPassword', () => {
  it('enforces length and confirmation', () => {
    expect(validateNewPassword('short', 'short')).toMatch(/12/);
    expect(validateNewPassword('correct horse battery', 'different value here')).toMatch(/match/);
    expect(validateNewPassword('correct horse battery', 'correct horse battery')).toBeNull();
  });
});
