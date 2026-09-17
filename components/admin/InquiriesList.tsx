'use client';

import type { Inquiry } from '@/lib/types';
import { toSafeCsv } from '@/lib/csv';

export default function InquiriesList({
  inquiries,
  csvFilePrefix,
}: {
  inquiries: Inquiry[];
  csvFilePrefix: string;
}) {
  function handleDownload() {
    const headers = ['Date', 'Name', 'Email', 'Business', 'Phone', 'Enquiry Type', 'Message'];
    const rows = inquiries.map((r) => [
      new Date(r.created_at).toLocaleString(),
      r.name,
      r.email,
      r.business ?? '',
      r.phone ?? '',
      r.enquiry_type ?? '',
      r.message,
    ]);
    const csv = toSafeCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${csvFilePrefix}-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (inquiries.length === 0) {
    return <div className="empty-admin">No enquiries have been submitted yet.</div>;
  }

  return (
    <div>
      <div className="form-actions">
        <button className="btn-primary" onClick={handleDownload}>
          Download CSV ({inquiries.length} on this page)
        </button>
      </div>

      <div className="admin-product-list">
        {inquiries.map((inq) => (
          <div className="inquiry-row" key={inq.id}>
            <div className="meta">
              {inq.enquiry_type || 'General enquiry'} · {new Date(inq.created_at).toLocaleString()}
            </div>
            <h3 style={{ margin: '8px 0 0' }}>{inq.name}</h3>
            <p className="contact-line">
              <a href={`mailto:${inq.email}`}>{inq.email}</a>
              {inq.phone && <> · {inq.phone}</>}
              {inq.business && <> · {inq.business}</>}
            </p>
            <p className="msg">{inq.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
