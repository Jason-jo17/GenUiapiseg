'use client';

import { useState } from 'react';

interface FeedbackBarProps {
  messageId: string;
  feedback?: 'up' | 'down';
  onFeedback: (messageId: string, type: 'up' | 'down', correction?: string) => void;
}

export function FeedbackBar({ messageId, feedback, onFeedback }: FeedbackBarProps) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');

  const handleDown = () => {
    onFeedback(messageId, 'down');
    setShowCorrection(true);
  };

  const submitCorrection = () => {
    if (correctionText.trim()) {
      onFeedback(messageId, 'down', correctionText);
      setShowCorrection(false);
      setCorrectionText('');
    }
  };

  return (
    <div className="feedback-bar">
      <div className="feedback-bar__actions">
        <button
          className={`feedback-btn ${feedback === 'up' ? 'feedback-btn--active-up' : ''}`}
          onClick={() => onFeedback(messageId, 'up')}
          aria-label="Good response"
          title="Good response"
        >
          👍
        </button>
        <button
          className={`feedback-btn ${feedback === 'down' ? 'feedback-btn--active-down' : ''}`}
          onClick={handleDown}
          aria-label="Bad response"
          title="Bad response — add correction"
        >
          👎
        </button>
      </div>

      {showCorrection && (
        <div className="feedback-correction">
          <textarea
            className="feedback-correction__input"
            placeholder="What was wrong? Tell me how to fix it..."
            value={correctionText}
            onChange={e => setCorrectionText(e.target.value)}
            rows={2}
            autoFocus
          />
          <div className="feedback-correction__actions">
            <button className="btn btn--ghost btn--xs" onClick={() => setShowCorrection(false)}>
              Cancel
            </button>
            <button
              className="btn btn--primary btn--xs"
              onClick={submitCorrection}
              disabled={!correctionText.trim()}
            >
              Send Correction ↺
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
