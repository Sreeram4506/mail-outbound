import { google } from "googleapis";

function createGmailClient(auth) {
  return google.gmail({ version: "v1", auth });
}

function buildRawEmail({ to, from, fromName, subject, body, isHtml = true }) {
  const headers = [
    `From: ${fromName} <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
  ].join("\r\n");

  const message = `${headers}\r\n\r\n${body}`;

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendEmail(gmail, { to, from, fromName, subject, body, isHtml = true }) {
  const raw = buildRawEmail({ to, from, fromName, subject, body, isHtml });

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return result.data;
}

async function getSenderEmail(gmail) {
  const profile = await gmail.users.getProfile({ userId: "me" });
  return profile.data.emailAddress;
}

async function getRecentEmails(gmail, { query, maxResults = 50 }) {
  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  if (!response.data.messages) return [];

  const emails = [];
  for (const msg of response.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    });

    const headers = {};
    for (const h of detail.data.payload.headers) {
      headers[h.name.toLowerCase()] = h.value;
    }
    emails.push(headers);
  }

  return emails;
}

export { createGmailClient, sendEmail, getSenderEmail, getRecentEmails };
