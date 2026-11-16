// Site credit shown in both the Hospo Fresh and Tapro footers.
// Kept in one place so the name and link can't drift between the two sites.
const DEVELOPER_NAME = 'Omicron Media';
const DEVELOPER_URL = 'https://www.instagram.com/omicron__media/';

export default function DeveloperCredit({ className = '' }: { className?: string }) {
  return (
    <span className={`developer-credit ${className}`.trim()}>
      Developed by{' '}
      <a
        href={DEVELOPER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${DEVELOPER_NAME} on Instagram (opens in a new tab)`}
      >
        {DEVELOPER_NAME}
      </a>
    </span>
  );
}
