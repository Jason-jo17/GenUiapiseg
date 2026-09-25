'use client';

import { useState } from 'react';
import type { PublicApi } from '@/lib/public-apis-data';
import { SmartDataRenderer } from './data-views/SmartDataRenderer';

interface ApiTryItPanelProps {
  apiName: string;
  api: PublicApi | null;
  endpoint: string;
  method: string;
  params: Record<string, string>;
  requiresKey: boolean;
}

export function ApiTryItPanel({ apiName, api, endpoint: initialEndpoint, method: initialMethod, params: initialParams, requiresKey }: ApiTryItPanelProps) {
  const [url, setUrl] = useState(initialEndpoint);
  const [method, setMethod] = useState(initialMethod || 'GET');
  const [headers, setHeaders] = useState('');
  const [body, setBody] = useState('');
  const [params, setParams] = useState(
    Object.entries(initialParams || {}).map(([k, v]) => ({ key: k, value: v }))
  );
  const [response, setResponse] = useState<{
    status: number;
    ok: boolean;
    data: unknown;
    latencyMs: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  const addParam = () => setParams(p => [...p, { key: '', value: '' }]);
  const updateParam = (i: number, field: 'key' | 'value', val: string) =>
    setParams(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeParam = (i: number) => setParams(p => p.filter((_, idx) => idx !== i));

  const buildUrl = () => {
    const validParams = params.filter(p => p.key.trim());
    if (validParams.length === 0) return url;
    const qs = validParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    const base = url.includes('?') ? url : `${url}?`;
    return `${base}${qs}`;
  };

  const execute = async () => {
    setLoading(true);
    setResponse(null);
    
    try {
      let parsedHeaders: Record<string, string> = {};
      if (headers.trim()) {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch {
          // Try key:value format
          headers.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > -1) {
              parsedHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
            }
          });
        }
      }
      
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: buildUrl(),
          method,
          headers: parsedHeaders,
          body: method !== 'GET' ? body : undefined,
        }),
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        status: 0,
        ok: false,
        data: null,
        latencyMs: 0,
        error: err instanceof Error ? err.message : 'Request failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="try-it-panel">
      <div className="try-it-panel__header">
        <h3 className="try-it-panel__title">
          <span className="try-it-panel__icon">▶</span>
          Try {apiName}
        </h3>
        {api && (
          <a href={api.link} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--xs">
            📖 Docs ↗
          </a>
        )}
      </div>

      {requiresKey && (
        <div className="try-it-panel__key-notice">
          <span>🔑</span>
          <span>This API requires a key. Add it in the <strong>Key Vault</strong> for auto-injection.</span>
        </div>
      )}

      {/* URL + Method bar */}
      <div className="try-it-panel__url-bar">
        <select
          className="try-it-panel__method"
          value={method}
          onChange={e => setMethod(e.target.value)}
          aria-label="HTTP Method"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          className="try-it-panel__url-input"
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          spellCheck={false}
        />
        <button
          className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
          onClick={execute}
          disabled={loading || !url}
        >
          {loading ? '⟳' : '▶ Send'}
        </button>
      </div>

      {/* Tabs */}
      <div className="try-it-panel__tabs">
        {(['params', 'headers', 'body'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'params' && params.length > 0 && (
              <span className="tab-btn__badge">{params.filter(p => p.key).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="try-it-panel__tab-content">
        {activeTab === 'params' && (
          <div className="param-editor">
            {params.map((p, i) => (
              <div key={i} className="param-row">
                <input
                  className="param-row__input"
                  placeholder="Key"
                  value={p.key}
                  onChange={e => updateParam(i, 'key', e.target.value)}
                />
                <input
                  className="param-row__input"
                  placeholder="Value"
                  value={p.value}
                  onChange={e => updateParam(i, 'value', e.target.value)}
                />
                <button className="param-row__remove" onClick={() => removeParam(i)}>×</button>
              </div>
            ))}
            <button className="btn btn--ghost btn--xs" onClick={addParam}>+ Add Parameter</button>
          </div>
        )}
        
        {activeTab === 'headers' && (
          <textarea
            className="try-it-panel__textarea"
            placeholder={'{ "X-API-Key": "your-key-here" }\n// or use key:value format'}
            value={headers}
            onChange={e => setHeaders(e.target.value)}
            rows={5}
          />
        )}
        
        {activeTab === 'body' && (
          <textarea
            className="try-it-panel__textarea"
            placeholder='{ "key": "value" }'
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={7}
            disabled={method === 'GET'}
          />
        )}
      </div>

      {/* Response */}
      {response && (
        <div className={`try-it-panel__response ${response.ok ? 'try-it-panel__response--ok' : 'try-it-panel__response--error'}`}>
          <div className="response-meta">
            <span className={`status-badge ${response.ok ? 'status-badge--ok' : 'status-badge--error'}`}>
              {response.status || 'ERR'}
            </span>
            <span className="response-latency">{response.latencyMs}ms</span>
            {response.error && <span className="response-error-msg">{response.error}</span>}
          </div>
          <div className="response-body-container">
            {response.error ? (
              <pre className="response-body">{response.error}</pre>
            ) : (
              <SmartDataRenderer data={response.data} category={api?.category} url={url} />
            )}
          </div>
          <div className="response-actions">
            <button
              className="btn btn--ghost btn--xs"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
              }}
            >
              📋 Copy
            </button>
            <button
              className="btn btn--ghost btn--xs"
              onClick={() => window.dispatchEvent(new CustomEvent('genui:pin-panel', {
                detail: {
                  title: `${apiName} Response`,
                  tool_name: 'fetch_data',
                  props_json: JSON.stringify({ data: response.data, url, method, status: 'ready' }),
                }
              }))}
            >
              📌 Pin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
