import { useEffect } from 'react';

type MessageHandler = (message: { command: string; [key: string]: unknown }) => void;

export function useVSCodeMessages(handler: MessageHandler) {
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      handler(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);
}