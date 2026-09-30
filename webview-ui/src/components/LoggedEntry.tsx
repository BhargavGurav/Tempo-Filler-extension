import { Pencil, Trash2, Clock, FileText } from 'lucide-react';
import { secondsToHuman } from '../utils/timeParser';
import type { Worklog } from '../types';

interface Props {
  worklog: Worklog;
  onEdit: (worklog: Worklog) => void;
  onDelete: (tempoWorklogId: number) => void;
  deleting?: boolean;
}

export function LoggedEntry({ worklog, onEdit, onDelete, deleting }: Props) {
  return (
    <div className={`logged-entry ${deleting ? 'logged-entry--deleting' : ''}`}>
      <div className="logged-entry-top">
        <span className="logged-ticket">{worklog.issueKey}</span>
        <div className="logged-actions">
          <button className="icon-btn" onClick={() => onEdit(worklog)} title="Edit">
            <Pencil size={13} />
          </button>
          <button
            className="icon-btn danger"
            onClick={() => onDelete(worklog.tempoWorklogId)}
            disabled={deleting}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="logged-summary">{worklog.issueSummary}</div>

      <div className="logged-meta">
        <span><Clock size={11} /> {secondsToHuman(worklog.timeSpentSeconds)}</span>
        <span>{worklog.startTime?.slice(0, 5)}</span>
        {worklog.description && (
          <span><FileText size={11} /> {worklog.description}</span>
        )}
      </div>
    </div>
  );
}