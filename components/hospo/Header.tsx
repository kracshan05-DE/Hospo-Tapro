'use client';

import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#products', label: 'Products' },
  { href: '#solutions', label: 'Why Hospo Fresh' },
  { href: '#industries', label: 'Industries' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

// `homePath` is "" on the home page (so links are plain "#section" anchors)
// and "/" on other pages such as /privacy (so they lead back home).
export default function Header({ homePath = '' }: { homePath?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the mobile menu, as users of keyboards and switch devices expect.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    // Sticky (not fixed): it stays in normal flow, so nothing needs measuring
    // in JavaScript and the page never jumps when it loads. Anchor targets
    // are offset below it via scroll-padding-top in globals.css.
    <div className="site-top">
      <div className="top">
        <span>Foodservice supplier • importer • distributor • manufacturer</span>
        <span>
          Wholesale enquiries: <a href="tel:+61493449072">0493 449 072</a>
        </span>
      </div>

      <header>
        <a href={homePath || '#'} className="logo-link">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export serves images as-is */}
          <img className="logo" src="/hospo-fresh-logo.png" alt="Hospo Fresh home" width={44} height={44} />
        </a>
        {/* Visible next to the logo at every screen size, so the sister brand
            is never buried inside the mobile menu. */}
        <a href="/tapro" className="tapro-mark">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export serves images as-is */}
          <img src="/tapro-logo.png" alt="Tapro by Hospo Fresh" width={120} height={49} />
        </a>
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={`${homePath}${l.href}`}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="header-btn desktop-only" href={`${homePath}#contact`}>
          Wholesale Enquiry
        </a>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <nav id="mobile-nav" className={`mobile-nav${menuOpen ? ' open' : ''}`} aria-label="Main (mobile)">
        {LINKS.map((l) => (
          <a key={l.href} href={`${homePath}${l.href}`} onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
        <a className="header-btn" href={`${homePath}#contact`} onClick={() => setMenuOpen(false)}>
          Wholesale Enquiry
        </a>
      </nav>
    </div>
  );
}
