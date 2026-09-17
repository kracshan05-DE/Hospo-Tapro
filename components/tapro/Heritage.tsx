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
          <cite>The Tapro Promise</cite>
        </Reveal>
        <Reveal as="div" delay={1} className="split-art">
          <svg className="laurel" viewBox="0 0 200 200">
            <ellipse cx="100" cy="100" r="70" />
            <path d="M100 30 C 80 60, 80 140, 100 170" />
            <path d="M70 45 Q60 55 65 65" />
            <path d="M65 65 Q55 75 60 85" />
            <path d="M62 88 Q52 98 58 108" />
            <path d="M60 112 Q50 122 56 132" />
            <path d="M130 45 Q140 55 135 65" />
            <path d="M135 65 Q145 75 140 85" />
            <path d="M138 88 Q148 98 142 108" />
            <path d="M140 112 Q150 122 144 132" />
            <circle className="fill" cx="100" cy="100" r="6" />
          </svg>
        </Reveal>
      </div>
    </section>
  );
}
