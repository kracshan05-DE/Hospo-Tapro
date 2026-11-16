import DeveloperCredit from '@/components/shared/DeveloperCredit';

export default function Footer() {
  return (
    <footer className="site-footer">
      <span className="flogo">Tapro by Hospo Fresh</span>
      Premium Spices &amp; Hospitality Essentials · Product of Sri Lanka · © {new Date().getFullYear()}
      {' · '}
      <a href="/privacy">
        Privacy Policy
      </a>
      <DeveloperCredit className="fcredit" />
    </footer>
  );
}
