/**
 * Public APIs data bundle.
 * 
 * Loads the curated snapshot of ~1,500 public APIs from the bundled JSON file.
 * Optionally merges with live data from api.publicapis.org.
 * 
 * Categories from https://github.com/public-apis/public-apis
 */

export interface PublicApi {
  id: string;          // slug derived from name
  name: string;
  description: string;
  auth: 'No' | 'apiKey' | 'OAuth' | 'X-Mashape-Key' | 'User-Agent' | string;
  https: boolean;
  cors: 'Yes' | 'No' | 'Unknown';
  category: string;
  link: string;
}

export const API_CATEGORIES = [
  'Animals', 'Anime', 'Anti-Malware', 'Art & Design',
  'Authentication & Authorization', 'Blockchain', 'Books', 'Business',
  'Calendar', 'Cloud Storage & File Sharing', 'Continuous Integration',
  'Cryptocurrency', 'Currency Exchange', 'Data Validation', 'Development',
  'Dictionaries', 'Documents & Productivity', 'Email', 'Entertainment',
  'Environment', 'Events', 'Finance', 'Food & Drink', 'Games & Comics',
  'Geocoding', 'Government', 'Health', 'Jobs', 'Machine Learning',
  'Music', 'News', 'Open Data', 'Open Source Projects', 'Patent',
  'Personality', 'Phone', 'Photography', 'Programming', 'Science & Math',
  'Security', 'Shopping', 'Social', 'Sports & Fitness', 'Test Data',
  'Text Analysis', 'Tracking', 'Transportation', 'URL Shorteners',
  'Vehicle', 'Video', 'Weather'
] as const;

export type ApiCategory = typeof API_CATEGORIES[number];

// Bundled snapshot — loaded at module level for fast access (no I/O on request)
let _snapshot: PublicApi[] | null = null;

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getSnapshot(): PublicApi[] {
  if (_snapshot) return _snapshot;
  
  // In Next.js, we load the JSON at import time using require() for synchronous access
  // The snapshot is placed in /public/api-data/snapshot.json and served statically
  // For server-side loading we read from /data/public-apis-snapshot.json
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('../../data/public-apis-snapshot.json') as {
      entries?: Array<{ API: string; Description: string; Auth: string; HTTPS: boolean; Cors: string; Category: string; Link: string }>;
      count?: number;
    };
    
    _snapshot = (raw.entries ?? []).map(e => ({
      id: slug(e.API),
      name: e.API,
      description: e.Description,
      auth: e.Auth || 'No',
      https: e.HTTPS,
      cors: e.Cors as 'Yes' | 'No' | 'Unknown',
      category: e.Category,
      link: e.Link,
    }));
  } catch {
    // Fallback: return empty array — live fetch will populate
    _snapshot = [];
  }
  
  return _snapshot;
}

/**
 * Fetch live data from the public-api project API endpoint.
 * Falls back to snapshot if the request fails.
 */
export async function fetchLiveApis(): Promise<PublicApi[]> {
  try {
    const res = await fetch('https://api.publicapis.org/entries', {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
      signal: AbortSignal.timeout(8000),
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json() as {
      entries: Array<{ API: string; Description: string; Auth: string; HTTPS: boolean; Cors: string; Category: string; Link: string }>;
    };
    
    return (data.entries ?? []).map(e => ({
      id: slug(e.API),
      name: e.API,
      description: e.Description,
      auth: e.Auth || 'No',
      https: e.HTTPS,
      cors: e.Cors as 'Yes' | 'No' | 'Unknown',
      category: e.Category,
      link: e.Link,
    }));
  } catch {
    // Return snapshot as fallback
    return getSnapshot();
  }
}

/**
 * Search APIs using fuzzy matching across name, description, and category.
 * Client-safe (uses simple string matching; Fuse.js is loaded lazily on client).
 */
export function searchApis(apis: PublicApi[], query: string): PublicApi[] {
  if (!query.trim()) return apis;
  const q = query.toLowerCase();
  return apis.filter(api =>
    api.name.toLowerCase().includes(q) ||
    api.description.toLowerCase().includes(q) ||
    api.category.toLowerCase().includes(q)
  );
}

/**
 * Filter APIs by category and auth type.
 */
export function filterApis(
  apis: PublicApi[],
  opts: {
    category?: string;
    auth?: string;
    httpsOnly?: boolean;
    corsOnly?: boolean;
  }
): PublicApi[] {
  return apis.filter(api => {
    if (opts.category && api.category !== opts.category) return false;
    if (opts.auth && api.auth !== opts.auth) return false;
    if (opts.httpsOnly && !api.https) return false;
    if (opts.corsOnly && api.cors !== 'Yes') return false;
    return true;
  });
}

/**
 * Group APIs by category.
 */
export function groupByCategory(apis: PublicApi[]): Record<string, PublicApi[]> {
  return apis.reduce<Record<string, PublicApi[]>>((acc, api) => {
    if (!acc[api.category]) acc[api.category] = [];
    acc[api.category].push(api);
    return acc;
  }, {});
}

/**
 * Get category icons (emoji) for display.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Animals': '🐾', 'Anime': '🎌', 'Anti-Malware': '🛡️', 'Art & Design': '🎨',
  'Authentication & Authorization': '🔐', 'Blockchain': '⛓️', 'Books': '📚',
  'Business': '💼', 'Calendar': '📅', 'Cloud Storage & File Sharing': '☁️',
  'Continuous Integration': '🔄', 'Cryptocurrency': '₿', 'Currency Exchange': '💱',
  'Data Validation': '✅', 'Development': '💻', 'Dictionaries': '📖',
  'Documents & Productivity': '📄', 'Email': '📧', 'Entertainment': '🎭',
  'Environment': '🌿', 'Events': '🎪', 'Finance': '📈', 'Food & Drink': '🍕',
  'Games & Comics': '🎮', 'Geocoding': '🗺️', 'Government': '🏛️', 'Health': '🏥',
  'Jobs': '💼', 'Machine Learning': '🤖', 'Music': '🎵', 'News': '📰',
  'Open Data': '📊', 'Open Source Projects': '🔓', 'Patent': '📜',
  'Personality': '🧠', 'Phone': '📱', 'Photography': '📷', 'Programming': '⌨️',
  'Science & Math': '🔬', 'Security': '🔒', 'Shopping': '🛍️', 'Social': '👥',
  'Sports & Fitness': '⚽', 'Test Data': '🧪', 'Text Analysis': '📝',
  'Tracking': '📍', 'Transportation': '🚗', 'URL Shorteners': '🔗',
  'Vehicle': '🚙', 'Video': '🎬', 'Weather': '🌤️',
};
