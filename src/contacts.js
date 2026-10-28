import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const CSV_HEADERS = ["company", "email", "contact_name", "industry", "location", "notes"];
const LOG_HEADERS = ["timestamp", "to", "company", "subject", "status", "message_id"];

function loadContacts(filePath) {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function saveContacts(filePath, contacts) {
  const csv = stringify(contacts, { header: true, columns: CSV_HEADERS });
  writeFileSync(filePath, csv);
}

function appendContacts(filePath, newContacts) {
  const existing = loadContacts(filePath);
  const existingEmails = new Set(existing.map((c) => c.email.toLowerCase()));

  const unique = newContacts.filter(
    (c) => c.email && !existingEmails.has(c.email.toLowerCase()),
  );

  const merged = [...existing, ...unique];
  saveContacts(filePath, merged);
  return { added: unique.length, duplicates: newContacts.length - unique.length, total: merged.length };
}

function logSentEmail(logPath, entry) {
  const exists = existsSync(logPath);
  const row = stringify([entry], { columns: LOG_HEADERS });

  if (!exists) {
    const header = stringify([], { header: true, columns: LOG_HEADERS });
    writeFileSync(logPath, header);
  }

  appendFileSync(logPath, row);
}

function getSentEmails(logPath) {
  if (!existsSync(logPath)) return [];
  const raw = readFileSync(logPath, "utf-8");
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function getUnsentContacts(contactsPath, logPath) {
  const contacts = loadContacts(contactsPath);
  const sent = getSentEmails(logPath);
  const sentEmails = new Set(sent.filter((s) => s.status === "sent").map((s) => s.to.toLowerCase()));
  return contacts.filter((c) => !sentEmails.has(c.email.toLowerCase()));
}

export {
  loadContacts,
  saveContacts,
  appendContacts,
  logSentEmail,
  getSentEmails,
  getUnsentContacts,
};
