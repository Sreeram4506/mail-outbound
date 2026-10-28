# Mail Outbound

AI-powered email outbound automation. Gather contacts using AI, generate personalized emails with OpenAI, and send them through your Gmail account.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Fill in your `.env` file:

| Variable | Description |
|----------|-------------|
| `GMAIL_CLIENT_ID` | OAuth2 Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GMAIL_CLIENT_SECRET` | OAuth2 Client Secret |
| `GMAIL_REDIRECT_URI` | Redirect URI (default: `http://localhost:3000/oauth2callback`) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `SENDER_NAME` | Your name (used in email From field) |
| `DAILY_SEND_LIMIT` | Max emails per day (default: 50) |
| `SEND_DELAY_MS` | Delay between emails in ms (default: 2000) |

### 3. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable the **Gmail API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add `http://localhost:3000/oauth2callback` as an authorized redirect URI
7. Copy the Client ID and Client Secret to your `.env`

### 4. Authenticate with Gmail

```bash
npm run auth
```

This opens a browser for Google OAuth. Once authorized, a `token.json` is saved locally.

## Usage

### Gather contacts

Use AI to find contact emails for companies matching your criteria:

```bash
# Interactive
node src/index.js gather

# With arguments
node src/index.js gather --task "software companies in Bangalore" --count 30
```

Contacts are saved to `contacts.csv`.

### Create email templates

```bash
node src/index.js template --create
```

Or use the default template in `templates/default.json`.

### Preview emails

Generate sample emails without sending:

```bash
node src/index.js preview --template default --count 3
```

### Send emails

Generate personalized emails and send to all unsent contacts:

```bash
# Interactive (asks for confirmation)
node src/index.js send --template default

# With a limit
node src/index.js send --template default --limit 10

# Dry run (generate but don't send)
node src/index.js send --template default --dry-run

# Custom instructions
node src/index.js send --template default --instructions "Mention our new AI product launch"
```

### Check status

```bash
node src/index.js status
```

## How it works

1. **Gather**: AI researches and collects contact emails based on your criteria
2. **Template**: You define the email purpose and tone
3. **Generate**: OpenAI generates a unique, personalized email for each contact
4. **Send**: Emails are sent via Gmail API with rate limiting and logging

Each email is individually crafted by AI — no two recipients get the same email. The system tracks what's been sent in `sent_log.csv` so you can resume campaigns.

## Files

| File | Purpose |
|------|---------|
| `contacts.csv` | Gathered contact list |
| `sent_log.csv` | Log of sent/failed emails |
| `token.json` | Gmail OAuth token (gitignored) |
| `templates/*.json` | Saved email templates |
