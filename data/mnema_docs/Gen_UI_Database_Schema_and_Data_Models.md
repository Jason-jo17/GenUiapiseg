# Gen UI — Database Schema & Data Models Specification

## 1. Overview
Gen UI relies on **Drizzle ORM** configured with PostgreSQL 16. The schema handles user authentication, encrypted credential storage, conversational chat threads and message history, pinned workspace dashboard canvas state, and user application settings.

---

## 2. Schema Specification (`src/db/schema.ts`)

```mermaid
erDiagram
    users ||--o{ accounts : "has"
    users ||--o{ sessions : "has"
    users ||--o{ api_keys : "owns"
    users ||--o{ chat_threads : "owns"
    users ||--o{ pinned_panels : "owns"
    users ||--o{ app_settings : "owns"
    chat_threads ||--o{ chat_messages : "contains"

    users {
        string id PK
        string name
        string email UK
        timestamp emailVerified
        string image
    }

    api_keys {
        string id PK
        string userId FK
        string label
        string service
        string domain
        string valueEnc
        string notes
        integer isActive
        integer lastTested
        string testStatus
        integer createdAt
        integer updatedAt
    }

    chat_threads {
        string id PK
        string userId FK
        string title
        integer createdAt
        integer updatedAt
    }

    chat_messages {
        string id PK
        string threadId FK
        string userId FK
        string role
        text content
        text toolCalls
        string feedback
        text correction
        integer createdAt
    }

    pinned_panels {
        string id PK
        string userId FK
        string title
        string toolName
        text propsJson
        integer positionX
        integer positionY
        integer width
        integer height
        integer pinnedAt
        integer lastRun
    }
```

---

## 3. Detailed Data Models

### Authentication Tables
- **`users`**: User account records mapped to NextAuth providers.
- **`accounts`**: OAuth provider links (GitHub Client ID & tokens).
- **`sessions`**: Active authentication sessions with expiration timestamps.
- **`verificationTokens`**: Verification tokens for passwordless / email flows.

### Application Core Tables
- **`api_keys`**: Secret API key vault storing AES-256-GCM encrypted strings (`valueEnc`), service labels, active status, and automated test metrics.
- **`chat_threads`**: Conversational threads grouping user & assistant message turns.
- **`chat_messages`**: Granular message turns with role (`user` | `assistant` | `tool`), text content, JSON tool invocations array (`toolCalls`), user rating (`feedback`: `up` | `down`), and self-correction instructions.
- **`pinned_panels`**: Interactive canvas dashboard panels with saved layout positions (`positionX`, `positionY`, `width`, `height`), tool identifier (`toolName`), and component props (`propsJson`).
- **`app_settings`**: Per-user preferences (key-value store, dark/light theme, default LLM provider).

---

## 4. Migration & Maintenance Commands
- **Generate Migrations**: `npx drizzle-kit generate`
- **Push Schema Changes**: `npx drizzle-kit push`
- **Database Studio GUI**: `npx drizzle-kit studio`
