'use client';

import { useEffect } from 'react';

interface GlobalKeyboardListenerProps {
  onToggleChat: () => void;
  onOpenChat: () => void;
}

const HOTKEY_COMBO = { ctrl: true, shift: true, key: ' ' }; // Ctrl+Shift+Space

export function GlobalKeyboardListener({ onToggleChat, onOpenChat }: GlobalKeyboardListenerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const matchesCombo =
        e.ctrlKey === HOTKEY_COMBO.ctrl &&
        e.shiftKey === HOTKEY_COMBO.shift &&
        e.key === HOTKEY_COMBO.key;

      if (matchesCombo) {
        e.preventDefault();
        onToggleChat();
      }
    };

    const openHandler = () => {
      // Components dispatching "open" want the chat guaranteed open, not toggled shut.
      onOpenChat();
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('genui:open-chat', openHandler);

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('genui:open-chat', openHandler);
    };
  }, [onToggleChat, onOpenChat]);

  return null; // No UI — just a listener
}
