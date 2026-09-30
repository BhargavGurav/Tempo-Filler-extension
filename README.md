# ⏱ Tempo Logger

Log time to Jira Tempo directly from VS Code — without switching tabs or opening a browser.

---

## Features

- 🔐 **Secure credentials** — Jira and Tempo tokens stored in VS Code's encrypted secret storage
- 🎫 **Ticket search** — type a ticket ID and get live suggestions with issue summaries
- ➕ **Multiple entries** — add several time entries at once and submit all in one click
- 🕐 **Smart start time** — automatically calculates start time based on already logged hours for that day
- 📅 **Per-entry date** — each entry can have its own date, defaults to today
- 📋 **Logged entries** — view, edit and delete entries you've already submitted to Tempo
- 🔄 **Auto-refresh** — logged entries refresh automatically after submitting

---

## Requirements

- A Jira Cloud account with API access
- Tempo installed on your Jira workspace
- VS Code 1.85.0 or higher

---

## Setup

### Step 1 — Generate a Jira API Token

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **Create API token**
3. Give it a label like `VS Code Tempo Logger`
4. Copy the token — you won't be able to see it again

### Step 2 — Generate a Tempo API Token

1. Open Tempo in your browser
2. Go to **Settings** → **API Integration**
3. Click **New Token**
4. Give it a name and copy the token

### Step 3 — Configure the Extension

1. Click the **⏱ Tempo Logger** icon in the VS Code Activity Bar (left sidebar)
2. Enter your **Jira Cloud URL** (e.g. `https://yourcompany.atlassian.net`)
3. Enter your **Jira email** and **Jira API token** → click **Verify & Continue**
4. Enter your **Tempo API token** → click **Verify & Continue**
5. You're ready to log time!

---

## Usage

### Logging Time

1. Open the Tempo Logger panel from the Activity Bar
2. Each entry card has:
   - **Date** — defaults to today, change per entry
   - **Ticket ID** — type to search, click a suggestion to select
   - **Time Spent** — use formats like `1h 30m`, `90m`, `2h`
   - **Start Time** — auto-calculated based on already logged time for that day
   - **Comment** — what you worked on
3. Click **+ Add Another Entry** to add more entries
4. Click **Submit All** to log everything at once

### Viewing Logged Entries

- The **Logged Entries** section at the bottom shows all worklogs for the selected date
- Change the date to view entries for other days
- Click the refresh button to reload
- Total logged time is shown in the section header

### Editing a Logged Entry

1. Click the ✏️ pencil icon on any logged entry
2. Update the fields in the modal
3. Click **Save Changes**

### Deleting a Logged Entry

1. Click the 🗑️ trash icon on any logged entry
2. The entry is removed immediately

### Logging Out

Click the **→** logout icon in the top right of the panel to clear your saved credentials.

---

## Time Format Examples

| Input | Interpreted as |
|---|---|
| `1h 30m` | 1 hour 30 minutes |
| `90m` | 90 minutes |
| `2h` | 2 hours |
| `30` | 30 minutes |

---

## Security

- Your Jira and Tempo API tokens are stored using VS Code's built-in **SecretStorage API** — encrypted on disk, never stored in plain text
- Tokens are never sent anywhere except directly to Jira and Tempo's official APIs
- To remove all stored credentials, click the logout button in the panel

---

## Troubleshooting

**Panel shows blank / doesn't load**
- Make sure the extension is properly installed
- Try reloading VS Code (`Ctrl+Shift+P` → `Developer: Reload Window`)

**Jira verification fails**
- Double check your Jira Cloud URL includes `https://` and ends with `.atlassian.net`
- Make sure you're using an API token, not your account password

**Tempo verification fails**
- Make sure the token is from Tempo's own settings (`Settings → API Integration`), not from Jira
- Check that your Tempo subscription is active

**Ticket search not showing results**
- Make sure the ticket ID format is correct (e.g. `PROJ-123`)
- Check that you have access to the project in Jira

**Time not submitting**
- Verify your Tempo token hasn't expired
- Check that the issue ID exists and you have permission to log time on it

---

## License

MIT