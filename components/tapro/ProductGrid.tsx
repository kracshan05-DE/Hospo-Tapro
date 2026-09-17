import Image from 'next/image';
import Reveal from './Reveal';
import type { Product } from '@/lib/types';

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section id="collection">
      <div className="wrap">
        <Reveal as="div" delay={0} className="section-head">
          <div className="eyebrow">The Collection</div>
          <h2>
            Lift the velvet.
            <br />
            Reveal the flavour.
          </h2>
          <p>
            {products.length
              ? `${products.length} signature products, each one veiled the way Tapro presents them to the world — drawn back to show the craft beneath.`
              : "Signature products, veiled the way Tapro presents them to the world — drawn back to show the craft beneath."}
          </p>
        </Reveal>
      </div>

      <div className="grid">
        {products.length === 0 && <div className="empty-collection">More products are on the way.</div>}
        {products.map((p, i) => (
          <Reveal as="div" delay={i % 3} key={p.id} className="card">
            <div className="card-inner">
              <div className="num">{String(i + 1).padStart(2, '0')}</div>
              <div className="card-art">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                    style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
                  />
                ) : (
                  <span className="placeholder">Tapro</span>
                )}
              </div>
              <div className="card-face">
                {p.volume && <div className="vol">{p.volume}</div>}
                <h3>{p.name}</h3>
                <p>{p.description}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
