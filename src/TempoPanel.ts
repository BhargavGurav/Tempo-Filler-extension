import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SecretsManager } from './auth/secrets';
import { JiraClient, JiraIssue } from './api/jira';
import { TempoClient } from './api/tempo';

export class TempoPanel implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _secrets: SecretsManager;  

  constructor(private readonly _context: vscode.ExtensionContext) {
    this._secrets = new SecretsManager(_context.secrets);
  }
    
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._context.extensionUri, 'webview-ui', 'dist')
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Message bridge (we'll fill this in later steps)
    const messageDisposable = webviewView.webview.onDidReceiveMessage(
    async (message) => {
        console.log('[TempoPanel] Received message:', message.command);
        switch (message.command) {

        case 'checkAuth': {
            const configured = await this._secrets.isConfigured();
            webviewView.webview.postMessage({ command: 'authStatus', configured });
            break;
        }

        case 'saveJiraCredentials': {
            try {
            const { jiraUrl, jiraEmail, jiraToken } = message.data;
            const client = new JiraClient(jiraUrl, jiraEmail, jiraToken);
            const user = await client.getMyself();
            await this._secrets.saveJiraUrl(jiraUrl);
            await this._secrets.saveJiraEmail(jiraEmail);
            await this._secrets.saveJiraToken(jiraToken);
            await this._secrets.saveAccountId(user.accountId);
            webviewView.webview.postMessage({
                command: 'jiraVerified',
                user: { displayName: user.displayName, accountId: user.accountId }
            });
            } catch (err: any) {
            webviewView.webview.postMessage({ command: 'error', message: err.message });
            }
            break;
        }

        case 'saveTempoCredentials': {
            try {
            const { tempoToken } = message.data;
            const accountId = await this._secrets.getAccountId();
            const client = new TempoClient(tempoToken);
            await client.verify(accountId!);
            await this._secrets.saveTempoToken(tempoToken);
            webviewView.webview.postMessage({ command: 'tempoVerified' });
            } catch (err: any) {
            webviewView.webview.postMessage({ command: 'error', message: err.message });
            }
            break;
        }

       case 'fetchTicketHint': {
        try {
            const { ticketId } = message.data;
            const [jiraUrl, jiraEmail, jiraToken] = await Promise.all([
            this._secrets.getJiraUrl(),
            this._secrets.getJiraEmail(),
            this._secrets.getJiraToken(),
            ]);
            const jira = new JiraClient(jiraUrl!, jiraEmail!, jiraToken!);
            const isExactMatch = /^[A-Z]+-\d+$/.test(ticketId);

            const seen = new Set<string>();
            const issues: JiraIssue[] = [];

            if (isExactMatch) {
            // Always fetch exact ticket directly first
            try {
                const exact = await jira.getIssue(ticketId);
                seen.add(exact.key);
                issues.push(exact);
            } catch {
                // ticket not found, continue to search
            }
            }

            // Search and filter: only keep results whose key starts with the typed prefix
            const searched = await jira.searchIssues(ticketId, 10);
            const [project, num] = ticketId.split('-');
            for (const i of searched) {
            if (seen.has(i.key)) continue;
            // Filter: key must match project and number must START with typed number
            const [iProject, iNum] = i.key.split('-');
            if (iProject !== project) continue;
            if (num && !iNum.startsWith(num)) continue;
            seen.add(i.key);
            issues.push(i);
            if (issues.length >= 5) break;
            }

            webviewView.webview.postMessage({
            command: 'ticketHintResult',
            ticketId,
            issues: issues.map(i => ({ key: i.key, summary: i.fields.summary })),
            });
        } catch (err: any) {
            webviewView.webview.postMessage({
            command: 'ticketHintResult',
            ticketId: message.data.ticketId,
            error: 'Search failed',
            });
        }
        break;
        }
        
        case 'fetchWorklogs': {
            try {
                const { date } = message.data;
                const [jiraUrl, jiraEmail, jiraToken, tempoToken, accountId] = await Promise.all([
                this._secrets.getJiraUrl(),
                this._secrets.getJiraEmail(),
                this._secrets.getJiraToken(),
                this._secrets.getTempoToken(),
                this._secrets.getAccountId(),
                ]);
                const jira = new JiraClient(jiraUrl!, jiraEmail!, jiraToken!);
                const tempo = new TempoClient(tempoToken!);
                const raw = await tempo.getWorklogs(accountId!, date);

                // Enrich with issue key + summary
                const worklogs = await Promise.all(raw.map(async (w) => {
                try {
                    const issue = await jira.getIssue(String(w.issue.id));
                    return { ...w, issueKey: issue.key, issueSummary: issue.fields.summary };
                } catch {
                    return { ...w, issueKey: String(w.issue.id), issueSummary: '' };
                }
                }));

                webviewView.webview.postMessage({ command: 'worklogsFetched', worklogs });
            } catch (err: any) {
                webviewView.webview.postMessage({ command: 'error', message: err.message });
            }
            break;
            }

            case 'deleteWorklog': {
            try {
                const tempoToken = await this._secrets.getTempoToken();
                const tempo = new TempoClient(tempoToken!);
                await tempo.deleteWorklog(message.data.tempoWorklogId);
                webviewView.webview.postMessage({
                command: 'worklogDeleted',
                tempoWorklogId: message.data.tempoWorklogId
                });
            } catch (err: any) {
                webviewView.webview.postMessage({ command: 'error', message: err.message });
            }
            break;
            }

            case 'updateWorklog': {
            try {
                const [jiraUrl, jiraEmail, jiraToken, tempoToken, accountId] = await Promise.all([
                this._secrets.getJiraUrl(),
                this._secrets.getJiraEmail(),
                this._secrets.getJiraToken(),
                this._secrets.getTempoToken(),
                this._secrets.getAccountId(),
                ]);
                const tempo = new TempoClient(tempoToken!);
                const updated = await tempo.updateWorklog(message.data.tempoWorklogId, {
                issueId: message.data.issueId,
                timeSpentSeconds: message.data.timeSpentSeconds,
                startDate: message.data.startDate,
                startTime: message.data.startTime,
                description: message.data.comment,
                authorAccountId: accountId!,
                });

                // Re-enrich with issue details
                const jira = new JiraClient(jiraUrl!, jiraEmail!, jiraToken!);
                const issue = await jira.getIssue(String(updated.issue.id));
                const worklog = { ...updated, issueKey: issue.key, issueSummary: issue.fields.summary };

                webviewView.webview.postMessage({ command: 'worklogUpdated', worklog });
            } catch (err: any) {
                webviewView.webview.postMessage({ command: 'error', message: err.message });
            }
            break;
        }

        case 'fetchWorklogsForDate': {
            try {
                const { date } = message.data;
                const [tempoToken, accountId] = await Promise.all([
                this._secrets.getTempoToken(),
                this._secrets.getAccountId(),
                ]);
                const tempo = new TempoClient(tempoToken!);
                const worklogs = await tempo.getWorklogs(accountId!, date);
                const totalSeconds = worklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);
                webviewView.webview.postMessage({
                command: 'worklogsForDateFetched',
                date,
                totalSeconds,
                });
            } catch {
                // Silently fail — start time just stays at 09:00
                webviewView.webview.postMessage({
                command: 'worklogsForDateFetched',
                date: message.data.date,
                totalSeconds: 0,
                });
            }
            break;
            }

        case 'submitWorklogs': {
            const { entries } = message.data;
            const [jiraUrl, jiraEmail, jiraToken, tempoToken, accountId] = await Promise.all([
                this._secrets.getJiraUrl(),
                this._secrets.getJiraEmail(),
                this._secrets.getJiraToken(),
                this._secrets.getTempoToken(),
                this._secrets.getAccountId(),
            ]);

            const jira = new JiraClient(jiraUrl!, jiraEmail!, jiraToken!);
            const tempo = new TempoClient(tempoToken!);

            const successes: number[] = [];
            const failures: { id: string; error: string }[] = [];

            for (const entry of entries) {
                try {
                const issue = await jira.getIssue(entry.ticketId);
                await tempo.addWorklog({
                    issueId: parseInt(issue.id),
                    timeSpentSeconds: entry.timeSpentSeconds,
                    startDate: entry.date,
                    startTime: entry.startTime,
                    description: entry.comment || '',
                    authorAccountId: accountId!,
                });
                successes.push(entry.id);
                } catch (err: any) {
                failures.push({ id: entry.id, error: err.message });
                }
            }

            webviewView.webview.postMessage({
                command: 'worklogsSubmitted',
                successCount: successes.length,
                failures,
            });
            break;
        }

        case 'logout': {
            await this._secrets.clearAll();
            webviewView.webview.postMessage({ command: 'authStatus', configured: false });
            break;
        }

        }
    }
    );
     webviewView.onDidDispose(() => {
        messageDisposable.dispose();
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const distPath = vscode.Uri.joinPath(
        this._context.extensionUri,
        'webview-ui',
        'dist'
    );

    const indexPath = vscode.Uri.joinPath(distPath, 'index.html');

    // Guard: if dist doesn't exist yet, return a placeholder
    if (!fs.existsSync(indexPath.fsPath)) {
        return `<!DOCTYPE html>
        <html><head></head><body>
            <p style="color:white;padding:1rem;">
            Run <code>npm run build:webview</code> first, then reload.
            </p>
        </body></html>`;
    }

    let html = fs.readFileSync(indexPath.fsPath, 'utf8');

    html = html.replace(
        /(src|href)="\/([^"]+)"/g,
        (_, attr, file) => {
        const uri = webview.asWebviewUri(
            vscode.Uri.joinPath(distPath, file)
        );
        return `${attr}="${uri}"`;
        }
    );

    const nonce = getNonce();
    html = html.replace(
        '<head>',
        `<head>
        <meta http-equiv="Content-Security-Policy" content="
            default-src 'none';
            script-src 'nonce-${nonce}' 'unsafe-eval';
            style-src ${webview.cspSource} 'unsafe-inline';
            font-src ${webview.cspSource};
            connect-src https://api.atlassian.com https://*.atlassian.net https://api.tempo.io;
        ">`
    );

    html = html.replace(/<script /g, `<script nonce="${nonce}" `);

    return html;
    }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}