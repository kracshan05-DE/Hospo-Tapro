import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const sans = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  title: 'Tapro by Hospo Fresh — A New Standard of Excellence',
  description:
    'Premium Sri Lankan sauces, sambols, spices and coconut oil — crafted from island heritage, refined for the modern gourmet table.',
  openGraph: {
    title: 'Tapro by Hospo Fresh',
    description:
      'Premium Sri Lankan sauces, sambols, spices and coconut oil — crafted from island heritage, refined for the modern gourmet table.',
    type: 'website',
  },
};

// Independent root layout for Tapro (own <html>/<body>, own fonts, own CSS
// variables). Because this is a separate root layout from Hospo Fresh's and
// the admin section's, its :root color tokens (--red, --gold, --ink, etc.)
// never collide with Hospo Fresh's or the admin theme's tokens of the same
// name, and client-side navigation between "/" and "/tapro" triggers a full
// document swap rather than a soft navigation that could leak styles.
export default function TaproRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
