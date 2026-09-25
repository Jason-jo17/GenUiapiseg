'use client';

interface ErrorCardProps {
  error?: string;
  message?: string;
  toolName?: string;
  retryable?: boolean;
  onRetry?: () => void;
  [key: string]: unknown;
}

export function ErrorCard({ error, message, toolName, retryable = true, onRetry }: ErrorCardProps) {
  const displayMessage = error ?? message ?? 'An unexpected error occurred';

  return (
    <div className="error-card">
      <div className="error-card__icon">⚠</div>
      <div className="error-card__content">
        <h4 className="error-card__title">
          {toolName ? `Error in ${toolName}` : 'Something went wrong'}
        </h4>
        <p className="error-card__message">{displayMessage}</p>
        {retryable && onRetry && (
          <button className="btn btn--ghost btn--sm" onClick={onRetry}>
            ↺ Retry
          </button>
        )}
      </div>
    </div>
  );
}
