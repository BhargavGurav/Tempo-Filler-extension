export interface JiraUser {
  accountId: string;
  emailAddress: string;
  displayName: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
  };
}

export class JiraClient {
  private authHeader: string;

  constructor(
    private readonly baseUrl: string,
    email: string,
    token: string
  ) {
    const encoded = Buffer.from(`${email}:${token}`).toString('base64');
    this.authHeader = `Basic ${encoded}`;
  }

  private get headers() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': this.authHeader,
    };
  }

  // Verify credentials + get account info
  async getMyself(): Promise<JiraUser> {
    const url = `${this.baseUrl}/rest/api/3/myself`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Jira auth failed: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<JiraUser>;
  }

  // Get issue details by key (e.g. COPEE2-10847)
  async getIssue(issueKey: string): Promise<JiraIssue> {
    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}?fields=key,summary,id`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      throw new Error(`Issue not found: ${res.status} ${await res.text()}`);
    }
    return res.json() as Promise<JiraIssue>;
  }

  // Search issues by text/key prefix
  async searchIssues(query: string, maxResults: number = 5): Promise<JiraIssue[]> {
  const url = `${this.baseUrl}/rest/api/3/issue/picker?query=${encodeURIComponent(query)}&currentJQL=&showSubTasks=true&showSubTaskParent=true`;
  const res = await fetch(url, { headers: this.headers });
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }
  const data = await res.json() as any;

  const seen = new Set<string>();
  const issues: JiraIssue[] = [];

  for (const section of (data.sections ?? [])) {
    for (const item of (section.issues ?? [])) {
      // Deduplicate by key
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      issues.push({
        id: item.id ?? '',
        key: item.key,
        fields: { summary: item.summaryText ?? item.summary ?? '' }
      });
      if (issues.length >= maxResults) break;
    }
    if (issues.length >= maxResults) break;
  }

  return issues;
}
}