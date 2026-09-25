'use client';

const ACTIONS = [
  { icon: '🌤️', label: 'Weather APIs', query: 'free weather APIs' },
  { icon: '₿', label: 'Crypto APIs', query: 'cryptocurrency APIs' },
  { icon: '🎬', label: 'Video APIs', query: 'video APIs' },
  { icon: '🤖', label: 'AI/ML APIs', query: 'machine learning APIs' },
  { icon: '🗺️', label: 'Maps & Geo', query: 'geocoding APIs' },
];

export function HomeActionChips() {
  return (
    <div className="hero__actions">
      {ACTIONS.map(item => (
        <button
          key={item.label}
          className="action-chip"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('genui:open-chat'));
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('genui:ask-api', { 
                detail: { api: { name: item.query } } 
              }));
            }, 200);
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
