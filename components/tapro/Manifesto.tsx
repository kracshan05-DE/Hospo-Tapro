import Reveal from './Reveal';

export default function Manifesto({ productCount }: { productCount: number }) {
  return (
    <section id="manifesto">
      <div className="wrap">
        <Reveal delay={0} className="section-head">
          <div className="eyebrow">Authentic Sri Lankan Flavours</div>
        </Reveal>
        <Reveal as="p" delay={1} className="lede">
          Tapro offers a premium collection of authentic Sri Lankan food, inspired by the
          island&apos;s rich culinary heritage — every jar, bottle and pouch thoughtfully crafted
          for exceptional quality and true taste.
        </Reveal>
        <Reveal as="p" delay={2} className="body-txt">
          Built on a foundation of authenticity, quality, and heritage, Tapro brings Ceylon&apos;s
          finest ingredients to local and international kitchens, wrapped in a design language
          inspired by modern Ceylon luxury.
        </Reveal>

        <Reveal delay={3} className="manifesto-marks">
          <div className="mark">
            <strong>{productCount}+</strong>
            <span>Signature Products</span>
          </div>
          <div className="mark">
            <strong>100%</strong>
            <span>Sri Lankan Sourced</span>
          </div>
          <div className="mark">
            <strong>01</strong>
            <span>Standard of Excellence</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
