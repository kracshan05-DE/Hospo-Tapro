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
        {/* The list is rendered twice for a seamless loop; the copy is hidden
            from screen readers so each phrase is announced once. */}
        {items.map((text, i) => (
          <span key={i} aria-hidden={i >= ITEMS.length ? true : undefined}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
