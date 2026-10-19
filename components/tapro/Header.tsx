'use client';

import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/', label: 'Hospo Fresh' },
  { href: '#manifesto', label: 'Story' },
  { href: '#collection', label: 'Collection' },
  { href: '#heritage', label: 'Heritage' },
  { href: '#contact', label: 'Contact' },
];

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen);
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <>
      <header className={`site-header${solid ? ' solid' : ''}`}>
        <a href="#hero" className="logo-mark">
          Tapro
        </a>
        <nav className="desktop-nav" aria-label="Main">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="nav-toggle"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
          aria-controls="tapro-mobile-nav"
          onClick={() => setNavOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      {/* Closed: visibility:hidden (see globals.css) removes the links from
          the tab order and the accessibility tree, not just from view. */}
      <nav id="tapro-mobile-nav" className="nav-scrim" aria-label="Main (mobile)">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setNavOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
