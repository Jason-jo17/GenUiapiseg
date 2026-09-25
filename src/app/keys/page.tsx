'use client';

import { useSession, signIn } from 'next-auth/react';
import { KeyVaultCard } from '@/components/registry/KeyVaultCard';

export default function KeysPage() {
  const { status } = useSession();

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Key Vault</h1>
        <p className="page-description">
          Manage your API keys securely. Keys are encrypted with AES-256-GCM before being saved to the Postgres database.
        </p>
      </header>

      {status === 'unauthenticated' ? (
        <div className="empty-state">
          <h3 className="empty-state__title">Sign in to manage your keys</h3>
          <p className="empty-state__desc">
            API keys are stored per account. Log in to view or add keys.
          </p>
          <button className="btn btn--primary" onClick={() => signIn('github')}>
            Log in with GitHub
          </button>
        </div>
      ) : (
        <KeyVaultCard />
      )}
    </div>
  );
}
