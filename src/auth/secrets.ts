import * as vscode from 'vscode';

const KEYS = {
  jiraUrl: 'tempo-logger.jiraUrl',
  jiraEmail: 'tempo-logger.jiraEmail',
  jiraToken: 'tempo-logger.jiraToken',
  tempoToken: 'tempo-logger.tempoToken',
  accountId: 'tempo-logger.accountId',
} as const;

export class SecretsManager {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  // Save
  async saveJiraUrl(url: string) { await this.secrets.store(KEYS.jiraUrl, url); }
  async saveJiraEmail(email: string) { await this.secrets.store(KEYS.jiraEmail, email); }
  async saveJiraToken(token: string) { await this.secrets.store(KEYS.jiraToken, token); }
  async saveTempoToken(token: string) { await this.secrets.store(KEYS.tempoToken, token); }
  async saveAccountId(id: string) { await this.secrets.store(KEYS.accountId, id); }

  // Get
  async getJiraUrl() { return await this.secrets.get(KEYS.jiraUrl); }
  async getJiraEmail() { return await this.secrets.get(KEYS.jiraEmail); }
  async getJiraToken() { return await this.secrets.get(KEYS.jiraToken); }
  async getTempoToken() { return await this.secrets.get(KEYS.tempoToken); }
  async getAccountId() { return await this.secrets.get(KEYS.accountId); }

  // Clear all (logout)
  async clearAll() {
    await Promise.all(Object.values(KEYS).map(k => this.secrets.delete(k)));
  }

  // Check if fully configured
  async isConfigured(): Promise<boolean> {
    const [jiraUrl, jiraEmail, jiraToken, tempoToken, accountId] = await Promise.all([
      this.getJiraUrl(),
      this.getJiraEmail(),
      this.getJiraToken(),
      this.getTempoToken(),
      this.getAccountId(),
    ]);
    return !!(jiraUrl && jiraEmail && jiraToken && tempoToken && accountId);
  }
}