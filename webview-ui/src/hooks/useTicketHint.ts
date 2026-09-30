import { useState, useEffect } from 'react';
import { sendMessage } from '../vscode';

export interface TicketSuggestion {
  key: string;
  summary: string;
}

interface HintState {
  suggestions: TicketSuggestion[];
  status: 'loading' | 'found' | 'error';
  error?: string;
}

const cache: Record<string, HintState> = {};

export function useTicketHint(ticketId: string): HintState | null {
  const [hint, setHint] = useState<HintState | null>(null);

  useEffect(() => {
    const trimmed = ticketId.trim();

    // Need at least 2 chars before searching
    if (!trimmed || trimmed.length < 2) {
      setHint(null);
      return;
    }
    const isExact = /^[A-Z]+-\d+$/.test(trimmed);
    if (isExact && cache[trimmed]) {
    setHint(cache[trimmed]);
    return;
    }

    setHint({ suggestions: [], status: 'loading' });

    let listener: ((event: MessageEvent) => void) | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const timer = setTimeout(() => {
      listener = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.command === 'ticketHintResult' && msg.ticketId === trimmed) {
          const result: HintState = msg.error
            ? { suggestions: [], status: 'error', error: msg.error }
            : { suggestions: msg.issues ?? [], status: 'found' };
          cache[trimmed] = result;
          setHint(result);
          if (listener) window.removeEventListener('message', listener);
          if (timeout) clearTimeout(timeout);
        }
      };

      window.addEventListener('message', listener);
      sendMessage('fetchTicketHint', { ticketId: trimmed });

      timeout = setTimeout(() => {
        if (listener) window.removeEventListener('message', listener);
        setHint({ suggestions: [], status: 'error', error: 'No response' });
      }, 5000);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (timeout) clearTimeout(timeout);
      if (listener) window.removeEventListener('message', listener);
    };
  }, [ticketId]);

  return hint;
}