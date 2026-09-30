import { useState, useCallback } from 'react';
import { LogOut, Plus, Send, Loader } from 'lucide-react';
import { sendMessage } from '../vscode';
import { useVSCodeMessages } from '../hooks/useVSCodeMessages';
import { EntryCard } from './EntryCard';
import { parseTimeToSeconds, addSecondsToTime } from '../utils/timeParser';
import type { EntryForm } from '../types';
import { LoggedList } from './LoggedList';
import { invalidateDateCache } from '../hooks/useDateStartTime';

interface Props {
  onLogout: () => void;
}

function makeEntry(date: string, startTime: string = '08:00'): EntryForm {
  return {
    id: crypto.randomUUID(),
    ticketId: '',
    timeSpent: '',
    startTime,
    date,
    comment: '',
  };
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function MainPanel({ onLogout }: Props) {

const [entries, setEntries] = useState<EntryForm[]>([makeEntry(todayString())]);
const [refreshToken, setRefreshToken] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleChange = (id: string, field: keyof EntryForm, value: string) => {
  setEntries(prev => {
    const updated = prev.map(e => e.id === id ? { ...e, [field]: value } : e);

    // Recalculate start times for all cards after the changed one
    if (field === 'timeSpent' || field === 'startTime') {
      let runningTime = updated[0].startTime;
      return updated.map((e, i) => {
        if (i === 0) {
          runningTime = addSecondsToTime(
            e.startTime,
            parseTimeToSeconds(e.timeSpent) ?? 0
          );
          return e;
        }
        // Only auto-update if user hasn't manually changed this card's startTime
        // We track this by checking if it was previously auto-calculated
        const newStart = runningTime;
        runningTime = addSecondsToTime(
          newStart,
          parseTimeToSeconds(e.timeSpent) ?? 0
        );
        return { ...e, startTime: newStart };
      });
    }

    return updated;
  });
  setErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
};

  const handleRemove = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleAddEntry = () => {
    setEntries(prev => {
      const last = prev[prev.length - 1];
      // Start time will be set by EntryCard's useDateStartTime hook
      return [...prev, makeEntry(last.date, '09:00')];
    });
    setSuccessCount(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const entry of entries) {
      if (!entry.ticketId.trim()) {
        newErrors[entry.id] = 'Ticket ID is required.';
        continue;
      }
      if (!entry.timeSpent.trim()) {
        newErrors[entry.id] = 'Time spent is required.';
        continue;
      }
      const secs = parseTimeToSeconds(entry.timeSpent);
      if (secs === null || secs <= 0) {
        newErrors[entry.id] = 'Invalid time format. Use e.g. "1h 30m" or "90m".';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAll = () => {
    setSubmitError('');
    setSuccessCount(null);
    if (!validate()) return;
    setSubmitting(true);
    sendMessage('submitWorklogs', {
      entries: entries.map(e => ({
        id: e.id,
        ticketId: e.ticketId.trim(),
        timeSpentSeconds: parseTimeToSeconds(e.timeSpent),
        startTime: e.startTime + ':00',
        date: e.date,
        comment: e.comment.trim(),
      }))
    });
  };

  const handleLogout = () => {
    sendMessage('logout');
    onLogout();
  };

  const handleMessage = useCallback((message: { command: string; [key: string]: any }) => {
    switch (message.command) {
      case 'worklogsSubmitted': {
        setSubmitting(false);
        setSuccessCount(message.successCount);
         for (const entry of entries) {
            invalidateDateCache(entry.date);
          }
          setRefreshToken(t => t + 1); 
        const failErrors: Record<string, string> = {};
        for (const fail of (message.failures ?? [])) {
          failErrors[fail.id] = fail.error;
        }
        if (Object.keys(failErrors).length > 0) {
          setErrors(failErrors);
        } else {
          // All succeeded — reset form
          setEntries([makeEntry(todayString())]);
        }
        break;
      }
      case 'error': {
        setSubmitting(false);
        setSubmitError(message.message);
        break;
      }
    }
  }, []);

  useVSCodeMessages(handleMessage);

  return (
    <div className="main-panel">

      {/* Header */}
      <div className="panel-header">
        <h2>⏱ Tempo Filler</h2>
        <button className="icon-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>

       {/* With: */}
    <div className="section-divider">
    <span>Logged Entries</span>
    </div>
    <LoggedList initialDate={todayString()} />
      <div className="panel-body">

        {/* Entry cards */}
        <div className="entries-list">
          {entries.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
              error={errors[entry.id]}
               refreshToken={refreshToken} 
            />
          ))}
        </div>

        {/* Add entry */}
        <button className="secondary-btn" onClick={handleAddEntry}>
          <Plus size={14} /> Add Another Entry
        </button>

        {/* Submit all */}
        <button
          className="primary-btn submit-btn"
          onClick={handleSubmitAll}
          disabled={submitting || entries.length === 0}
        >
          {submitting
            ? <><Loader size={14} className="spin" /> Submitting...</>
            : <><Send size={14} /> Submit All ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})</>
          }
        </button>

        
        {/* Success banner */}
        {successCount !== null && (
          <div className="success-banner">
            ✅ {successCount} worklog{successCount !== 1 ? 's' : ''} logged successfully!
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="error-banner">{submitError}</div>
        )}

      </div>
    </div>
  );
}