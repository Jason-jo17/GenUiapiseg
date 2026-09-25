'use client';

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);

interface MarkdownPanelProps {
  title: string;
  content: string;
  type?: 'info' | 'guide' | 'warning' | 'tip';
}

const TYPE_CONFIG = {
  info: { icon: 'ℹ', className: 'markdown-panel--info' },
  guide: { icon: '📖', className: 'markdown-panel--guide' },
  warning: { icon: '⚠', className: 'markdown-panel--warning' },
  tip: { icon: '💡', className: 'markdown-panel--tip' },
};

// Simple markdown-like renderer (no external deps)
function renderText(content: string): string {
  return content
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');
}

export function MarkdownPanel({ title, content, type = 'info' }: MarkdownPanelProps) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  
  // Split by code blocks
  const parts = content.split(/```(\w+)?\n([\s\S]*?)```/g);
  // parts structure: text, language, code, text, language, code, ...
  
  const renderedParts = [];
  let i = 0;
  while (i < parts.length) {
    if (parts[i]) {
      renderedParts.push(
        <div 
          key={i} 
          dangerouslySetInnerHTML={{ __html: `<p>${renderText(parts[i])}</p>` }} 
          className="markdown-text-part"
        />
      );
    }
    if (i + 2 < parts.length) {
      const lang = parts[i + 1] || 'text';
      const code = parts[i + 2];
      renderedParts.push(
        <div key={i + 1} className="markdown-code-part markdown-code-container">
          <SyntaxHighlighter language={lang} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', fontSize: '0.9rem' }}>
            {code.trim()}
          </SyntaxHighlighter>
        </div>
      );
    }
    i += 3;
  }
  
  return (
    <div className={`markdown-panel ${config.className}`}>
      <div className="markdown-panel__header">
        <span className="markdown-panel__icon">{config.icon}</span>
        <h3 className="markdown-panel__title">{title}</h3>
      </div>
      <div className="markdown-panel__content">
        {renderedParts}
      </div>
    </div>
  );
}
