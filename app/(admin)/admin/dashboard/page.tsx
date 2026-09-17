import { redirect } from 'next/navigation';

// Single admin login now serves both brands; land on Hospo Fresh's dashboard
// by default and let the topbar switch to Tapro.
export default function DashboardIndex() {
  redirect('/admin/dashboard/hospo-fresh');
}
