import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { LoggedEntry } from './LoggedEntry';
import { EditModal } from './EditModal';
import { sendMessage } from '../vscode';
import { useVSCodeMessages } from '../hooks/useVSCodeMessages';
import { secondsToHuman } from '../utils/timeParser';
import type { Worklog } from '../types';

interface Props {
  initialDate: string;
}

export function LoggedList({ initialDate }: Props) {
  const [date, setDate] = useState(initialDate);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingWorklog, setEditingWorklog] = useState<Worklog | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    sendMessage('fetchWorklogs', { date });
  };

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchLogs();
  }, [date]);

  const totalSeconds = worklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);

  const handleDelete = (tempoWorklogId: number) => {
    setDeletingId(tempoWorklogId);
    sendMessage('deleteWorklog', { tempoWorklogId });
  };

  const handleMessage = useCallback((message: { command: string; [key: string]: any }) => {
    switch (message.command) {
      case 'worklogsFetched':
        setWorklogs(message.worklogs);
        setLoading(false);
        break;

      case 'worklogDeleted':
        setWorklogs(prev => prev.filter(w => w.tempoWorklogId !== message.tempoWorklogId));
        setDeletingId(null);
        break;

      case 'worklogUpdated':
        setWorklogs(prev => prev.map(w =>
          w.tempoWorklogId === message.worklog.tempoWorklogId ? message.worklog : w
        ));
        setEditingWorklog(null);
        break;

      case 'worklogsSubmitted':
        // Refresh list after new entries submitted
        fetchLogs();
        break;
    }
  }, [date]);

  useVSCodeMessages(handleMessage);

  return (
    <div className="logged-list">
      <div className="logged-list-header">
        <button className="collapse-btn" onClick={() => setCollapsed(p => !p)}>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span>Logged Entries</span>
            {worklogs.length > 0 && (
            <span className="logged-total">{secondsToHuman(totalSeconds)}</span>
            )}
        </button>
        <div className="logged-header-right">
            <input
            type="date"
            className="logged-date-input"
            value={date}
            onChange={e => setDate(e.target.value)}
            />
            <button className="icon-btn" onClick={fetchLogs} title="Refresh" disabled={loading}>
            {loading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
            </button>
        </div>
        </div>

      {!collapsed && (
        <div className="logged-entries">
          {loading && worklogs.length === 0 && (
            <div className="logged-empty">Loading...</div>
          )}
          {!loading && worklogs.length === 0 && (
            <div className="logged-empty">No entries logged yet.</div>
          )}
          {worklogs.map(w => (
            <LoggedEntry
              key={w.tempoWorklogId}
              worklog={w}
              onEdit={setEditingWorklog}
              onDelete={handleDelete}
              deleting={deletingId === w.tempoWorklogId}
            />
          ))}
        </div>
      )}

      {editingWorklog && (
        <EditModal
          worklog={editingWorklog}
          onClose={() => setEditingWorklog(null)}
        />
      )}
    </div>
  );
}