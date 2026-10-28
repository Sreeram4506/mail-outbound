import express from "express";
import cors from "cors";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { google } from "googleapis";
import { loadConfig, loadToken, validateConfig } from "./config.js";
import { getAuthenticatedClient } from "./auth.js";
import { createGmailClient, getSenderEmail } from "./gmail.js";
import { createAIClient, gatherContacts, generateEmail } from "./ai.js";
import {
  loadContacts,
  appendContacts,
  getUnsentContacts,
  getSentEmails,
} from "./contacts.js";
import { runCampaign } from "./campaign.js";
import { loadTemplate, listTemplates, saveTemplate } from "./templates.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(resolve(import.meta.dirname, "../public")));

// ── Health / Status ──────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  const cfg = loadConfig();
  const token = loadToken();
  const missing = validateConfig(cfg);
  const contacts = loadContacts(cfg.paths.contacts);
  const unsent = getUnsentContacts(cfg.paths.contacts, cfg.paths.sentLog);
  const sent = getSentEmails(cfg.paths.sentLog);

  res.json({
    authenticated: !!token,
    configValid: missing.length === 0,
    missingConfig: missing,
    contacts: contacts.length,
    unsent: unsent.length,
    sent: sent.filter((s) => s.status === "sent").length,
    failed: sent.filter((s) => s.status.startsWith("failed")).length,
    dailyLimit: cfg.dailySendLimit,
    sendDelay: cfg.sendDelayMs,
    senderName: cfg.senderName,
  });
});

// ── Auth ─────────────────────────────────────────────────────────
app.get("/api/auth/url", (req, res) => {
  const cfg = loadConfig();
  const missing = validateConfig(cfg);
  if (missing.includes("GMAIL_CLIENT_ID") || missing.includes("GMAIL_CLIENT_SECRET")) {
    return res.status(400).json({ error: "Gmail credentials not configured in .env" });
  }

  const oauth2Client = new google.auth.OAuth2(
    cfg.gmail.clientId,
    cfg.gmail.clientSecret,
    cfg.gmail.redirectUri,
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
    ],
    prompt: "consent",
  });

  res.json({ url: authUrl });
});

app.get("/api/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No authorization code" });

  const cfg = loadConfig();
  const oauth2Client = new google.auth.OAuth2(
    cfg.gmail.clientId,
    cfg.gmail.clientSecret,
    cfg.gmail.redirectUri,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    writeFileSync(cfg.paths.token, JSON.stringify(tokens, null, 2));
    res.redirect("/?auth=success");
  } catch (err) {
    res.redirect(`/?auth=error&message=${encodeURIComponent(err.message)}`);
  }
});

// ── Contacts ─────────────────────────────────────────────────────
app.get("/api/contacts", (req, res) => {
  const cfg = loadConfig();
  const contacts = loadContacts(cfg.paths.contacts);
  res.json({ contacts });
});

app.post("/api/contacts/gather", async (req, res) => {
  const { task, count = 20 } = req.body;
  if (!task) return res.status(400).json({ error: "task is required" });

  const cfg = loadConfig();
  if (!cfg.openai.apiKey) {
    return res.status(400).json({ error: "OPENAI_API_KEY not configured" });
  }

  try {
    const aiClient = createAIClient(cfg.openai.apiKey);
    const contacts = await gatherContacts(aiClient, { task, count });
    res.json({ contacts, count: contacts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/contacts/save", (req, res) => {
  const { contacts } = req.body;
  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ error: "contacts array is required" });
  }

  const cfg = loadConfig();
  const result = appendContacts(cfg.paths.contacts, contacts);
  res.json(result);
});

app.delete("/api/contacts", (req, res) => {
  const cfg = loadConfig();
  writeFileSync(cfg.paths.contacts, "");
  res.json({ message: "Contacts cleared" });
});

// ── Templates ────────────────────────────────────────────────────
app.get("/api/templates", (req, res) => {
  const cfg = loadConfig();
  const names = listTemplates(cfg.paths.templates);
  const templates = names.map((name) => ({
    name,
    ...loadTemplate(cfg.paths.templates, name),
  }));
  res.json({ templates });
});

app.post("/api/templates", (req, res) => {
  const { name, purpose, instructions } = req.body;
  if (!name || !purpose) {
    return res.status(400).json({ error: "name and purpose are required" });
  }

  const cfg = loadConfig();
  saveTemplate(cfg.paths.templates, name, { purpose, instructions: instructions || "" });
  res.json({ message: `Template "${name}" saved` });
});

// ── Preview ──────────────────────────────────────────────────────
app.post("/api/preview", async (req, res) => {
  const { template, customInstructions, contactIndex = 0 } = req.body;
  if (!template) return res.status(400).json({ error: "template is required" });

  const cfg = loadConfig();
  const contacts = loadContacts(cfg.paths.contacts);
  if (contacts.length === 0) {
    return res.status(400).json({ error: "No contacts. Gather contacts first." });
  }

  const contact = contacts[contactIndex % contacts.length];

  try {
    const aiClient = createAIClient(cfg.openai.apiKey);
    const email = await generateEmail(aiClient, {
      template,
      contact,
      senderName: cfg.senderName,
      customInstructions,
    });
    res.json({ email, contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Send Campaign ────────────────────────────────────────────────
let activeCampaign = null;

app.post("/api/send", async (req, res) => {
  const { template, customInstructions, limit, dryRun = false } = req.body;
  if (!template) return res.status(400).json({ error: "template is required" });

  const cfg = loadConfig();
  const token = loadToken();
  if (!token) return res.status(401).json({ error: "Not authenticated with Gmail" });

  const auth = getAuthenticatedClient(cfg, token);
  const unsent = getUnsentContacts(cfg.paths.contacts, cfg.paths.sentLog);
  if (unsent.length === 0) {
    return res.status(400).json({ error: "No unsent contacts" });
  }

  if (activeCampaign) {
    return res.status(409).json({ error: "A campaign is already running" });
  }

  activeCampaign = { started: new Date().toISOString(), progress: [] };

  try {
    const results = await runCampaign(cfg, auth, {
      template,
      customInstructions,
      dryRun,
      limit,
      onProgress: (p) => {
        activeCampaign.progress.push(p);
      },
    });

    activeCampaign = null;
    res.json(results);
  } catch (err) {
    activeCampaign = null;
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/send/progress", (req, res) => {
  if (!activeCampaign) return res.json({ running: false });
  res.json({ running: true, ...activeCampaign });
});

// ── Sent Log ─────────────────────────────────────────────────────
app.get("/api/sent", (req, res) => {
  const cfg = loadConfig();
  const sent = getSentEmails(cfg.paths.sentLog);
  res.json({ sent });
});

// ── SPA fallback ─────────────────────────────────────────────────
app.get("/{*path}", (req, res) => {
  res.sendFile(resolve(import.meta.dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nMail Outbound server running on http://localhost:${PORT}\n`);
});

export default app;
