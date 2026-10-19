import Reveal from './Reveal';

export default function Heritage() {
  return (
    <section id="heritage">
      <div className="split">
        <Reveal as="div" delay={0} className="split-copy">
          <div className="eyebrow heritage-eyebrow">Inspired by Heritage</div>
          <blockquote>
            Every Tapro product tells a story of Sri Lanka&apos;s rich agricultural traditions —
            combining authentic ingredients with modern quality standards.
          </blockquote>
          The Tapro Promise
        </Reveal>
        <Reveal as="div" delay={1} className="split-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/tapro-banner.webp"
            alt="Tapro by Hospo Fresh"
            className="heritage-banner"
            width={1024}
            height={434}
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  );
}