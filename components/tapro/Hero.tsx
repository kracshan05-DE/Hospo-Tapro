'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="hero" className={open ? 'open' : ''}>
      <div className="hero-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Tapro-Header.jpg"
          alt="Tapro by Hospo Fresh — Authentic Sri Lankan Spice & Rice"
          className="hero-bg"
        />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow">Product of Sri Lanka</div>
        <h1 className="hero-title">
          A New Standard
          <br />
          of <em>Excellence</em>
        </h1>
      </div>
    </section>
  );
}