import { createGmailClient, sendEmail, getSenderEmail } from "./gmail.js";
import { createAIClient, generateEmail } from "./ai.js";
import { logSentEmail, getUnsentContacts } from "./contacts.js";
import { buildHtmlEmail } from "./email-template.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCampaign(cfg, auth, options) {
  const {
    template,
    customInstructions,
    dryRun = false,
    onProgress,
    limit,
  } = options;

  const gmail = createGmailClient(auth);
  const aiClient = createAIClient(cfg.openai.apiKey);
  const senderEmail = await getSenderEmail(gmail);
  const senderName = cfg.senderName;

  const contacts = getUnsentContacts(cfg.paths.contacts, cfg.paths.sentLog);
  const toSend = limit ? contacts.slice(0, limit) : contacts;

  if (toSend.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, message: "No unsent contacts found" };
  }

  const results = { sent: 0, failed: 0, skipped: 0, emails: [] };

  for (let i = 0; i < toSend.length; i++) {
    const contact = toSend[i];

    if (results.sent >= cfg.dailySendLimit) {
      results.skipped += toSend.length - i;
      break;
    }

    try {
      const email = await generateEmail(aiClient, {
        template,
        contact,
        senderName,
        customInstructions,
      });

      const htmlBody = buildHtmlEmail({
        body: email.body,
        senderName,
        logoUrl: cfg.logoUrl,
        companyName: cfg.companyName,
        websiteUrl: cfg.websiteUrl,
      });

      const emailData = {
        to: contact.email,
        from: senderEmail,
        fromName: senderName,
        subject: email.subject,
        body: htmlBody,
        isHtml: true,
      };

      if (onProgress) {
        onProgress({
          index: i + 1,
          total: toSend.length,
          contact,
          email,
          phase: "generated",
        });
      }

      if (!dryRun) {
        const result = await sendEmail(gmail, emailData);

        logSentEmail(cfg.paths.sentLog, {
          timestamp: new Date().toISOString(),
          to: contact.email,
          company: contact.company,
          subject: email.subject,
          status: "sent",
          message_id: result.id,
        });

        results.sent++;

        if (onProgress) {
          onProgress({
            index: i + 1,
            total: toSend.length,
            contact,
            email,
            phase: "sent",
            messageId: result.id,
          });
        }

        if (i < toSend.length - 1) {
          await sleep(cfg.sendDelayMs);
        }
      } else {
        results.sent++;
        if (onProgress) {
          onProgress({
            index: i + 1,
            total: toSend.length,
            contact,
            email,
            phase: "dry-run",
          });
        }
      }

      results.emails.push({ contact, email, status: dryRun ? "dry-run" : "sent" });
    } catch (err) {
      results.failed++;

      logSentEmail(cfg.paths.sentLog, {
        timestamp: new Date().toISOString(),
        to: contact.email,
        company: contact.company,
        subject: "",
        status: `failed: ${err.message}`,
        message_id: "",
      });

      results.emails.push({ contact, error: err.message, status: "failed" });

      if (onProgress) {
        onProgress({
          index: i + 1,
          total: toSend.length,
          contact,
          phase: "error",
          error: err.message,
        });
      }
    }
  }

  return results;
}

export { runCampaign };
