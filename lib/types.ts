export type Brand = 'hospo_fresh' | 'tapro';

export type InquiryStatus = 'new' | 'in_progress' | 'resolved';
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type Inquiry = {
  id: string;
  brand: Brand;
  name: string;
  email: string;
  business: string | null;
  phone: string | null;
  enquiry_type: string | null;
  message: string;
  created_at: string;
  status: InquiryStatus;
  admin_notes: string | null;
  updated_at: string;
  email_status: EmailStatus;
  email_error: string | null;
  email_sent_at: string | null;
};

export type Product = {
  id: string;
  name: string;
  volume: string;
  description: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type ProductInput = {
  name: string;
  volume: string;
  description: string;
  image_url: string;
  sort_order: number;
};
