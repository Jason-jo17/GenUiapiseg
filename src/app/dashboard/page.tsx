'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { resolveComponent } from '@/components/registry';
import type { PinnedPanel } from '@/db/schema';

export default function DashboardPage() {
  const { status } = useSession();
  const [panels, setPanels] = useState<PinnedPanel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPanels();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchPanels = async () => {
    try {
      const res = await fetch('/api/pinned');
      if (res.ok) {
        const data = await res.json();
        setPanels(data.panels || []);
      }
    } catch (err) {
      console.error('Failed to fetch pinned panels', err);
    } finally {
      setLoading(false);
    }
  };

  const unpinPanel = async (id: string) => {
    try {
      const res = await fetch(`/api/pinned?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPanels(panels.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to unpin panel', err);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Your pinned components and saved API data will appear here.
        </p>
      </header>

      {loading ? (
        <div className="dashboard-loading">Loading...</div>
      ) : status === 'unauthenticated' ? (
        <div className="empty-state">
          <h3 className="empty-state__title">Sign in to see your dashboard</h3>
          <p className="empty-state__desc">
            Pinned panels are saved per account. Log in to view or create them.
          </p>
          <button className="btn btn--primary" onClick={() => signIn('github')}>
            Log in with GitHub
          </button>
        </div>
      ) : panels.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state__title">No pinned items yet</h3>
          <p className="empty-state__desc">
            Open the AI chat (<kbd>Ctrl+Shift+Space</kbd>), generate some UI components, and click the "Pin" icon to save them to your dashboard.
          </p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {panels.map(panel => {
            let props = {};
            try {
              props = JSON.parse(panel.propsJson);
            } catch (e) {}

            const Component = resolveComponent(panel.toolName);

            return (
              <div key={panel.id} className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <h3 className="dashboard-panel__title">{panel.title}</h3>
                  <button 
                    onClick={() => unpinPanel(panel.id)}
                    className="dashboard-panel__unpin-btn"
                    title="Unpin"
                  >
                    ✕
                  </button>
                </div>
                <div className="dashboard-panel__content">
                  <Component {...props} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
