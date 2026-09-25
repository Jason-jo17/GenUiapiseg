'use client';

interface DataTableProps {
  url?: string;
  method?: string;
  status?: string;
  displayAs?: string;
  [key: string]: unknown;
}

export function DataTable({ url, method, status, ...rest }: DataTableProps) {
  // If data is available directly render it
  const data = (rest as Record<string, unknown>).data;
  
  // Try to extract tabular data
  let rows: Record<string, unknown>[] = [];
  let columns: string[] = [];
  
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    rows = data as Record<string, unknown>[];
    columns = Object.keys(rows[0] ?? {}).slice(0, 10); // Max 10 columns for display
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    // Single object — show as key-value pairs
    rows = Object.entries(data as Record<string, unknown>).map(([k, v]) => ({ Key: k, Value: v }));
    columns = ['Key', 'Value'];
  }

  if (status === 'ready') {
    // Show a "ready to execute" state
    return (
      <div className="data-table data-table--ready">
        <div className="data-table__ready-state">
          <span>📡</span>
          <div>
            <p className="data-table__ready-title">Ready to fetch data</p>
            <code className="data-table__url">{method} {url}</code>
          </div>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="data-table data-table--empty">
        <span>📋</span>
        <p>No tabular data to display</p>
      </div>
    );
  }

  const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 60) + (JSON.stringify(value).length > 60 ? '...' : '');
    return String(value);
  };

  return (
    <div className="data-table">
      <div className="data-table__header">
        <span className="data-table__title">📊 Data</span>
        <span className="data-table__count">{rows.length} rows</span>
        {url && <code className="data-table__url">{url}</code>}
      </div>
      <div className="data-table__scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} className="table__th">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row, i) => (
              <tr key={i} className="table__tr">
                {columns.map(col => (
                  <td key={col} className="table__td">
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 50 && (
        <div className="data-table__footer">
          Showing first 50 of {rows.length} rows
        </div>
      )}
    </div>
  );
}
