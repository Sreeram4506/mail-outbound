import { config as dotenvConfig } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

dotenvConfig();

const ROOT_DIR = resolve(import.meta.dirname, "..");
const TOKEN_PATH = resolve(ROOT_DIR, "token.json");
const CONTACTS_PATH = resolve(ROOT_DIR, "contacts.csv");
const SENT_LOG_PATH = resolve(ROOT_DIR, "sent_log.csv");
const TEMPLATES_DIR = resolve(ROOT_DIR, "templates");

function loadConfig() {
  return {
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      redirectUri: process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/oauth2callback",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    senderName: process.env.SENDER_NAME || "Mail Outbound User",
    dailySendLimit: parseInt(process.env.DAILY_SEND_LIMIT || "50", 10),
    sendDelayMs: parseInt(process.env.SEND_DELAY_MS || "2000", 10),
    paths: {
      root: ROOT_DIR,
      token: TOKEN_PATH,
      contacts: CONTACTS_PATH,
      sentLog: SENT_LOG_PATH,
      templates: TEMPLATES_DIR,
    },
  };
}

function loadToken() {
  if (!existsSync(TOKEN_PATH)) return null;
  return JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
}

function validateConfig(cfg) {
  const missing = [];
  if (!cfg.gmail.clientId) missing.push("GMAIL_CLIENT_ID");
  if (!cfg.gmail.clientSecret) missing.push("GMAIL_CLIENT_SECRET");
  if (!cfg.openai.apiKey) missing.push("OPENAI_API_KEY");
  return missing;
}

export { loadConfig, loadToken, validateConfig };
