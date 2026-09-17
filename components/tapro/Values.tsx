import Reveal from './Reveal';

const VALUES = [
  {
    title: 'Authenticity',
    body: 'Recipes and ingredients rooted in genuine Sri Lankan culinary tradition — nothing imitated, nothing shortcut.',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Quality',
    body: 'Every jar and bottle held to exceptional, modern quality standards, from harvest to shelf.',
    img: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=400&q=80',
  },
  {
    title: 'Craftsmanship',
    body: 'A refined, contemporary identity inspired by modern Ceylon luxury — trust, in every detail.',
    img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80',
  },
];

export default function Values() {
  return (
    <section id="values">
      <div className="wrap">
        <div className="values-grid">
          {VALUES.map((v, i) => (
            <Reveal as="div" delay={i} className="value" key={v.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="value-photo" src={v.img} alt={v.title} />
              <h4>{v.title}</h4>
              <p>{v.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}