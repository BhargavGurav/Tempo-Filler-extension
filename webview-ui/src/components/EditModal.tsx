import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { parseTimeToSeconds, secondsToHuman } from '../utils/timeParser';
import { sendMessage } from '../vscode';
import type { Worklog } from '../types';

interface Props {
  worklog: Worklog;
  onClose: () => void;
}

export function EditModal({ worklog, onClose }: Props) {
  const [timeSpent, setTimeSpent] = useState(secondsToHuman(worklog.timeSpentSeconds));
  const [startTime, setStartTime] = useState(worklog.startTime?.slice(0, 5) ?? '08:00');
  const [date, setDate] = useState(worklog.startDate);
  const [comment, setComment] = useState(worklog.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setError('');
    const secs = parseTimeToSeconds(timeSpent);
    if (!secs || secs <= 0) {
      setError('Invalid time format. Use e.g. "1h 30m" or "90m".');
      return;
    }
    setSaving(true);
    sendMessage('updateWorklog', {
      tempoWorklogId: worklog.tempoWorklogId,
      issueId: worklog.issue.id,
      timeSpentSeconds: secs,
      startDate: date,
      startTime: startTime + ':00',
      comment,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit {worklog.issueKey}</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="logged-summary modal-summary">{worklog.issueSummary}</div>

          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="entry-row">
            <div className="field">
              <label>Time Spent</label>
              <input
                type="text"
                placeholder="1h 30m"
                value={timeSpent}
                onChange={e => setTimeSpent(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Comment</label>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose} style={{ width: 'auto' }}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSave} disabled={saving} style={{ width: 'auto' }}>
            {saving ? <><Loader size={13} className="spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}