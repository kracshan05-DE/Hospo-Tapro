import { redirect } from 'next/navigation';

// Kept so old bookmarks still work: Hospo Fresh enquiries now live in the
// shared enquiries dashboard, pre-filtered to the brand.
export default function HospoDashboardRedirect() {
  redirect('/admin/dashboard/inquiries?brand=hospo_fresh');
}
