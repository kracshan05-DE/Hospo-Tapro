'use client';

import type { Inquiry } from '@/lib/types';
import { toSafeCsv } from '@/lib/csv';
import InquiryCard from './InquiryCard';

const BRAND_LABEL = { hospo_fresh: 'Hospo Fresh', tapro: 'Tapro' } as const;
const STATUS_LABEL = { new: 'New', in_progress: 'In progress', resolved: 'Resolved' } as const;

export default function InquiriesList({ inquiries, filtered }: { inquiries: Inquiry[]; filtered: boolean }) {
  function handleDownload() {
    const headers = ['Received', 'Brand', 'Status', 'Name', 'Email', 'Business', 'Phone', 'Enquiry Type', 'Message', 'Notes'];
    const rows = inquiries.map((r) => [
      new Date(r.created_at).toLocaleString(),
      BRAND_LABEL[r.brand],
      STATUS_LABEL[r.status],
      r.name,
      r.email,
      r.business ?? '',
      r.phone ?? '',
      r.enquiry_type ?? '',
      r.message,
      r.admin_notes ?? '',
    ]);
    const blob = new Blob([toSafeCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (inquiries.length === 0) {
    return (
      <div className="empty-admin">
        {filtered ? 'No enquiries match these filters.' : 'No enquiries have been submitted yet.'}
      </div>
    );
  }

  return (
    <div>
      <div className="form-actions">
        <button className="btn-secondary" onClick={handleDownload}>
          Download CSV ({inquiries.length} shown)
        </button>
      </div>
      <div className="admin-product-list">
        {inquiries.map((inq) => (
          <InquiryCard key={inq.id} inquiry={inq} />
        ))}
      </div>
    </div>
  );
}
