# Gen UI — Generative UI API Explorer

<div align="center">

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-v4.3.15-black?style=for-the-badge&logo=vercel)](https://sdk.vercel.ai/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**An AI-native developer workbench that turns natural language API exploration into interactive, executable React components.**

[Quick Start](#-quick-start) • [Architecture](#-architecture) • [Features](#-features) • [Security & Vault](#-security--vault) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 💡 What is Gen UI?

Traditional API portals force developers to juggle static documentation, curl commands, and separate Postman collections. Typical AI chat interfaces only output markdown code blocks that must be copied and pasted elsewhere.

**Gen UI** replaces passive text with **Structured Generative UI Tool Calling**:
1. When you ask about an API or test an endpoint, the AI calls strongly-typed **Zod tools**.
2. A deterministic **Component Registry** resolves each tool call directly to an interactive, stateful React widget (`ApiCard`, `ApiTryItPanel`, `SetupGuideCard`, `KeyVaultCard`, `FetchDataRenderer`).
3. You can execute live requests, view formatted payloads, securely store your API credentials, and pin panels directly to your persistent workspace canvas.

---

## 🏛 Architecture

```mermaid
flowchart TD
    User(["Developer / User"]) <-->|"Ctrl+Shift+Space"| ChatOverlay["Chat Overlay / Canvas UI"]
    ChatOverlay <-->|"Streaming SSE"| NextApiChat["/api/chat Route Handler"]
    NextApiChat <--> VercelAISDK["Vercel AI SDK v4"]
    VercelAISDK <--> LLM["Google Gemini / Anthropic Claude / OpenAI"]
    VercelAISDK -->|"Structured Tool Calls"| ZodTools["Zod Tool Definitions"]
    ZodTools -->|"Tool Execution Result"| CompRegistry["Deterministic Component Registry"]
    CompRegistry -->|"Interactive React Widgets"| ChatOverlay
    ChatOverlay <-->|"Live API Requests"| ProxyAPI["/api/proxy Server-side CORS Proxy"]
    ProxyAPI <--> TargetAPIs["External Public APIs"]
    ProxyAPI <-->|"AES-256-GCM"| KeyVault[("Encrypted Key Vault / PostgreSQL")]
    ChatOverlay -->|"Persist Panels"| Dashboard[("Pinned Dashboard State")]
```

---

## ✨ Features

### ⚡ Generative UI Component Engine
- **Deterministic Registry**: Every AI tool response maps directly to specialized React components:
  - `ApiCard`: Rich metadata cards showing auth requirements, HTTPS support, CORS status, and category tags.
  - `ApiTryItPanel`: Interactive API testing harness with method selectors, parameter inputs, and live execution.
  - `SetupGuideCard`: Step-by-step developer onboarding guides and SDK quickstarts.
  - `KeyVaultCard`: Instant key management UI rendered directly inside chat streams.
  - `FetchDataRenderer`: Visual data cards for live API response bodies.
  - `CategoryGrid`: Visual browser for over 1,500 curated public APIs across dozens of domains.
  - `DataTable` & `JsonViewer`: Syntax-highlighted, paginated inspection panels.
- **Fail-Safe Rendering**: Every widget is wrapped in an isolated React Error Boundary. If an API payload is malformed, an informative `ErrorCard` is displayed without breaking the conversational feed.

### 🔐 AES-256-GCM Encrypted Key Vault
- **Zero Client Leakage**: Secret keys are encrypted with AES-256-GCM and PBKDF2 key derivation (`salt:iv:authTag:ciphertext`).
- **Server-Side Injection**: Keys stored in the vault are never exposed in browser JavaScript bundles. When testing an endpoint via `/api/proxy`, the server securely decrypts the key and injects it into headers or query parameters.

### 🛡 Hardened Server-Side CORS Proxy (`/api/proxy`)
- **Bypass Browser CORS**: Execute tests against any public API without browser restrictions.
- **SSRF & Cloud Metadata Protection**: Strict DNS resolution and IP blocklists filter out loopback addresses (`127.0.0.1`), private subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), link-local addresses, and cloud provider metadata IPs (`169.254.169.254`).
- **Rate Limiting**: Integrated with Upstash Redis sliding-window rate limiting (with graceful fallback).

### 📌 Floating Canvas & Pinned Dashboard
- **Pin Any Tool Panel**: Click the pin icon on any generated component to save it to your persistent dashboard.
- **Persistent Workspace**: Panel layouts, query parameters, and configurations are stored in PostgreSQL via Drizzle ORM.

### ⌨️ Developer-First UX
- **Global Shortcut**: Press `Ctrl+Shift+Space` (or click the floating dock icon) from any page to invoke the AI assistant.
- **Self-Correction Feedback Loop**: Mark responses with thumbs down and submit corrections; the engine re-invokes the prompt with error telemetry to auto-correct.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | High-performance React server components and route handlers |
| **UI Library** | [React 19](https://react.dev/) + [Radix UI](https://www.radix-ui.com/) | Modern primitives, accessible modal dialogs, popovers, and accordions |
| **AI Orchestration** | [Vercel AI SDK v4](https://sdk.vercel.ai/) | Multi-model tool calling (`@ai-sdk/google`, `@ai-sdk/anthropic`, `@ai-sdk/openai`) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) | Type-safe migrations and relational schemas |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) (`Auth.js`) | JWT sessions with GitHub OAuth and Drizzle Adapter |
| **Cryptography** | Node.js `crypto` | AES-256-GCM symmetric encryption with PBKDF2 key derivation |
| **Styling** | Vanilla CSS Tokens + CSS Variables | Glassmorphism design system, dark mode, responsive layout |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent icons |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker](https://www.docker.com/) & Docker Compose (for local PostgreSQL)
- An API Key for your preferred LLM provider (Google Gemini, Anthropic Claude, or OpenAI)

### 1. Clone the Repository
```bash
git clone https://github.com/Jason-jo17/GenUiapiseg.git
cd GenUiapiseg
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required values:
- `DATABASE_URL`: PostgreSQL connection string (default matches `docker-compose.yml`)
- `GENUI_VAULT_PASSPHRASE`: Strong passphrase for the AES-256-GCM key vault
- `AUTH_SECRET`: Random 32+ character string (`openssl rand -base64 32`)
- `GOOGLE_GENERATIVE_AI_API_KEY` (or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`)

### 4. Start PostgreSQL Database
```bash
docker-compose up -d postgres
```

### 5. Run Database Migrations
Push the Drizzle schema to PostgreSQL:
```bash
npx drizzle-kit push
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Press `Ctrl+Shift+Space` to start exploring!

---

## 🐳 Docker Deployment

A production-ready, multi-stage `Dockerfile` and `docker-compose.yml` are included.

### Run with Docker Compose
```bash
docker-compose up -d --build
```
This boots both the Next.js application container and the PostgreSQL database container with automatic healthchecks.

### Standalone Docker Build
```bash
docker build -t genui-api-explorer:latest .

docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgres://genui:genui_pass@host.docker.internal:5432/genui_db" \
  -e GENUI_VAULT_PASSPHRASE="your-secure-passphrase-here" \
  -e AUTH_SECRET="your-32-char-auth-secret-here" \
  -e GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key" \
  --name genui-app \
  genui-api-explorer:latest
```

---

## 🔒 Security Architecture

| Security Mechanism | Implementation Details |
| :--- | :--- |
| **AES-256-GCM Vault** | Keys are encrypted using PBKDF2-derived 256-bit keys and random initialization vectors (IVs). Raw secret values are never transmitted to client bundles or logged. |
| **SSRF Mitigation** | The server-side proxy (`/api/proxy`) validates target hosts against DNS records, blocking all loopback, link-local, private LAN ranges, and AWS/GCP cloud metadata IP `169.254.169.254`. |
| **Session Isolation** | All stored keys, chat threads, and pinned panels enforce strict PostgreSQL row-level foreign-key scoping tied to authenticated `userId`s. |
| **Rate Limiting** | Optional Upstash Redis rate limiting prevents abuse of the CORS proxy endpoint. |

---

## 📁 Project Structure

```
├── .agents/                    # Agent workflows and project build specifications
├── data/
│   ├── mnema_docs/             # Architectural specifications & technical design docs
│   └── public-apis-snapshot.json # 1,500+ curated public APIs database
├── docker-compose.yml          # Local PostgreSQL & multi-container orchestration
├── Dockerfile                  # Multi-stage production container build
├── drizzle.config.ts           # Drizzle ORM configuration
├── package.json
├── src/
│   ├── auth.ts                 # NextAuth.js v5 authentication configuration
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/           # Vercel AI SDK streaming route & tool invocations
│   │   │   ├── keys/           # Encrypted API key CRUD operations
│   │   │   └── proxy/          # SSRF-protected CORS API proxy with key auto-injection
│   │   ├── dashboard/          # Pinned component canvas dashboard
│   │   ├── explorer/           # Category-based API catalog explorer
│   │   ├── keys/               # API Key Vault management page
│   │   ├── settings/           # User preferences and model provider settings
│   │   ├── layout.tsx          # Root layout with AppShell and SessionProvider
│   │   └── page.tsx            # Interactive landing page with quick action chips
│   ├── components/
│   │   ├── chat/               # ChatOverlay, ChatMessage, and Streaming Feed
│   │   ├── dashboard/          # Drag-and-drop pinned panel grid
│   │   ├── layout/             # Navigation sidebar, header, and app shell
│   │   └── registry/           # Deterministic Generative UI Component Registry
│   │       ├── ApiCard.tsx
│   │       ├── ApiTryItPanel.tsx
│   │       ├── SetupGuideCard.tsx
│   │       ├── KeyVaultCard.tsx
│   │       ├── FetchDataRenderer.tsx
│   │       └── ErrorCard.tsx
│   ├── db/
│   │   ├── index.ts            # Drizzle database client initialization
│   │   └── schema.ts           # PostgreSQL schema (users, keys, threads, panels)
│   ├── lib/
│   │   ├── ai-tools.ts         # Zod schemas for Generative UI tool definitions
│   │   ├── crypto.ts           # AES-256-GCM encryption/decryption utilities
│   │   └── public-apis-data.ts # Public API querying and category indexing engine
│   └── styles/                 # Global CSS variables, themes, and animations
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ by <a href="https://github.com/Jason-jo17">Jason-jo17</a> and contributors.
</div>
