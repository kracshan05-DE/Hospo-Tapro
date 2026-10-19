import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SITE_CSP } from '@/lib/csp';
import './globals.css';

// Fonts are self-hosted (files in app/fonts, SIL Open Font License) instead of
// fetched from Google Fonts at build time: the build never depends on an
// external service, and no visitor request goes to Google.
const serif = localFont({
  src: [
    { path: '../../fonts/cormorant-garamond-latin-wght-normal.woff2', weight: '300 700', style: 'normal' },
    { path: '../../fonts/cormorant-garamond-latin-wght-italic.woff2', weight: '300 700', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
});

const sans = localFont({
  src: '../../fonts/montserrat-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-sans',
  display: 'swap',
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

// Independent root layout for Tapro (own <html>/<body>, fonts and CSS
// variables), so its tokens never collide with Hospo Fresh's.
export default function TaproRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={SITE_CSP} />
      </head>
      <body>{children}</body>
    </html>
  );
}
