import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  title: 'Hospo Fresh | Foodservice Supplier',
  description:
    'Hospo Fresh - reliable foodservice supply, importing, distribution and manufacturing for hospitality businesses.',
};

// Independent root layout for the Hospo Fresh public site — see the comment
// in app/(admin)/layout.tsx for why this app has three separate root layouts.
export default function HospoRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
