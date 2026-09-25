'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function SettingsPage() {
  const { status } = useSession();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || {});
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [status]);

  const saveSettings = async (newSettings: Record<string, any>) => {
    setSaving(true);
    try {
      const merged = { ...settings, ...newSettings };
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(merged);
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">
          Configure application preferences and AI models.
        </p>
      </header>

      {loading ? (
        <div className="settings-loading">Loading settings...</div>
      ) : status === 'unauthenticated' ? (
        <div className="empty-state">
          <h3 className="empty-state__title">Sign in to change settings</h3>
          <p className="empty-state__desc">
            Preferences are saved per account. Log in to view or update them.
          </p>
          <button className="btn btn--primary" onClick={() => signIn('github')}>
            Log in with GitHub
          </button>
        </div>
      ) : (
        <div className="settings-grid">
          <section className="settings-section">
            <h3 className="settings-section__title">Generative UI Model</h3>
            <p className="settings-section__desc">
              Select the LLM provider for the chat interface.
            </p>
            <div className="settings-form-group">
              <select 
                className="settings-select"
                value={settings.llm_provider || 'google'}
                onChange={(e) => saveSettings({ llm_provider: e.target.value })}
                disabled={saving}
                aria-label="Select LLM provider"
              >
                <option value="google">Google Gemini 2.5 Flash</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                <option value="openai">OpenAI GPT-4o</option>
              </select>
              {saving && <span className="settings-saving-indicator">Saving...</span>}
            </div>
          </section>

          <section className="settings-section">
            <h3 className="settings-section__title">Database & Security</h3>
            <p className="settings-section__desc">
              API keys are stored securely using AES-256-GCM encryption in the Postgres database.
            </p>
            <div className="settings-vault-status">
              <strong>Vault Passphrase Status:</strong> Set via <code>GENUI_VAULT_PASSPHRASE</code> environment variable. (Read-only for security reasons).
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
