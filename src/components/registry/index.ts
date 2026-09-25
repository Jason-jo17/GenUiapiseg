/**
 * Component Registry — maps AI tool names to deterministic React components.
 * 
 * The AI NEVER generates markup. It calls a tool → produces typed data →
 * this registry maps the tool name to the appropriate component.
 */

import type { ComponentType } from 'react';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COMPONENT_REGISTRY: Record<string, ComponentType<any>> = {
  search_apis: ApiCard,
  get_api_details: SetupGuideCard,
  try_api: ApiTryItPanel,
  show_keys: KeyVaultCard,
  fetch_data: FetchDataRenderer,
  list_categories: CategoryGrid,
  explain: MarkdownPanel,
  // Fallbacks
  error: ErrorCard,
  json: JsonViewer,
};

export type RegistryKey = keyof typeof COMPONENT_REGISTRY;

/**
 * Resolve a tool name to its component.
 * Falls back to JsonViewer if not found.
 */
export function resolveComponent(toolName: string): ComponentType<Record<string, unknown>> {
  return (COMPONENT_REGISTRY[toolName] as ComponentType<Record<string, unknown>>) ?? JsonViewer;
}
