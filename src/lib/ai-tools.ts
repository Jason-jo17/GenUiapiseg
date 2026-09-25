/**
 * AI Tool definitions for GenUI API Explorer.
 * 
 * Each tool maps directly to a component in the registry.
 * The AI picks a tool → executes it → Zod validates output → component renders.
 * 
 * Tools use the Vercel AI SDK tool() helper with outputSchema for type safety.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getSnapshot, searchApis, filterApis } from './public-apis-data';

// ─── Shared schemas ────────────────────────────────────────────────────────────

export const ApiEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  auth: z.string(),
  https: z.boolean(),
  cors: z.enum(['Yes', 'No', 'Unknown']),
  category: z.string(),
  link: z.string(),
});

export const ApiCallResultSchema = z.object({
  status: z.number(),
  ok: z.boolean(),
  data: z.unknown(),
  headers: z.record(z.string()).optional(),
  error: z.string().optional(),
  latencyMs: z.number(),
});

// ─── Tool definitions ──────────────────────────────────────────────────────────

/**
 * Search APIs — renders ApiCard grid
 */
export const searchApisTool = tool({
  description: 'Search and browse public APIs from the catalog. Use when user asks to find, show, explore, or list APIs by name, category, or feature.',
  parameters: z.object({
    query: z.string().optional().describe('Search term (name, description keyword)'),
    category: z.string().optional().describe('Filter by category e.g. "Weather", "Cryptocurrency"'),
    auth: z.string().optional().describe('Filter by auth type: "No", "apiKey", "OAuth"'),
    httpsOnly: z.boolean().optional().describe('Only show HTTPS APIs'),
    corsOnly: z.boolean().optional().describe('Only show CORS-enabled APIs'),
    limit: z.number().optional().default(12).describe('Max results to show'),
  }),
  execute: async ({ query, category, auth, httpsOnly, corsOnly, limit = 12 }) => {
    let apis = getSnapshot();
    
    if (query) apis = searchApis(apis, query);
    apis = filterApis(apis, { category, auth, httpsOnly, corsOnly });
    
    const results = apis.slice(0, limit);
    const totalCount = apis.length;
    
    return {
      entries: results,
      totalCount,
      query: query ?? null,
      category: category ?? null,
      filters: { auth, httpsOnly, corsOnly },
    };
  },
});

/**
 * Get API details — renders SetupGuideCard
 */
export const getApiDetailsTool = tool({
  description: 'Get detailed information about a specific API including setup instructions, auth requirements, and example usage. Use when user asks "how do I use X API", "setup X", "what can I do with X".',
  parameters: z.object({
    name: z.string().describe('The API name to look up'),
  }),
  execute: async ({ name }) => {
    const apis = getSnapshot();
    const api = apis.find(a => a.name.toLowerCase().includes(name.toLowerCase()));
    
    if (!api) {
      return {
        found: false,
        name,
        api: null,
        setupSteps: [],
        exampleRequest: null,
      };
    }

    // Generate contextual setup steps based on auth type
    const setupSteps = [];
    if (api.auth === 'apiKey') {
      setupSteps.push(`1. Visit ${api.link} and sign up for an account`);
      setupSteps.push('2. Navigate to the API dashboard or developer section');
      setupSteps.push('3. Generate your API key');
      setupSteps.push('4. Save the key in the GenUI Key Vault (Keys tab)');
      setupSteps.push('5. Use the "Try It" feature to test your first call');
    } else if (api.auth === 'OAuth') {
      setupSteps.push(`1. Register your application at ${api.link}`);
      setupSteps.push('2. Get your Client ID and Client Secret');
      setupSteps.push('3. Implement the OAuth flow (or use the built-in browser helper)');
      setupSteps.push('4. Exchange the authorization code for an access token');
      setupSteps.push('5. Store tokens securely in the Key Vault');
    } else {
      setupSteps.push('No authentication required — this API is free to use!');
      setupSteps.push(`1. Visit ${api.link} for documentation`);
      setupSteps.push('2. Use the "Try It" panel to make your first request');
    }

    return {
      found: true,
      name: api.name,
      api,
      setupSteps,
      exampleRequest: api.link,
    };
  },
});

