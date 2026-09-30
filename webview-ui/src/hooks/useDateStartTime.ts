import { useState, useEffect } from 'react';
import { sendMessage } from '../vscode';
import { addSecondsToTime } from '../utils/timeParser';

const BASE_START = '08:00';
const cache: Record<string, number> = {};

export function invalidateDateCache(date: string) {
  delete cache[date];
}

export function useDateStartTime(date: string, refreshToken: number): string {
  const [startTime, setStartTime] = useState(BASE_START);

  useEffect(() => {
    if (!date) return;

    // Clear cache if refresh requested
    if (refreshToken > 0) {
      delete cache[date];
    }

    const applySeconds = (secs: number) => {
      setStartTime(addSecondsToTime(BASE_START, secs));
    };

    if (cache[date] !== undefined) {
      applySeconds(cache[date]);
      return;
    }

    sendMessage('fetchWorklogsForDate', { date });

    const listener = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'worklogsForDateFetched' && msg.date === date) {
        cache[date] = msg.totalSeconds;
        applySeconds(msg.totalSeconds);
        window.removeEventListener('message', listener);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [date, refreshToken]);

  return startTime;
}