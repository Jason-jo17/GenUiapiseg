'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { resolveComponent } from '@/components/registry';
import { FeedbackBar } from './FeedbackBar';
import { ErrorBoundary } from './ErrorBoundary';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant' | 'data' | 'system';
  content: string;
  parts?: Array<{
    type: string;
    text?: string;
    toolInvocation?: {
      toolCallId: string;
      toolName: string;
      state: 'call' | 'result' | 'partial-call';
      args?: Record<string, unknown>;
      result?: Record<string, unknown>;
    };
  }>;
  toolInvocations?: Array<{
    toolCallId: string;
    toolName: string;
    state: 'call' | 'result' | 'partial-call';
    args?: Record<string, unknown>;
    result?: Record<string, unknown>;
  }>;
}

import { useSession, signIn } from 'next-auth/react';

export function ChatOverlay({ isOpen, onClose }: ChatOverlayProps) {
  const { data: session, status } = useSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [threadId, setThreadId] = useState<string>('');
  const [feedbacks, setFeedbacks] = useState<Record<string, 'up' | 'down'>>({});
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [initialMessages, setInitialMessages] = useState<ExtendedMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append, setMessages } =
    useChat({
      api: '/api/chat',
      id: threadId,
      body: { threadId },
      onError: (err) => {
        console.error('[GenUI Chat Error]', err);
      },
    }) as {
      messages: ExtendedMessage[];
      input: string;
      handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
      handleSubmit: (e: React.FormEvent) => void;
      isLoading: boolean;
      setInput: (value: string) => void;
      append: (msg: { role: 'user'; content: string }) => void;
      setMessages: (messages: any[]) => void;
    };

  // Initialize threadId and load history
  useEffect(() => {
    const initThread = async () => {
      let storedId = localStorage.getItem('genui_thread_id');
      if (!storedId) {
        storedId = `thread-${Date.now()}`;
        localStorage.setItem('genui_thread_id', storedId);
      }
      setThreadId(storedId);

      if (status !== 'authenticated') {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await fetch(`/api/threads/${storedId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initThread();
  }, [setMessages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for custom events from components (e.g., "Try It" button)
  useEffect(() => {
    const handleTryApi = (e: Event) => {
      const api = (e as CustomEvent).detail.api;
      append({ role: 'user', content: `Show me how to try the ${api.name} API` });
      if (!isOpen) {
        window.dispatchEvent(new CustomEvent('genui:open-chat'));
      }
    };
    const handleAskApi = (e: Event) => {
      const api = (e as CustomEvent).detail.api;
      setInput(`How do I set up and use the ${api.name} API?`);
      inputRef.current?.focus();
    };
    const handleBrowseCategory = (e: Event) => {
      const { category } = (e as CustomEvent).detail;
      append({ role: 'user', content: `Show me all APIs in the ${category} category` });
    };
    const handleShowMore = (e: Event) => {
      const { query, category } = (e as CustomEvent).detail;
      append({ role: 'user', content: `Show me more${query ? ` results for "${query}"` : ''}${category ? ` in ${category}` : ''}` });
    };

    window.addEventListener('genui:try-api', handleTryApi);
    window.addEventListener('genui:ask-api', handleAskApi);
    window.addEventListener('genui:browse-category', handleBrowseCategory);
    window.addEventListener('genui:show-more', handleShowMore);

    return () => {
      window.removeEventListener('genui:try-api', handleTryApi);
      window.removeEventListener('genui:ask-api', handleAskApi);
      window.removeEventListener('genui:browse-category', handleBrowseCategory);
      window.removeEventListener('genui:show-more', handleShowMore);
    };
  }, [isOpen, append, setInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down', correction?: string) => {
    setFeedbacks(f => ({ ...f, [messageId]: type }));

    fetch(`/api/threads/${threadId}/messages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, feedback: type, correction }),
    }).catch(err => console.error('Failed to save feedback', err));

    if (correction) {
      setCorrections(c => ({ ...c, [messageId]: correction }));
      // Self-correction: re-submit with the correction context
      append({
        role: 'user',
        content: `That wasn't quite right. Correction: ${correction}. Please try again.`,
      });
    }
  };

  if (!isOpen) return null;

  if (status === 'unauthenticated') {
    return (
      <div className="chat-overlay" role="dialog" aria-label="GenUI Chat">
        <div className="chat-overlay__backdrop" onClick={onClose} />
        <div className="chat-overlay__panel">
          <div className="chat-overlay__header">
            <div className="chat-overlay__header-left">
              <div className="chat-overlay__logo">
                <span>⚡</span>
                <span>GenUI</span>
              </div>
            </div>
            <div className="chat-overlay__header-actions">
              <button className="chat-overlay__close" onClick={onClose} aria-label="Close">×</button>
            </div>
          </div>
          <div className="chat-overlay__messages chat-overlay__messages--center">
            <div className="chat-welcome chat-welcome--center">
              <div className="chat-welcome__icon">🔐</div>
              <h2 className="chat-welcome__title">Authentication Required</h2>
              <p className="chat-welcome__subtitle chat-welcome__subtitle--spaced">
                You must log in to use the AI assistant and try APIs.
              </p>
              <button className="btn btn--primary" onClick={() => signIn('github')}>
                Log in with GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-overlay" role="dialog" aria-label="GenUI Chat">
      {/* Backdrop */}
      <div className="chat-overlay__backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="chat-overlay__panel">
        {/* Header */}
        <div className="chat-overlay__header">
          <div className="chat-overlay__header-left">
            <div className="chat-overlay__logo">
              <span>⚡</span>
              <span>GenUI</span>
            </div>
            <div className="chat-overlay__status">
              <span className={`status-indicator ${isLoading ? 'status-indicator--loading' : 'status-indicator--idle'}`} />
              <span className="chat-overlay__status-text">
                {isLoading ? 'Thinking...' : 'Ready'}
              </span>
            </div>
          </div>
          <div className="chat-overlay__header-actions">
            <span className="chat-overlay__hotkey-hint">Ctrl+Shift+Space to toggle</span>
            <button className="chat-overlay__close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-overlay__messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="chat-welcome__icon">⚡</div>
              <h2 className="chat-welcome__title">API Explorer</h2>
              <p className="chat-welcome__subtitle">Ask me anything about public APIs</p>
              <div className="chat-welcome__suggestions">
                {[
                  'Show me free weather APIs',
                  'How do I use the Spotify API?',
                  'Find cryptocurrency APIs with no auth',
                  'Show me my API keys',
                ].map(s => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
              {msg.role === 'user' && (
                <div className="chat-message__user">
                  <div className="chat-message__user-avatar">U</div>
                  <div className="chat-message__user-content">{msg.content}</div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="chat-message__assistant">
                  <div className="chat-message__assistant-avatar">⚡</div>
                  <div className="chat-message__assistant-body">
                    {/* Text content */}
                    {msg.content && (
                      <div className="chat-message__text">{msg.content}</div>
                    )}

                    {/* Tool invocations → component registry */}
                    {(msg.toolInvocations ?? []).map(invocation => {
                      const { toolCallId, toolName, state } = invocation;

                      if (state === 'call' || state === 'partial-call') {
                        return (
                          <div key={toolCallId} className="tool-loading">
                            <div className="tool-loading__spinner" />
                            <span className="tool-loading__text">
                              Running <code>{toolName}</code>...
                            </span>
                          </div>
                        );
                      }

                      if (state === 'result' && invocation.result) {
                        const Component = resolveComponent(toolName);
                        return (
                          <div key={toolCallId} className="tool-result">
                            <ErrorBoundary>
                              <Component {...invocation.result} />
                            </ErrorBoundary>
                          </div>
                        );
                      }

                      return null;
                    })}

                    {/* Feedback bar */}
                    <FeedbackBar
                      messageId={msg.id}
                      feedback={feedbacks[msg.id]}
                      onFeedback={handleFeedback}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading state */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="chat-message chat-message--assistant">
              <div className="chat-message__assistant">
                <div className="chat-message__assistant-avatar">⚡</div>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-overlay__input-area">
          <form onSubmit={handleSubmit} className="chat-input-form">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about APIs, try an endpoint, manage keys..."
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chat-submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send"
            >
              {isLoading ? '⟳' : '↑'}
            </button>
          </form>
          <div className="chat-input-hint">
            <span>Enter to send</span>
            <span>·</span>
            <span>Shift+Enter for newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