/**
 * Try an API — renders ApiTryItPanel  
 */
export const tryApiTool = tool({
  description: 'Show an interactive form to try calling an API. Use when user says "try", "call", "test", "invoke", or "make a request to" an API.',
  parameters: z.object({
    apiName: z.string().describe('Name of the API to try'),
    endpoint: z.string().optional().describe('Specific endpoint or URL'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().default('GET'),
    params: z.record(z.string()).optional().describe('Query parameters'),
  }),
  execute: async ({ apiName, endpoint, method = 'GET', params }) => {
    const apis = getSnapshot();
    const api = apis.find(a => a.name.toLowerCase().includes(apiName.toLowerCase()));
    
    return {
      apiName,
      api: api ?? null,
      endpoint: endpoint ?? api?.link ?? '',
      method,
      params: params ?? {},
      requiresKey: api?.auth === 'apiKey' || api?.auth === 'OAuth',
    };
  },
});

/**
 * Show key vault — renders KeyVaultCard
 */
export const showKeysTool = tool({
  description: 'Show the API key vault. Use when user asks to see, manage, add, or check their stored API keys.',
  parameters: z.object({
    service: z.string().optional().describe('Filter keys by service name'),
    action: z.enum(['list', 'add', 'test']).optional().default('list'),
  }),
  execute: async ({ service, action = 'list' }) => {
    return {
      action,
      service: service ?? null,
      message: action === 'add' 
        ? 'Use the form below to add a new API key'
        : 'Your stored API keys (values are encrypted)',
    };
  },
});

/**
 * Fetch data from an API — renders DataTable or JsonViewer
 */
export const fetchDataTool = tool({
  description: 'Actually call an API endpoint and show the results as a data table or JSON viewer. Use when user wants to see live data from an API they have a key for.',
  parameters: z.object({
    url: z.string().describe('The full URL to call'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
    keyService: z.string().optional().describe('Name of the service to look up key for auto-injection'),
    displayAs: z.enum(['table', 'json', 'chart', 'image']).optional().default('json'),
  }),
  execute: async ({ url, method = 'GET', headers, body, displayAs = 'json' }) => {
    // This is the "render form" step — actual execution happens in /api/proxy
    return {
      url,
      method,
      headers: headers ?? {},
      body: body ?? null,
      displayAs,
      status: 'ready', // actual fetch happens client-side via /api/proxy
    };
  },
});

/**
 * Show categories — renders CategoryGrid
 */
export const listCategoriesTool = tool({
  description: 'Show all API categories as a browsable grid. Use when user asks what categories are available or wants to browse by topic.',
  parameters: z.object({
    highlight: z.string().optional().describe('Category to highlight'),
  }),
  execute: async ({ highlight }) => {
    const apis = getSnapshot();
    const counts: Record<string, number> = {};
    apis.forEach(api => {
      counts[api.category] = (counts[api.category] ?? 0) + 1;
    });
    
    return {
      categories: Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      highlight: highlight ?? null,
      total: apis.length,
    };
  },
});

/**
 * Show markdown explanation — renders MarkdownPanel
 */
export const explainTool = tool({
  description: 'Show a formatted explanation, guide, or information panel. Use when user asks a question that needs a written explanation rather than a component.',
  parameters: z.object({
    title: z.string(),
    content: z.string().describe('Markdown-formatted content'),
    type: z.enum(['info', 'guide', 'warning', 'tip']).optional().default('info'),
  }),
  execute: async ({ title, content, type = 'info' }) => {
    return { title, content, type };
  },
});

/**
 * All tools exported for use in the chat route
 */
export const ALL_TOOLS = {
  search_apis: searchApisTool,
  get_api_details: getApiDetailsTool,
  try_api: tryApiTool,
  show_keys: showKeysTool,
  fetch_data: fetchDataTool,
  list_categories: listCategoriesTool,
  explain: explainTool,
} as const;

export type ToolName = keyof typeof ALL_TOOLS;
