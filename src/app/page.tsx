import { getSnapshot, groupByCategory, CATEGORY_ICONS } from '@/lib/public-apis-data';
import { HomeActionChips } from '@/components/HomeActionChips';

export default async function HomePage() {
  const apis = getSnapshot();
  const grouped = groupByCategory(apis);
  const categories = Object.entries(grouped)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20); // Show top 20 categories

  const stats = {
    total: apis.length,
    free: apis.filter(a => a.auth === 'No').length,
    withKey: apis.filter(a => a.auth === 'apiKey').length,
    oauth: apis.filter(a => a.auth === 'OAuth').length,
  };

  return (
    <div className="home-page">
      {/* Hero section */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__badge">
            <span>⚡</span>
            <span>Generative UI · 1,500+ APIs</span>
          </div>
          <h1 className="hero__title">
            Explore APIs with
            <span className="hero__title-accent"> Natural Language</span>
          </h1>
          <p className="hero__subtitle">
            Ask questions in chat — get interactive UI components. Discover, test, and manage 
            public APIs without reading docs. Press <kbd>Ctrl+Shift+Space</kbd> from anywhere.
          </p>

          {/* Quick action chips */}
          <HomeActionChips />
        </div>

        {/* Stats bar */}
        <div className="hero__stats">
          <div className="stat-item">
            <span className="stat-item__value">{stats.total}</span>
            <span className="stat-item__label">Total APIs</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-item__value">{stats.free}</span>
            <span className="stat-item__label">No Auth</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-item__value">{stats.withKey}</span>
            <span className="stat-item__label">API Key</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-item__value">{stats.oauth}</span>
            <span className="stat-item__label">OAuth</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-item__value">{Object.keys(grouped).length}</span>
            <span className="stat-item__label">Categories</span>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="category-section">
        <div className="section-header">
          <h2 className="section-header__title">Browse by Category</h2>
          <p className="section-header__sub">Click any category or ask in chat to explore</p>
        </div>

        <div className="category-grid-home">
          {categories.map(([category, catApis]) => (
            <a
              key={category}
              href={`/explorer/${encodeURIComponent(category)}`}
              className="category-card-home"
            >
              <div className="category-card-home__icon">{CATEGORY_ICONS[category] ?? '🔗'}</div>
              <div className="category-card-home__info">
                <span className="category-card-home__name">{category}</span>
                <span className="category-card-home__count">{catApis.length} APIs</span>
              </div>
              <span className="category-card-home__arrow">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* Feature highlight */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-header__title">Designed for Developers</h2>
        </div>
        <div className="features-grid">
          {[
            {
              icon: '⚡',
              title: 'Generative UI',
              desc: 'AI selects the right component — never generates raw HTML. Deterministic, fast, accessible.',
            },
            {
              icon: '🔐',
              title: 'Encrypted Key Vault',
              desc: 'Store API keys locally with AES-256-GCM encryption. Auto-injected in proxy calls.',
            },
            {
              icon: '🌐',
              title: 'CORS Proxy',
              desc: 'Server-side proxy bypasses browser CORS. Works with any API, no setup needed.',
            },
            {
              icon: '📌',
              title: 'Pin & Save',
              desc: 'Pin generated UI panels to your dashboard. Re-run with live data anytime.',
            },
            {
              icon: '↺',
              title: 'Self-Correcting',
              desc: 'Thumbs down? Add a correction and the AI retries with your feedback baked in.',
            },
            {
              icon: '⌨️',
              title: 'Ctrl+Shift+Space',
              desc: 'Open the AI chat from anywhere in the app with a global keyboard shortcut.',
            },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
