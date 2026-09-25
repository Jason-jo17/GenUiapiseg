# Gen UI — Master Build Specification & Deployment Guide

## 1. Overview & Setup Prerequisites
This document details environment setup, configuration requirements, Docker deployment instructions, and local development operations for Gen UI.

---

## 2. Environment Variables (`.env.local`)

| Variable Name | Description | Example / Default Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://genui:genui_pass@localhost:5432/genui_db` |
| `ENCRYPTION_KEY` | 32-character AES-256 secret key | `c87b94a12e345f67890abcdef1234567` |
| `AUTH_SECRET` | NextAuth JWT signing secret | `supersecret-nextauth-token-key-32-chars` |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | `Ov23li...` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | `8a7b...` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | `sk-ant-api03-...` |
| `OPENAI_API_KEY` | OpenAI GPT-4o API Key | `sk-proj-...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API Key | `AIzaSy...` |

---

## 3. Local Development Flow
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Start local PostgreSQL database via Docker Compose
docker-compose up -d postgres

# 3. Run database migrations
npx drizzle-kit push

# 4. Launch Next.js dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the running app.

---

## 4. Docker Production Build
The project includes a multi-stage Docker build pipeline (`Dockerfile`):

```dockerfile
# Build image
docker build -t genui-api-explorer:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgres://genui:genui_pass@host.docker.internal:5432/genui_db" \
  -e ENCRYPTION_KEY="your-32-character-secret-key-!" \
  -e AUTH_SECRET="your-nextauth-secret-key-32-chars!" \
  --name genui-app \
  genui-api-explorer:latest
```
---

## 5. System Health Check & Verification Checklist
1. **Database Connectivity**: Verify PostgreSQL connection on startup via Drizzle client.
2. **Auth Callback**: Verify GitHub OAuth sign-in flow at `/api/auth/signin`.
3. **Key Vault Encryption**: Verify creating a test key encrypts value to `iv:authTag:cipher` format in `api_keys`.
4. **Proxy Route**: Test `/api/proxy` using a sample public endpoint (e.g. `https://api.github.com/zen`).
5. **Chat Overlay**: Press `Ctrl+Shift+Space`, send prompt "Show me weather APIs", confirm `ApiCard` grid widget renders.
