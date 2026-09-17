import Reveal from './Reveal';

const VALUES = [
  {
    title: 'Authenticity',
    body: 'Recipes and ingredients rooted in genuine Sri Lankan culinary tradition — nothing imitated, nothing shortcut.',
  },
  {
    title: 'Quality',
    body: 'Every jar and bottle held to exceptional, modern quality standards, from harvest to shelf.',
  },
  {
    title: 'Craftsmanship',
    body: 'A refined, contemporary identity inspired by modern Ceylon luxury — trust, in every detail.',
  },
];

export default function Values() {
  return (
    <section id="values">
      <div className="wrap">
        <div className="values-grid">
          {VALUES.map((v, i) => (
            <Reveal as="div" delay={i} className="value" key={v.title}>
              <svg className="sprig" viewBox="0 0 40 40">
                <path d="M20 4 C10 12 10 28 20 36 C30 28 30 12 20 4Z" />
                <path d="M20 4 V36" />
              </svg>
              <h4>{v.title}</h4>
              <p>{v.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
