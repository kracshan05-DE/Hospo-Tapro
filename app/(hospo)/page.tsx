import ContactForm from '@/components/hospo/ContactForm';
import Header from '@/components/hospo/Header';
import { createClient } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header isAdmin={!!user} />

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">Built for busy kitchens</div>
            <h1>
              Everything Your Kitchen Needs.
              <br />
              <strong>One Reliable Supplier.</strong>
            </h1>
            <p>Foodservice • Wholesale • Importing • Distribution • Manufacturing</p>
            <p>
              Supporting Melbourne hospitality businesses with an extensive range of food, frozen
              products, specialty Asian ingredients and hospitality essentials.
            </p>
            <div className="buttons">
              <a className="btn gold" href="#products">
                Shop Products →
              </a>
              <a className="btn outline" href="#contact">
                Open a Wholesale Account →
              </a>
              <a className="btn outline" href="#contact">
                Contact Our Team
              </a>
            </div>
          </div>
        </section>

        <div className="stats">
          <div className="stat">
            <div>
              <strong>2018</strong>
              <span>Established</span>
            </div>
          </div>
          <div className="stat">
            <div>
              <strong>1,000+</strong>
              <span>Foodservice Products</span>
            </div>
          </div>
          <div className="stat">
            <div>
              <strong>Dry • Chilled • Frozen</strong>
              <span>Product Range</span>
            </div>
          </div>
          <div className="stat">
            <div>
              <strong>Melbourne</strong>
              <span>Based Distribution</span>
            </div>
          </div>
          <div className="stat">
            <div>
              <strong>Wholesale</strong>
              <span>Foodservice Supply</span>
            </div>
          </div>
        </div>

        <section>
          <div className="trust">
            <div>
              <b>Reliable supply</b>
              <span>Products you can count on for daily operations.</span>
            </div>
            <div>
              <b>Dry • Chilled • Frozen</b>
              <span>A broad range across your kitchen essentials.</span>
            </div>
            <div>
              <b>Asian food specialists</b>
              <span>Authentic ingredients for diverse menus.</span>
            </div>
            <div>
              <b>One supplier</b>
              <span>Save time by bringing more of your buying together.</span>
            </div>
          </div>
        </section>

        <section id="products" className="cream">
          <div className="section-head">
            <div className="eyebrow">Product range</div>
            <h2>Stock your kitchen with confidence.</h2>
            <p>Explore everyday staples, specialty ingredients and hospitality essentials.</p>
          </div>
          <div className="grid">
            {[
              { title: 'Rice, Grains & Flour', desc: 'Staples for kitchens of every size.', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80' },
              { title: 'Spices & Seasonings', desc: 'Big flavour for authentic dishes.', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80' },
              { title: 'Coconut Products', desc: 'Coconut milk, cream and more.', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80' },
              { title: 'Sauces & Condiments', desc: 'Essential pantry flavours.', img: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80' },
              { title: 'Frozen Foods', desc: 'Convenient ingredients for busy service.', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80' },
              { title: 'Nuts & Dried Fruit', desc: 'For cooking, baking and serving.', img: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=800&q=80' },
              { title: 'Packaging & Takeaway', desc: 'Practical solutions for takeaway service.', img: '/packaging-image.png' },
              { title: 'Hospitality Essentials', desc: 'Useful supplies for day-to-day operations.', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80' },
            ].map((p) => (
              <div className="card" key={p.title}>
                {p.img ? (
                  <div className="card-img" style={{ backgroundImage: `url('${p.img}')` }} />
                ) : (
                  <div className="card-img placeholder">Photo coming soon</div>
                )}
                <div className="card-body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="solutions" className="dark">
          <div className="section-head">
            <div className="eyebrow">Why Hospo Fresh</div>
            <h2>More than a supplier.</h2>
            <p>We help food businesses simplify sourcing, keep kitchens moving and build dependable supply.</p>
          </div>
          <div className="solutions">
            {[
              ['01', 'Broad product range', 'Bring more of your regular purchasing under one roof.'],
              ['02', 'Importing expertise', 'Access authentic products from trusted food categories.'],
              ['03', 'Distribution', 'A foodservice-focused approach designed around business customers.'],
              ['04', 'Repacking & manufacturing', 'In-house capability for selected products and formats.'],
              ['05', 'Private label', 'Support for businesses looking to develop their own range.'],
              ['06', 'Brand distribution', 'Helping quality food brands reach foodservice customers.'],
            ].map(([num, title, desc]) => (
              <div className="solution" key={num}>
                <div className="num">{num}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <div className="eyebrow">Cuisine</div>
            <h2>Ingredients for the flavours your customers love.</h2>
          </div>
          <div className="cuisine">
            {[
              ['Sri Lankan', 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=800&q=80'],
              ['Malaysian', 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=800&q=80'],
              ['Indonesian', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80'],
              ['Indian & South Indian', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80'],
              ['South-East Asian', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80'],
            ].map(([label, img]) => (
              <div key={label} style={{ backgroundImage: `url('${img}')` }}>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="industries" className="cream">
          <div className="section-head">
            <div className="eyebrow">Who we serve</div>
            <h2>Built for businesses like yours.</h2>
          </div>
          <div className="industries">
            {[
              ['Restaurants', 'Keep your kitchen stocked for everyday service.'],
              ['Cafés', 'Reliable staples and ingredients for your menu.'],
              ['Caterers', 'Flexible sourcing for events and large orders.'],
              ['Bakeries', 'Ingredients and supplies for production.'],
              ['Hotels & Pubs', 'Foodservice products across multiple kitchen needs.'],
              ['Food Trucks', 'Practical products for fast-moving operations.'],
            ].map(([title, desc]) => (
              <div className="industry" key={title}>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="cta">
          <div>
            <h2>Ready to simplify your supply?</h2>
            <p>Talk to Hospo Fresh about wholesale products and supply options.</p>
          </div>
          <a className="btn" href="#contact">
            Request a Wholesale Enquiry
          </a>
        </div>

        <section id="about">
          <div className="about">
            <div className="about-img" />
            <div>
              <div className="eyebrow">About Hospo Fresh</div>
              <h2>A foodservice partner built around your business.</h2>
              <p>Hospo Fresh is an Australian foodservice supplier, importer, distributor and manufacturer serving hospitality and food businesses.</p>
              <p>From everyday staples to specialty Asian food products, our focus is simple: dependable products, practical service and a supply partner you can grow with.</p>
              <a className="btn" style={{ background: 'var(--green)', color: '#fff', marginTop: 12 }} href="#contact">
                Contact Us
              </a>
            </div>
          </div>
        </section>

        <section className="cream">
          <div className="outlet">
            <div className="outlet-box">
              <div className="eyebrow">Factory Outlet</div>
              <h2>Visit us in Cranbourne West.</h2>
              <p>Shop selected products and speak with the team at our factory outlet.</p>
              <strong>Address</strong>
              <p>8 Lonhro Blvd, Cranbourne West VIC 3977</p>
              <strong>Opening hours</strong>
              <p>Monday–Saturday: 9:00am–3:00pm</p>
            </div>
            <div className="outlet-box">
              <h3>Need the catalogue?</h3>
              <p>Ask our team for the latest product catalogue and wholesale information.</p>
              <a className="btn" style={{ background: 'var(--green)', color: '#fff' }} href="#contact">
                Get the Catalogue
              </a>
            </div>
          </div>
        </section>

        <section id="contact">
          <div className="section-head">
            <div className="eyebrow">Get in touch</div>
            <h2>Let&apos;s talk supply.</h2>
            <p>Send an enquiry and our team can help with products, wholesale supply and distribution.</p>
          </div>
          <div className="contact">
            <div className="contact-info">
              <h3>Hospo Fresh</h3>
              <p>
                <b>Phone</b>
                <br />
                <a href="tel:0493449072">0493 449 072</a>
              </p>
              <p>
                <b>Email</b>
                <br />
                <a href="mailto:info@hospofresh.com.au">info@hospofresh.com.au</a>
              </p>
              <p>
                <b>Address</b>
                <br />
                8 Lonhro Blvd, Cranbourne West VIC 3977
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="footer-logo" src="/hospo-fresh-logo.png" alt="Hospo Fresh" />
            <p>Foodservice supply, importing, distribution and manufacturing for hospitality businesses.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <a href="#products">Products</a>
            <a href="#products">Categories</a>
            <a href="#contact">Catalogue</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#solutions">Capabilities</a>
            <a href="#contact">Wholesale</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="tel:0493449072">0493 449 072</a>
            <a href="mailto:info@hospofresh.com.au">info@hospofresh.com.au</a>
            <a href="#contact">Cranbourne West, VIC</a>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
        <div className="copyright">© {new Date().getFullYear()} Hospo Fresh. All rights reserved.</div>
      </footer>
    </>
  );
}
