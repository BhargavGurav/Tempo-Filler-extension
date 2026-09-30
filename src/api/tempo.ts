export interface WorklogPayload {
  issueId: number;
  timeSpentSeconds: number;
  startDate: string;       // "YYYY-MM-DD"
  startTime: string;       // "HH:MM:SS"
  description: string;
  authorAccountId: string;
}

export interface Worklog {
  tempoWorklogId: number;
  issue: { id: number };
  timeSpentSeconds: number;
  startDate: string;
  startTime: string;
  description: string;
  author: { accountId: string };
  // We'll attach these after resolving from Jira
  issueKey?: string;
  issueSummary?: string;
}

export interface TempoWorklogsResponse {
  results: Worklog[];
}

export class TempoClient {
  private readonly baseUrl = 'https://api.tempo.io/4/';

  constructor(private readonly token: string) {}

  private get headers() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  // Verify token works
  async verify(accountId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const url = `${this.baseUrl}worklogs?accountId=${accountId}&from=${today}&to=${today}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Tempo auth failed: ${res.status} ${await res.text()}`);
    }
    return true;
  }

  // Get worklogs for a date
  async getWorklogs(accountId: string, date: string): Promise<Worklog[]> {
    const url = `${this.baseUrl}worklogs?accountId=${accountId}&from=${date}&to=${date}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch worklogs: ${res.status}`);
    }
    const data = await res.json() as TempoWorklogsResponse;
    return data.results ?? [];
  }

  // Add a worklog
  async addWorklog(payload: WorklogPayload): Promise<Worklog> {
    const url = `${this.baseUrl}worklogs`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ ...payload, attributes: [] }),
    });
    if (!res.ok) {
      throw new Error(`Failed to add worklog: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<Worklog>;
  }

  // Edit a worklog
  async updateWorklog(worklogId: number, payload: WorklogPayload): Promise<Worklog> {
    const url = `${this.baseUrl}worklogs/${worklogId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ ...payload, attributes: [] }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update worklog: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<Worklog>;
  }

  // Delete a worklog
  async deleteWorklog(worklogId: number): Promise<void> {
    const url = `${this.baseUrl}worklogs/${worklogId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (!res.ok) {
      throw new Error(`Failed to delete worklog: ${res.status} ${await res.text()}`);
    }
  }
}