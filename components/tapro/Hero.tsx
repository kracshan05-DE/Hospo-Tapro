'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="hero" className={open ? 'open' : ''}>
      <div className="curtain-tex"></div>
      <div className="curtain-vignette"></div>
      <div className="panel left"></div>
      <div className="panel right"></div>
      <div className="hero-content">
        <div className="hero-eyebrow">Product of Sri Lanka</div>
        <h1 className="hero-title">
          A New Standard
          <br />
          of <em>Excellence</em>
        </h1>
        <p className="hero-sub">
          Premium Sri Lankan sauces, sambols, spices and coconut oil — crafted from island
          heritage, refined for the modern gourmet table.
        </p>
      </div>
      <div className="scroll-cue">
        <div className="line"></div>
        <span>Scroll</span>
      </div>
    </section>
  );
}
