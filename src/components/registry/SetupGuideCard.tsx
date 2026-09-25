'use client';

import type { PublicApi } from '@/lib/public-apis-data';

interface SetupGuideCardProps {
  found: boolean;
  name: string;
  api: PublicApi | null;
  setupSteps: string[];
  exampleRequest: string | null;
}

export function SetupGuideCard({ found, name, api, setupSteps }: SetupGuideCardProps) {
  if (!found || !api) {
    return (
      <div className="setup-guide-card setup-guide-card--not-found">
        <span className="setup-guide-card__icon">🔍</span>
        <h3>API Not Found</h3>
        <p>Could not find an API called &quot;{name}&quot; in the catalog. Try searching with a different name.</p>
      </div>
    );
  }

  const authBadgeClass = api.auth === 'No' ? 'auth-badge--free' : api.auth === 'OAuth' ? 'auth-badge--oauth' : 'auth-badge--key';

  return (
    <div className="setup-guide-card">
      <div className="setup-guide-card__header">
        <div className="setup-guide-card__title-row">
          <h3 className="setup-guide-card__title">{api.name}</h3>
          <span className={`auth-badge ${authBadgeClass}`}>
            {api.auth === 'No' ? 'Free' : api.auth}
          </span>
        </div>
        <p className="setup-guide-card__description">{api.description}</p>
      </div>

      <div className="setup-guide-card__meta">
        <div className="meta-chip">
          <span>📂</span>
          <span>{api.category}</span>
        </div>
        {api.https && (
          <div className="meta-chip meta-chip--green">
            <span>🔒</span>
            <span>HTTPS</span>
          </div>
        )}
        {api.cors === 'Yes' && (
          <div className="meta-chip meta-chip--blue">
            <span>🌐</span>
            <span>CORS</span>
          </div>
        )}
      </div>

      <div className="setup-guide-card__steps">
        <h4 className="setup-guide-card__steps-title">
          {api.auth === 'No' ? '🚀 Quick Start' : '⚙️ Setup Steps'}
        </h4>
        <ol className="setup-steps-list">
          {setupSteps.map((step, i) => (
            <li key={i} className="setup-step">
              <span className="setup-step__number">{i + 1}</span>
              <span className="setup-step__text">{step.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="setup-guide-card__actions">
        <a
          href={api.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost"
        >
          📖 Open Documentation ↗
        </a>
        <button
          className="btn btn--primary"
          onClick={() => window.dispatchEvent(new CustomEvent('genui:try-api', { detail: { api } }))}
        >
          ▶ Try It Now
        </button>
        {api.auth !== 'No' && (
          <button
            className="btn btn--ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('genui:open-vault', {}))}
          >
            🔐 Add API Key
          </button>
        )}
      </div>
    </div>
  );
}
