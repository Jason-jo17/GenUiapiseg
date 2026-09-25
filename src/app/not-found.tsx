import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <h1 className="not-found-title">404</h1>
      <h2 className="not-found-subtitle">Page Not Found</h2>
      <p className="not-found-desc">
        We couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/" className="btn btn--primary">
        Return to Explorer
      </Link>
    </div>
  );
}
