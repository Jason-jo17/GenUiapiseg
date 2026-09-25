# Gen UI — System Architecture & Technical Overview

## 1. System Overview
**Gen UI (GenUI API Explorer)** is an AI-native API discovery, testing, and interaction platform built using Next.js 15 App Router, React 19, Vercel AI SDK v4, Drizzle ORM, and PostgreSQL. 

Instead of traditional text-only chat interfaces, Gen UI utilizes **Structured Generative UI Tool Calling**. When a user requests API information, tests an endpoint, or manages API keys, the AI model invokes strongly-typed Zod tools. These tool responses are automatically dispatched through a deterministic **Component Registry**, rendering interactive, stateful React widgets (cards, forms, data tables, key vaults, setup guides) directly into the conversational feed.

```mermaid
graph TD
    User([User]) <--> ChatOverlay[Chat Overlay / Canvas UI]
    ChatOverlay <--> NextApiChat[/api/chat Route Handler]
    NextApiChat <--> VercelAISDK[Vercel AI SDK v4]
    VercelAISDK <--> LLM[Anthropic / OpenAI / Gemini LLM]
    VercelAISDK -- Tool Invocation --> ZodTools[Zod Tool Schemas & Executors]
    ZodTools -- Structured Result --> CompRegistry[Component Registry]
    CompRegistry -- Interactive Widget --> ChatOverlay
    ChatOverlay <--> ProxyAPI[/api/proxy Server-side API Proxy]
    ProxyAPI <--> TargetAPIs[External Public APIs]
    ProxyAPI <--> KeyVault[(Encrypted API Key Vault / Postgres)]
```

---

## 2. Technical Stack
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **AI Orchestration**: Vercel AI SDK (`ai` v4.3.15) with `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`
- **Database & ORM**: Drizzle ORM v0.45 + PostgreSQL 16 (`pg` v8.22)
- **Authentication**: NextAuth.js v5 (`next-auth@5.0.0-beta.31`) with Drizzle Adapter & GitHub OAuth
- **Security & Encryption**: Node.js `crypto` AES-256-GCM symmetric encryption for API Key Vault
- **Styling**: Tailwind CSS + Custom CSS Variables + Radix UI primitives + Lucide Icons
- **Containerization**: Multi-stage Dockerfile + Docker Compose with PostgreSQL service

---

## 3. Core Subsystems

### A. Generative UI Core Engine & Component Registry
- **Location**: `src/lib/ai-tools.ts`, `src/components/registry/index.ts`
- **Mechanism**: LLM executes Zod-validated tool calls (`search_apis`, `get_api_details`, `try_api`, `show_keys`, `fetch_data`, `list_categories`, `explain`). The output is mapped via `resolveComponent(toolName)` to dedicated React components (`ApiCard`, `SetupGuideCard`, `ApiTryItPanel`, `KeyVaultCard`, `FetchDataRenderer`, `CategoryGrid`, `MarkdownPanel`).

### B. Encrypted Key Vault & Server-side API Proxy
- **Location**: `src/lib/crypto.ts`, `src/app/api/keys/route.ts`, `src/app/api/proxy/route.ts`
- **Mechanism**: Secret API keys are encrypted client-side or during entry using AES-256-GCM. Decryption occurs strictly on the server during request execution within `/api/proxy`. Secret keys are auto-injected into target headers/query params without ever exposing raw credentials to the client browser or front-end JavaScript bundle.

### C. Floating Canvas & Pinned Dashboard Widgets
- **Location**: `src/components/chat/ChatOverlay.tsx`, `src/app/dashboard/page.tsx`
- **Mechanism**: Interactive widgets can be pinned directly to the user's workspace dashboard canvas. Pinned state (x/y coordinates, dimensions, tool parameters) is saved in the `pinned_panels` PostgreSQL table.

---

## 4. Security & Compliance
1. **Zero Secret Leakage**: API Key values stored in `api_keys.value_enc` are encrypted with an initialization vector (IV) and authentication tag (`iv:authTag:encryptedValue`). Raw values are never returned in list endpoints.
2. **CORS Bypassing via Server Proxy**: External API requests are executed server-to-server via `/api/proxy`, preventing browser CORS blocking while maintaining strict headers.
3. **Data Isolation**: Foreign key constraints on `userId` enforce strict tenant isolation across sessions, key vaults, chat threads, and dashboard panels.
