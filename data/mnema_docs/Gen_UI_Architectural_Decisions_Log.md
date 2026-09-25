# Gen UI — Architectural Decisions & Rationale

## Decision 1: Structured Tool Calling over Raw Markdown AI Responses
- **Context**: LLMs typically generate unstructured text or markdown blocks. Rendering complex API interfaces, key management tables, or interactive HTTP builders in plain text results in poor UX and high user friction.
- **Decision**: Adopt Vercel AI SDK v4 Tool Calling with Zod schemas. LLMs execute discrete, typed tools. Output payloads are passed into a deterministic React Component Registry.
- **Consequences**: Guaranteed type safety, clean separation of UI presentation from model generation, prevention of hallucinated UI markups, and seamless interactive state management.

---

## Decision 2: Server-Side API Proxy for Zero Secret Key Exposure
- **Context**: Browser security restricts calling external APIs directly due to CORS rules. Exposing secret API keys in client-side code opens credentials to extraction and abuse.
- **Decision**: Build `/api/proxy` server route handler that decrypts credentials in server memory and executes server-to-server HTTP requests.
- **Consequences**: Zero raw API key exposure in browser client, complete CORS bypassing, built-in server-side latency monitoring, and centralized error logging.

---

## Decision 3: Drizzle ORM + PostgreSQL for Multi-Tenant Data Persistence
- **Context**: The app requires relational mapping between users, authentication sessions, encrypted keys, chat message history, and workspace canvas dashboard configurations.
- **Decision**: Use Drizzle ORM paired with PostgreSQL 16.
- **Consequences**: Type-safe database queries, seamless integration with NextAuth v5 via `@auth/drizzle-adapter`, ultra-fast query execution, and lightweight migration handling via `drizzle-kit`.

---

## Decision 4: Global Floating Canvas Overlay with Global Hotkey Access
- **Context**: Users need access to the Generative UI assistant while exploring any section of the API directory or managing key vaults without losing context.
- **Decision**: Implement `ChatOverlay.tsx` with backdrop overlay and attach a global keyboard event listener (`GlobalKeyboardListener.tsx`) bound to `Ctrl+Shift+Space`.
- **Consequences**: Instant workspace availability from any page route, persistent conversational thread context, and non-intrusive UI ergonomics.
