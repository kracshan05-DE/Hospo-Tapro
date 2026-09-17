'use client';

import { useEffect, useState } from 'react';

const BASE_LINKS = [
  { href: '/', label: 'Hospo Fresh' },
  { href: '#manifesto', label: 'Story' },
  { href: '#collection', label: 'Collection' },
  { href: '#heritage', label: 'Heritage' },
  { href: '#contact', label: 'Contact' },
];

export default function Header({ isAdmin = false }: { isAdmin?: boolean }) {
  const [solid, setSolid] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const links = isAdmin
    ? [...BASE_LINKS, { href: '/admin/dashboard/tapro', label: 'Admin' }]
    : [...BASE_LINKS, { href: '/admin/login', label: 'Sign In' }];

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen);
  }, [navOpen]);

  return (
    <>
      <header className={`site-header${solid ? ' solid' : ''}`}>
        <a href="#hero" className="logo-mark">
          Tapro <span>Hospo Fresh</span>
        </a>
        <nav className="desktop-nav">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={l.label === 'Admin' || l.label === 'Sign In' ? 'admin-link' : ''}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button className="nav-toggle" aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen} onClick={() => setNavOpen((v) => !v)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <div className="nav-scrim">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setNavOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
