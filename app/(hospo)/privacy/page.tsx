import Header from '@/components/hospo/Header';

export const metadata = { title: 'Privacy Policy | Hospo Fresh Group' };

// Update this date by hand whenever the policy text changes. It is fixed on
// purpose: a date generated at build time would change on every deploy.
const LAST_UPDATED = '19 October 2026';

// One shared privacy policy for both brands (Hospo Fresh and Tapro), operated
// by the same company. Linked from both footers and both contact forms.
export default function PrivacyPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header homePath="/" />
      <main id="main" tabIndex={-1} className="legal">
        <section>
          <div className="eyebrow">Legal</div>
          <h1>Privacy Policy</h1>

          <p>
            This policy covers the Hospo Fresh and Tapro websites, operated by the same company.
            Last updated {LAST_UPDATED}.
          </p>

          <h2>What we collect</h2>
          <p>
            When you send an enquiry through one of our contact forms, we collect the name, email
            address and message you provide. Hospo Fresh enquiries may also include your business
            name, phone number and enquiry type, if you choose to give them. We do not use
            tracking cookies, analytics or advertising scripts on this site.
          </p>

          <h2>Why we collect it</h2>
          <p>
            Only to respond to your enquiry: to contact you by email or phone about products,
            wholesale accounts or the question you asked. We do not sell, rent or share your
            information with third parties for marketing.
          </p>

          <h2>Where it is stored</h2>
          <p>
            This website is hosted by Netlify, Inc. Enquiries are stored in Netlify&apos;s form
            service and emailed to our team. Netlify stores data in the United States, so your
            enquiry may be held outside Australia. Like any web host, Netlify also processes
            technical data such as your IP address to deliver the site and filter spam. See{' '}
            <a href="https://www.netlify.com/privacy/" target="_blank" rel="noreferrer">
              Netlify&apos;s privacy policy
            </a>
            .
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep enquiries only as long as we need them to respond and follow up, and we
            review and delete old enquiries regularly.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask to see, correct or delete the information we hold about you at any time
            by emailing <a href="mailto:info@hospofresh.com.au">info@hospofresh.com.au</a>.
          </p>
        </section>
      </main>
      <footer>
        <div className="copyright">
          © {new Date().getFullYear()} Hospo Fresh Group. All rights reserved.
        </div>
      </footer>
    </>
  );
}
