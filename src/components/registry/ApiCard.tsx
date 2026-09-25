'use client';

import { useState } from 'react';
import type { PublicApi } from '@/lib/public-apis-data';
import { CATEGORY_ICONS } from '@/lib/public-apis-data';

interface ApiCardProps {
  entries: PublicApi[];
  totalCount: number;
  query?: string | null;
  category?: string | null;
  filters?: {
    auth?: string;
    httpsOnly?: boolean;
    corsOnly?: boolean;
  };
}

const AUTH_COLORS: Record<string, string> = {
  'No': 'auth-badge--free',
  'apiKey': 'auth-badge--key',
  'OAuth': 'auth-badge--oauth',
};

const AUTH_LABELS: Record<string, string> = {
  'No': 'Free',
  'apiKey': 'API Key',
  'OAuth': 'OAuth',
};

export function ApiCard({ entries, totalCount, query, category }: ApiCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="api-card-empty">
        <span className="api-card-empty__icon">🔍</span>
        <p>No APIs found{query ? ` for "${query}"` : ''}. Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="api-card-container">
      <div className="api-card-header">
        <div className="api-card-header__title">
          {category && <span className="api-card-header__icon">{CATEGORY_ICONS[category] ?? '🔗'}</span>}
          <h3>
            {query ? `Results for "${query}"` : category ? `${category} APIs` : 'API Results'}
          </h3>
        </div>
        <span className="api-card-header__count">{totalCount} APIs found</span>
      </div>

      <div className="api-card-grid">
        {entries.map(api => (
          <div
            key={api.id}
            className={`api-entry ${expanded === api.id ? 'api-entry--expanded' : ''}`}
            onClick={() => setExpanded(prev => prev === api.id ? null : api.id)}
          >
            <div className="api-entry__header">
              <div className="api-entry__name-row">
                <span className="api-entry__category-icon">{CATEGORY_ICONS[api.category] ?? '🔗'}</span>
                <span className="api-entry__name">{api.name}</span>
              </div>
              <div className="api-entry__badges">
                <span className={`auth-badge ${AUTH_COLORS[api.auth] ?? 'auth-badge--key'}`}>
                  {AUTH_LABELS[api.auth] ?? api.auth}
                </span>
                {api.https && <span className="badge badge--https">HTTPS</span>}
                {api.cors === 'Yes' && <span className="badge badge--cors">CORS</span>}
              </div>
            </div>

            <p className="api-entry__description">{api.description}</p>

            {expanded === api.id && (
              <div className="api-entry__expanded">
                <div className="api-entry__meta">
                  <span className="meta-item"><strong>Category:</strong> {api.category}</span>
                  <span className="meta-item"><strong>Auth:</strong> {api.auth === 'No' ? 'None required' : api.auth}</span>
                  <span className="meta-item"><strong>HTTPS:</strong> {api.https ? 'Yes' : 'No'}</span>
                  <span className="meta-item"><strong>CORS:</strong> {api.cors}</span>
                </div>
                <div className="api-entry__actions">
                  <a href={api.link} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                    📖 Docs
                  </a>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={e => {
                      e.stopPropagation();
                      // Dispatch event for chat to pick up
                      window.dispatchEvent(new CustomEvent('genui:try-api', { detail: { api } }));
                    }}
                  >
                    ▶ Try It
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={e => {
                      e.stopPropagation();
                      window.dispatchEvent(new CustomEvent('genui:ask-api', { detail: { api } }));
                    }}
                  >
                    💬 Ask AI
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalCount > entries.length && (
        <div className="api-card-footer">
          <span className="api-card-footer__text">Showing {entries.length} of {totalCount}</span>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => window.dispatchEvent(new CustomEvent('genui:show-more', { detail: { query, category } }))}
          >
            Show more →
          </button>
        </div>
      )}
    </div>
  );
}
