# Gen UI — Generative UI Engine & Component Registry Specification

## 1. Executive Summary
The Generative UI Engine in Gen UI decouples AI tool execution from raw text generation. When the AI model selects an action (e.g., searching an API directory, displaying key credentials, presenting an interactive request builder), it emits a structured JSON payload governed by Zod schemas. The frontend interceptor maps the tool invocation directly to a pre-built React component in the **Component Registry**, creating interactive, application-grade UI widgets in real-time.

---

## 2. Tool Architecture & Zod Schemas

### Tool Definitions (`src/lib/ai-tools.ts`)

| Tool Name | Purpose | Zod Parameters | Rendered Component |
| :--- | :--- | :--- | :--- |
| `search_apis` | Search and filter public API catalog | `query`, `category`, `auth`, `httpsOnly`, `corsOnly`, `limit` | `ApiCard` Grid |
| `get_api_details` | Detailed setup instructions & docs | `name` | `SetupGuideCard` |
| `try_api` | Interactive form to invoke endpoint | `apiName`, `endpoint`, `method`, `params` | `ApiTryItPanel` |
| `show_keys` | Manage & test stored API credentials | `service`, `action` (`list`, `add`, `test`) | `KeyVaultCard` |
| `fetch_data` | Execute live API call & display results | `url`, `method`, `headers`, `body`, `keyService`, `displayAs` | `FetchDataRenderer` / `DataTable` |
| `list_categories` | Browsable category overview grid | `highlight` | `CategoryGrid` |
| `explain` | Render formatted markdown guide | `title`, `content`, `type` | `MarkdownPanel` |

---

## 3. Component Registry Resolver (`src/components/registry/index.ts`)

```typescript
import { ComponentType } from 'react';
import { ApiCard } from './ApiCard';
import { ApiTryItPanel } from './ApiTryItPanel';
import { DataTable } from './DataTable';
import { JsonViewer } from './JsonViewer';
import { KeyVaultCard } from './KeyVaultCard';
import { SetupGuideCard } from './SetupGuideCard';
import { ErrorCard } from './ErrorCard';
import { MarkdownPanel } from './MarkdownPanel';
import { CategoryGrid } from './CategoryGrid';
import { FetchDataRenderer } from './FetchDataRenderer';

export const COMPONENT_REGISTRY: Record<string, ComponentType<any>> = {
  search_apis: ApiCard,
  get_api_details: SetupGuideCard,
  try_api: ApiTryItPanel,
  show_keys: KeyVaultCard,
  fetch_data: FetchDataRenderer,
  list_categories: CategoryGrid,
  explain: MarkdownPanel,
  error: ErrorCard,
  json: JsonViewer,
};

export function resolveComponent(toolName: string): ComponentType<Record<string, unknown>> {
  return COMPONENT_REGISTRY[toolName] ?? JsonViewer;
}
```

---

## 4. Widget Features & Interactivity
- **`ApiCard`**: Displays search results, auth requirement badges (No Auth, apiKey, OAuth), HTTPS/CORS flags, and custom action buttons ("Try It", "Setup Guide").
- **`ApiTryItPanel`**: Interactive HTTP request builder with method selector, query parameters editor, headers config, and automatic CORS proxy trigger.
- **`KeyVaultCard`**: Encrypted API Key manager with mask toggles, quick copy, latency testing, and inline creation dialog.
- **`FetchDataRenderer`**: Dual view mode switcher (Interactive Formatted Data Table vs Syntax-highlighted JSON Inspector with node collapsing).
- **`ErrorBoundary`**: React Error Boundary wrapper around every tool invocation, ensuring component runtime errors do not crash the chat session.
