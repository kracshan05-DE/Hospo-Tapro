import Header from '@/components/hospo/Header';
import { createClient } from '@/lib/supabase-server';

export const metadata = { title: 'Privacy Policy | Hospo Fresh Group' };

// One shared privacy policy for both brands (Hospo Fresh and Tapro), since
// they're operated by the same company and this app is one codebase.
// Placed under the Hospo Fresh route group so it inherits that layout/CSS;
// linked from both brands' footers and contact forms as "/privacy".
export default async function PrivacyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header isAdmin={!!user} />
      <main>
        <section style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="eyebrow">Legal</div>
          <h1 style={{ fontSize: 34, margin: '10px 0 28px', color: '#123d61' }}>Privacy Policy</h1>

          <p style={{ color: 'var(--muted)', marginBottom: 18 }}>
            This policy covers both hospofresh.com.au (Hospo Fresh) and the Tapro collection,
            operated by the same company. Last updated {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>

          <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>What we collect</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            When you submit an enquiry through our contact forms, we collect the name, email
            address, and message you provide, and — for Hospo Fresh wholesale enquiries —
            optionally your business name, phone number and enquiry type. We do not collect this
            information any other way; we don&apos;t use tracking cookies or third-party
            advertising scripts on this site.
          </p>

          <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>Why we collect it</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            Solely to respond to your enquiry — to contact you back by email or phone about
            products, wholesale accounts, or the question you raised. We do not sell, rent, or
            share this information with third parties for marketing purposes.
          </p>

          <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>Bot protection</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            Our contact forms use Cloudflare Turnstile to verify submissions are from a real
            person rather than automated software. Cloudflare processes a small amount of
            technical data (such as your IP address and browser signals) to perform this check.
            See{' '}
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
              Cloudflare&apos;s privacy policy
            </a>{' '}
            for details.
          </p>

          <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>How long we keep it</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            Enquiry records are retained only as long as needed to respond to and follow up on
            your enquiry, and are periodically reviewed and removed.
          </p>

          <h2 style={{ fontSize: 20, margin: '28px 0 10px' }}>Your rights</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 12 }}>
            You can ask us to access, correct, or delete the information we hold about you at any
            time by emailing{' '}
            <a href="mailto:info@hospofresh.com.au" style={{ textDecoration: 'underline' }}>
              info@hospofresh.com.au
            </a>
            .
          </p>
        </section>
      </main>
      <footer>
        <div className="copyright">© {new Date().getFullYear()} Hospo Fresh Group. All rights reserved.</div>
      </footer>
    </>
  );
}
