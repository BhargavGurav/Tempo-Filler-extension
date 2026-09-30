import { Trash2 } from 'lucide-react';
import type { EntryForm } from '../types';
import { useDateStartTime } from '../hooks/useDateStartTime';
import { useRef, useEffect, useState } from 'react';
import { useTicketHint } from '../hooks/useTicketHint';
import type { TicketSuggestion } from '../hooks/useTicketHint';

interface Props {
  entry: EntryForm;
  index: number;
  onChange: (id: string, field: keyof EntryForm, value: string) => void;
  onRemove: (id: string) => void;
  error?: string;
  refreshToken: number;
}

export function EntryCard({ entry, index, onChange, onRemove, error, refreshToken }: Props) {
  const ticketHint = useTicketHint(entry.ticketId);
  const suggestedStart = useDateStartTime(entry.date, refreshToken);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const prevTicketId = useRef(entry.ticketId);
  useEffect(() => {
    if (prevTicketId.current !== entry.ticketId) {
      prevTicketId.current = entry.ticketId;
      setShowSuggestions(true);
    }
  }, [entry.ticketId]);
  // When date changes and user hasn't manually set a time, sync suggested start
  const initializedRef = useRef(false);
  const prevDateRef = useRef(entry.date);

  useEffect(() => {
    if (!initializedRef.current || prevDateRef.current !== entry.date) {
      initializedRef.current = true;
      prevDateRef.current = entry.date;
      onChange(entry.id, 'startTime', suggestedStart);
    }
  }, [suggestedStart]);

  return (
    <div className={`entry-card ${error ? 'entry-card--error' : ''}`}>
      <div className="entry-card-header">
        <span className="entry-index">Entry {index + 1}</span>
        <button
          className="icon-btn danger"
          onClick={() => onRemove(entry.id)}
          title="Remove entry"
        >
          <Trash2 size={14} />
        </button>
      </div>

    <div className="field">
            <label>Date</label>
            <input
                type="date"
                value={entry.date}
                onChange={e => onChange(entry.id, 'date', e.target.value)}
            />
    </div>
      <div className="field ticket-field">
      <label>Ticket ID</label>
      <input
        type="text"
        placeholder="e.g. COPEE2-1234"
        value={entry.ticketId}
        onChange={e => {
          setShowSuggestions(true);
          onChange(entry.id, 'ticketId', e.target.value.toUpperCase());
        }}
      />
      {ticketHint && ticketHint.status === 'loading' && (
        <span className="ticket-hint ticket-hint--loading">⏳ Searching...</span>
      )}
      {ticketHint && ticketHint.status === 'error' && (
        <span className="ticket-hint ticket-hint--error">✗ {ticketHint.error}</span>
      )}
     {ticketHint && ticketHint.status === 'found' && ticketHint.suggestions.length > 0 && showSuggestions && (
        <div className="ticket-suggestions">
          {ticketHint.suggestions.map((s: TicketSuggestion) => (
            <button
              key={s.key}
              className={`ticket-suggestion ${entry.ticketId === s.key ? 'ticket-suggestion--selected' : ''}`}
              onClick={() => {
                setShowSuggestions(false);
                onChange(entry.id, 'ticketId', s.key);
              }}
            >
              <span className="suggestion-key">{s.key}</span>
              <span className="suggestion-summary">{s.summary}</span>
            </button>
          ))}
        </div>
      )}
      {ticketHint && ticketHint.status === 'found' && ticketHint.suggestions.length === 0 && (
        <span className="ticket-hint ticket-hint--error">✗ No tickets found</span>
      )}
    </div>

      <div className="entry-row">
        <div className="field">
            <label>Time Spent</label>
            <input
            type="text"
            placeholder="1h 30m"
            value={entry.timeSpent}
            onChange={e => onChange(entry.id, 'timeSpent', e.target.value)}
            />
        </div>
        <div className="field">
            <label>Start Time <span className="label-hint">(auto)</span></label>
            <input
            type="time"
            value={entry.startTime}
            onChange={e => onChange(entry.id, 'startTime', e.target.value)}
            />
        </div>
        </div>

      <div className="field">
        <label>Comment</label>
        <input
          type="text"
          placeholder="What did you work on?"
          value={entry.comment}
          onChange={e => onChange(entry.id, 'comment', e.target.value)}
        />
      </div>

      {error && <div className="entry-error">{error}</div>}
    </div>
  );
}