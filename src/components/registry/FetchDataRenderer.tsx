'use client';

import React, { useState, useEffect } from 'react';
import { SmartDataRenderer } from './data-views/SmartDataRenderer';
import { DataTable } from './DataTable';
import { JsonViewer } from './JsonViewer';

interface FetchDataRendererProps {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  status: string;
  displayAs?: string;
  data?: any;
}

export function FetchDataRenderer(props: FetchDataRendererProps) {
  const [response, setResponse] = useState<any>(props.data ? { data: props.data, ok: true } : null);
  const [loading, setLoading] = useState(!props.data && props.status === 'ready');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (props.status === 'ready' && !props.data) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: props.url,
              method: props.method,
              headers: props.headers || {},
              body: props.method !== 'GET' ? props.body : undefined,
            }),
          });
          const data = await res.json();
          if (!data.ok) {
            setError(data.error || 'Failed to fetch');
          }
          setResponse(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [props]);

  if (loading) {
    return (
      <div className="data-table data-table--ready fetch-data-loading">
        <span>⏳</span>
        <p>Fetching data from {props.url}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-table data-table--empty fetch-data-error">
        <span>❌</span>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (response?.data) {
    return (
      <div className="fetch-data-result">
         <div className="fetch-data-header">
            <span><span className="fetch-data-method">{props.method}</span> {props.url}</span>
            <span className={response.ok ? 'fetch-data-status--ok' : 'fetch-data-status--error'}>{response.status} {response.latencyMs}ms</span>
         </div>
         <SmartDataRenderer data={response.data} url={props.url} />
      </div>
    );
  }

  return <DataTable {...props} />;
}
