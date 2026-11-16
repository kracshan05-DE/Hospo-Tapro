import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SITE_URL } from '@/lib/site';

// Fonts are bundled with the app (Fontsource builds of the Google Fonts
// originals, SIL Open Font License) instead of being downloaded from Google
// at build time, which made Vercel builds fail whenever that download did.
const cormorant = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: './fonts/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/cormorant-garamond-latin-600-italic.woff2', weight: '600', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

const montserrat = localFont({
  src: [
    { path: './fonts/montserrat-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './fonts/montserrat-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/montserrat-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/montserrat-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/montserrat-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/tapro' },
  title: 'Tapro by Hospo Fresh — A New Standard of Excellence',
  description:
    'Premium Sri Lankan sauces, sambols, spices and coconut oil — crafted from island heritage, refined for the modern gourmet table.',
  openGraph: {
    title: 'Tapro by Hospo Fresh',
    description:
      'Premium Sri Lankan sauces, sambols, spices and coconut oil — crafted from island heritage, refined for the modern gourmet table.',
    type: 'website',
    url: '/tapro',
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
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
