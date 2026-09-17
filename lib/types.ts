export type Brand = 'hospo_fresh' | 'tapro';

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
