'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatOverlay } from '@/components/chat/ChatOverlay';
import { GlobalKeyboardListener } from '@/components/chat/GlobalKeyboardListener';

import { useSession, signIn, signOut } from 'next-auth/react';

/**
 * Client shell — wraps the app in the global chat overlay + keyboard listener.
 * This is a client component because it manages chat state.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const handlePinPanel = async (e: Event) => {
      const { title, tool_name, props_json } = (e as CustomEvent).detail;
      try {
        const res = await fetch('/api/pinned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, tool_name, props_json })
        });
        if (res.ok) {
          alert('Panel pinned to Dashboard!');
        } else {
          console.error('Failed to pin panel');
        }
      } catch (err) {
        console.error('Error pinning panel', err);
      }
    };

    const handleOpenVault = () => {
      router.push('/keys');
    };

    window.addEventListener('genui:pin-panel', handlePinPanel);
    window.addEventListener('genui:open-vault', handleOpenVault);
    
    return () => {
      window.removeEventListener('genui:pin-panel', handlePinPanel);
      window.removeEventListener('genui:open-vault', handleOpenVault);
    };
  }, [router]);

  const navLinks = [
    { href: '/', label: 'Explorer' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/keys', label: 'Keys' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <>
      <GlobalKeyboardListener
        onToggleChat={() => setChatOpen(o => !o)}
        onOpenChat={() => setChatOpen(true)}
      />
      
      {/* Navigation */}
      <nav className="app-nav">
        <div className="app-nav__inner">
          <div className="app-nav__brand">
            <span className="app-nav__logo">⚡</span>
            <span className="app-nav__name">GenUI</span>
            <span className="app-nav__tagline">API Explorer</span>
          </div>
          <div className="app-nav__links">
            {navLinks.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="app-nav__actions app-nav__actions--flex">
            {session?.user ? (
              <div className="app-nav__auth-user">
                <span className="app-nav__auth-name">
                  {session.user.name || session.user.email}
                </span>
                <button 
                  className="btn btn--ghost btn--xs"
                  onClick={() => signOut()}
                >
                  Log out
                </button>
              </div>
            ) : (
              <button 
                className="btn btn--primary btn--xs"
                onClick={() => signIn('github')}
              >
                Log in
              </button>
            )}
            <button
              className="app-nav__chat-btn"
              onClick={() => setChatOpen(o => !o)}
              aria-label="Open AI Chat (Ctrl+Shift+Space)"
              title="Open AI Chat — Ctrl+Shift+Space"
            >
              <span>💬</span>
              <span>Ask AI</span>
              <kbd className="app-nav__kbd">⌃⇧Space</kbd>
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="app-main">
        {children}
      </main>

      {/* Global chat overlay (portal) */}
      <ChatOverlay isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
