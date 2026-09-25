'use client';

import React from 'react';
import { JsonViewer } from '../JsonViewer';
import { DataTable } from '../DataTable';
import { WeatherCard } from './WeatherCard';

interface SmartDataRendererProps {
  data: any;
  category?: string;
  url?: string;
}

export function SmartDataRenderer({ data, category, url }: SmartDataRendererProps) {
  if (!data) return <JsonViewer data={data} url={url} />;

  // 1. Heuristics based on category
  if (category === 'Weather' || (data.latitude !== undefined && data.longitude !== undefined && (data.generationtime_ms !== undefined || data.current_weather || data.current))) {
    return <WeatherCard data={data} />;
  }

  // 2. Arrays or lists usually render best as DataTables
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    return <DataTable data={data} url={url} />;
  }
  
  // 3. Fallback: Check if it's an object with a single array property (e.g. { results: [...] })
  if (typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data);
    if (keys.length === 1 && Array.isArray(data[keys[0]])) {
      const arr = data[keys[0]];
      if (arr.length > 0 && typeof arr[0] === 'object') {
         return <DataTable data={arr} url={url} />;
      }
    }
  }

  // 4. Default to JSON Viewer
  return <JsonViewer data={data} url={url} />;
}
