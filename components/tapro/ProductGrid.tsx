import Reveal from './Reveal';
import type { Product } from '@/lib/types';

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <section id="collection" aria-labelledby="collection-title">
      <div className="wrap">
        <Reveal as="div" delay={0} className="section-head">
          <div className="eyebrow">The Collection</div>
          <h2 id="collection-title">
            Lift the velvet.
            <br />
            Reveal the flavour.
          </h2>
          <p>
            {products.length
              ? `${products.length} signature products, each one veiled the way Tapro presents them to the world — drawn back to show the craft beneath.`
              : 'Signature products, veiled the way Tapro presents them to the world — drawn back to show the craft beneath.'}
          </p>
        </Reveal>
      </div>

      <ul className="grid" role="list">
        {products.length === 0 && <li className="empty-collection">More products are on the way.</li>}
        {products.map((p, i) => (
          // tabIndex lets keyboard users focus a card, which expands its
          // description the same way hovering does (see .card:focus-visible).
          <Reveal as="li" delay={i % 3} key={`${i}-${p.name}`} className="card" tabIndex={0}>
            <div className="num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="card-art">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- static export serves images as-is
                <img
                  src={p.image}
                  alt={`${p.name}${p.volume ? ` – ${p.volume}` : ''}`}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : (
                <span className="placeholder">
                  <span className="placeholder-mark">Tapro</span>
                  <span className="placeholder-note">Photo coming soon</span>
                </span>
              )}
            </div>
            <div className="card-caption">
              {p.volume && <div className="vol">{p.volume}</div>}
              <h3>{p.name}</h3>
              {p.description && <p>{p.description}</p>}
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
