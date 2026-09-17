import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '#products', label: 'Products' },
  { href: '#solutions', label: 'Why Hospo Fresh' },
  { href: '#industries', label: 'Industries' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fixedRef = useRef<HTMLDivElement>(null);
  const [spacerHeight, setSpacerHeight] = useState(0);

  const authLink = isAdmin
    ? { href: '/admin/dashboard/hospo-fresh', label: 'Dashboard' }
    : { href: '/admin/login', label: 'Sign In' };

  useEffect(() => {
    function measure() {
      if (fixedRef.current) setSpacerHeight(fixedRef.current.offsetHeight);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [menuOpen]);

  return (
    <>
      <div className="site-fixed-top" ref={fixedRef}>
        <div className="top">
          <span>Foodservice supplier • importer • distributor • manufacturer</span>
          <span>Wholesale enquiries: 0493 449 072</span>
        </div>

        <header>
          <a href="#">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo" src="/hospo-fresh-logo.png" alt="Hospo Fresh" />
          </a>
          {/* No "desktop-only" here on purpose — this stays visible next to
              the logo at every screen size, so it never gets buried inside
              the hamburger menu on mobile. */}
          <a href="/tapro" className="tapro-mark">
            Tapro
          </a>
          <nav className="nav">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
            <a href={authLink.href} className="auth-link">
              {authLink.label}
            </a>
          </nav>
          <a className="header-btn desktop-only" href="#contact">
            Wholesale Enquiry
          </a>
          <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>

        {/* Tapro is deliberately NOT repeated in here — it's already
            permanently visible next to the logo above, on every screen size. */}
        <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href={authLink.href} className="auth-link" onClick={() => setMenuOpen(false)}>
            {authLink.label}
          </a>
          <a className="header-btn" href="#contact" onClick={() => setMenuOpen(false)}>
            Wholesale Enquiry
          </a>
        </div>
      </div>

      <div style={{ height: spacerHeight }} />
    </>
  );
}