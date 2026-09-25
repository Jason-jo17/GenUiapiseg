import type { Metadata } from 'next';
import { AppShell } from '@/components/AppShell';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'GenUI API Explorer — Discover & Interact with 1,500+ Public APIs',
  description: 'A generative UI chat shell for exploring, testing, and managing public APIs. Ask in natural language, get interactive UI components.',
  keywords: ['API explorer', 'public APIs', 'generative UI', 'AI chat', 'developer tools'],
};

import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider>
          <AppShell>
            {children}
          </AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
