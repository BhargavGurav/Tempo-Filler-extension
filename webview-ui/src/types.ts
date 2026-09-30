export interface JiraUser {
  displayName: string;
  accountId: string;
}

export interface Worklog {
  tempoWorklogId: number;
  issue: { id: number };   
  issueKey: string;
  issueSummary: string;
  timeSpentSeconds: number;
  startDate: string;
  startTime: string;
  description: string;
}

export interface EntryForm {
  id: string;
  ticketId: string;
  timeSpent: string;
  startTime: string;    // "HH:MM"
  date: string;         // "YYYY-MM-DD"   ← ADD THIS
  comment: string;
}

export type AppScreen = 'loading' | 'onboarding' | 'main';
export type OnboardingStep = 1 | 2 | 3;