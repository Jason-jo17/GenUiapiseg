'use client';

import { useState } from 'react';

interface JsonViewerProps {
  data?: unknown;
  url?: string;
  method?: string;
  status?: number;
  ok?: boolean;
  latencyMs?: number;
  error?: string;
  displayAs?: string;
  [key: string]: unknown;
}

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (value === null) return <span className="json-null">null</span>;
  if (value === undefined) return <span className="json-null">undefined</span>;
  if (typeof value === 'boolean') return <span className="json-bool">{String(value)}</span>;
  if (typeof value === 'number') return <span className="json-number">{value}</span>;
  if (typeof value === 'string') return <span className="json-string">&quot;{value}&quot;</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="json-bracket">[]</span>;
    return (
      <span className="json-collapsible">
        <button className="json-toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▶' : '▼'}
        </button>
        {collapsed ? (
          <span className="json-bracket json-collapsed">[{value.length} items]</span>
        ) : (
          <>
            <span className="json-bracket">[</span>
            <div className="json-children">
              {value.map((item, i) => (
                <div key={i} className="json-entry">
                  <span className="json-index">{i}:</span>
                  <JsonNode value={item} depth={depth + 1} />
                  {i < value.length - 1 && <span className="json-comma">,</span>}
                </div>
              ))}
            </div>
            <span className="json-bracket">]</span>
          </>
        )}
      </span>
    );
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as object);
    if (keys.length === 0) return <span className="json-bracket">{'{}'}</span>;
    return (
      <span className="json-collapsible">
        <button className="json-toggle" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '▶' : '▼'}
        </button>
        {collapsed ? (
          <span className="json-bracket json-collapsed">&#123;{keys.length} keys&#125;</span>
        ) : (
          <>
            <span className="json-bracket">&#123;</span>
            <div className="json-children">
              {keys.map((key, i) => (
                <div key={key} className="json-entry">
                  <span className="json-key">&quot;{key}&quot;</span>
                  <span className="json-colon">:</span>
                  <JsonNode value={(value as Record<string, unknown>)[key]} depth={depth + 1} />
                  {i < keys.length - 1 && <span className="json-comma">,</span>}
                </div>
              ))}
            </div>
            <span className="json-bracket">&#125;</span>
          </>
        )}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

export function JsonViewer({ data, url, status, ok, latencyMs, error }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="json-viewer">
      <div className="json-viewer__header">
        <span className="json-viewer__title">JSON Response</span>
        <div className="json-viewer__meta">
          {status && (
            <span className={`status-badge ${ok ? 'status-badge--ok' : 'status-badge--error'}`}>
              {status}
            </span>
          )}
          {latencyMs && <span className="response-latency">{latencyMs}ms</span>}
          {url && <span className="json-viewer__url">{url}</span>}
        </div>
        <button className="btn btn--ghost btn--xs" onClick={copy}>
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      
      {error && (
        <div className="json-viewer__error">
          <span>⚠</span> {error}
        </div>
      )}
      
      <div className="json-viewer__content">
        <JsonNode value={data} />
      </div>
    </div>
  );
}
