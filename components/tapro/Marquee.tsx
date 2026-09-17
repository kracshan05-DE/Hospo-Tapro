const ITEMS = [
  'Product of Sri Lanka',
  'Crafted With Heritage',
  'Exported Worldwide',
  'A New Standard of Excellence',
];

export default function Marquee() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee-band">
      <div className="marquee-track">
        {items.map((text, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}
