#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, loadToken, validateConfig } from "./config.js";
import { authenticate, getAuthenticatedClient } from "./auth.js";
import { createGmailClient, getSenderEmail } from "./gmail.js";
import { createAIClient, gatherContacts, generateEmail, refineEmail } from "./ai.js";
import {
  loadContacts,
  appendContacts,
  getUnsentContacts,
} from "./contacts.js";
import { runCampaign } from "./campaign.js";
import { loadTemplate, listTemplates, saveTemplate } from "./templates.js";

const program = new Command();

program
  .name("mail-outbound")
  .description("AI-powered email outbound automation")
  .version("1.0.0");

// ── Auth command ──────────────────────────────────────────────────
program
  .command("auth")
  .description("Authenticate with Gmail (OAuth2)")
  .action(async () => {
    const cfg = loadConfig();
    const missing = validateConfig(cfg);
    if (missing.length > 0) {
      console.error(chalk.red(`Missing config: ${missing.join(", ")}`));
      console.error(chalk.yellow("Copy .env.example to .env and fill in your credentials."));
      process.exit(1);
    }
    await authenticate();
  });

// ── Gather command ───────────────────────────────────────────────
program
  .command("gather")
  .description("Use AI to gather contact emails for a given criteria")
  .option("-t, --task <task>", "What contacts to find (e.g., 'software companies in Hyderabad')")
  .option("-c, --count <count>", "Number of contacts to gather", "20")
  .action(async (opts) => {
    const cfg = loadConfig();
    const missing = validateConfig(cfg);
    if (missing.includes("OPENAI_API_KEY")) {
      console.error(chalk.red("OPENAI_API_KEY is required. Set it in .env"));
      process.exit(1);
    }

    let task = opts.task;
    if (!task) {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "task",
          message: "What contacts should I find?",
          default: "software companies in Hyderabad",
        },
      ]);
      task = answer.task;
    }

    const spinner = ora(`Gathering contacts: "${task}"...`).start();

    try {
      const aiClient = createAIClient(cfg.openai.apiKey);
      const contacts = await gatherContacts(aiClient, {
        task,
        count: parseInt(opts.count, 10),
      });

      spinner.succeed(`Found ${contacts.length} contacts`);

      console.log(chalk.cyan("\nContacts found:"));
      console.table(
        contacts.map((c) => ({
          Company: c.company,
          Email: c.email,
          Contact: c.contact_name,
          Location: c.location,
        })),
      );

      const { save } = await inquirer.prompt([
        {
          type: "confirm",
          name: "save",
          message: "Save these contacts?",
          default: true,
        },
      ]);

      if (save) {
        const result = appendContacts(cfg.paths.contacts, contacts);
        console.log(
          chalk.green(
            `\nSaved! Added: ${result.added}, Duplicates skipped: ${result.duplicates}, Total: ${result.total}`,
          ),
        );
      }
    } catch (err) {
      spinner.fail("Failed to gather contacts");
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

// ── Template command ─────────────────────────────────────────────
program
  .command("template")
  .description("Manage email templates")
  .option("-l, --list", "List saved templates")
  .option("-c, --create", "Create a new template interactively")
  .option("-n, --name <name>", "Template name")
  .action(async (opts) => {
    if (opts.list) {
      const templates = listTemplates(loadConfig().paths.templates);
      if (templates.length === 0) {
        console.log(chalk.yellow("No templates yet. Create one with: mail-outbound template --create"));
        return;
      }
      console.log(chalk.cyan("\nSaved templates:"));
      templates.forEach((t) => console.log(`  - ${t}`));
      return;
    }

    if (opts.create) {
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Template name:",
          default: opts.name || "default",
        },
        {
          type: "editor",
          name: "purpose",
          message: "Describe the email purpose/template (this guides AI generation):",
        },
        {
          type: "input",
          name: "instructions",
          message: "Any special instructions for the AI? (optional)",
        },
      ]);

      const cfg = loadConfig();
      saveTemplate(cfg.paths.templates, answers.name, {
        purpose: answers.purpose,
        instructions: answers.instructions,
      });
      console.log(chalk.green(`Template "${answers.name}" saved!`));
      return;
    }

    program.commands.find((c) => c.name() === "template").help();
  });

// ── Preview command ──────────────────────────────────────────────
program
  .command("preview")
  .description("Preview AI-generated emails before sending")
  .option("-t, --template <name>", "Template name to use")
  .option("-n, --count <count>", "Number of previews to generate", "3")
  .action(async (opts) => {
    const cfg = loadConfig();
    const missing = validateConfig(cfg);
    if (missing.length > 0) {
      console.error(chalk.red(`Missing config: ${missing.join(", ")}`));
      process.exit(1);
    }

    let templateText;
    if (opts.template) {
      const loaded = loadTemplate(cfg.paths.templates, opts.template);
      if (!loaded) {
        console.error(chalk.red(`Template "${opts.template}" not found`));
        process.exit(1);
      }
      templateText = loaded.purpose;
    } else {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "template",
          message: "Describe the email you want to send:",
        },
      ]);
      templateText = answer.template;
    }

    const contacts = loadContacts(cfg.paths.contacts);
    if (contacts.length === 0) {
      console.error(chalk.red("No contacts found. Run 'gather' first."));
      process.exit(1);
    }

    const count = Math.min(parseInt(opts.count, 10), contacts.length);
    const aiClient = createAIClient(cfg.openai.apiKey);

    console.log(chalk.cyan(`\nGenerating ${count} preview emails...\n`));

    for (let i = 0; i < count; i++) {
      const contact = contacts[i];
      const spinner = ora(`Generating email for ${contact.company}...`).start();

      try {
        const email = await generateEmail(aiClient, {
          template: templateText,
          contact,
          senderName: cfg.senderName,
        });

        spinner.succeed(`Email for ${contact.company}`);
        console.log(chalk.gray("─".repeat(60)));
        console.log(chalk.bold(`To: ${contact.email}`));
        console.log(chalk.bold(`Subject: ${email.subject}`));
        console.log(chalk.gray("─".repeat(60)));
        console.log(email.body);
        console.log(chalk.gray("─".repeat(60) + "\n"));
      } catch (err) {
        spinner.fail(`Failed for ${contact.company}: ${err.message}`);
      }
    }
  });

// ── Send command ─────────────────────────────────────────────────
program
  .command("send")
  .description("Generate and send personalized emails to all unsent contacts")
  .option("-t, --template <name>", "Template name to use")
  .option("-i, --instructions <text>", "Custom instructions for email generation")
  .option("-l, --limit <count>", "Max emails to send in this run")
  .option("--dry-run", "Generate emails but don't send them")
  .action(async (opts) => {
    const cfg = loadConfig();
    const missing = validateConfig(cfg);
    if (missing.length > 0) {
      console.error(chalk.red(`Missing config: ${missing.join(", ")}`));
      process.exit(1);
    }

    const token = loadToken();
    if (!token) {
      console.error(chalk.red("Not authenticated. Run 'mail-outbound auth' first."));
      process.exit(1);
    }

    const auth = getAuthenticatedClient(cfg, token);
    const unsent = getUnsentContacts(cfg.paths.contacts, cfg.paths.sentLog);

    if (unsent.length === 0) {
      console.log(chalk.yellow("No unsent contacts. Gather more contacts or check sent_log.csv."));
      return;
    }

    let templateText;
    let customInstructions = opts.instructions || "";

    if (opts.template) {
      const loaded = loadTemplate(cfg.paths.templates, opts.template);
      if (!loaded) {
        console.error(chalk.red(`Template "${opts.template}" not found`));
        process.exit(1);
      }
      templateText = loaded.purpose;
      if (loaded.instructions) customInstructions += " " + loaded.instructions;
    } else {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "template",
          message: "Describe the email to send:",
        },
      ]);
      templateText = answer.template;
    }

    const limit = opts.limit ? parseInt(opts.limit, 10) : undefined;
    const sendCount = limit ? Math.min(limit, unsent.length) : unsent.length;

    console.log(chalk.cyan(`\n${opts.dryRun ? "[DRY RUN] " : ""}Sending to ${sendCount} contacts\n`));

    if (!opts.dryRun) {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Send ${sendCount} personalized emails?`,
          default: false,
        },
      ]);
      if (!confirm) {
        console.log("Cancelled.");
        return;
      }
    }

    const results = await runCampaign(cfg, auth, {
      template: templateText,
      customInstructions,
      dryRun: opts.dryRun,
      limit,
      onProgress: ({ index, total, contact, email, phase, error }) => {
        const prefix = `[${index}/${total}]`;
        if (phase === "generated") {
          console.log(chalk.gray(`${prefix} Generated email for ${contact.company}`));
        } else if (phase === "sent") {
          console.log(chalk.green(`${prefix} ✅ Sent to ${contact.email} — "${email.subject}"`));
        } else if (phase === "dry-run") {
          console.log(chalk.blue(`${prefix} 📋 [DRY RUN] ${contact.email} — "${email.subject}"`));
        } else if (phase === "error") {
          console.log(chalk.red(`${prefix} ❌ Failed: ${contact.email} — ${error}`));
        }
      },
    });

    console.log(chalk.cyan("\n═══ Campaign Results ═══"));
    console.log(chalk.green(`  Sent:    ${results.sent}`));
    console.log(chalk.red(`  Failed:  ${results.failed}`));
    console.log(chalk.yellow(`  Skipped: ${results.skipped}`));
  });

// ── Status command ───────────────────────────────────────────────
program
  .command("status")
  .description("Show current campaign status")
  .action(() => {
    const cfg = loadConfig();
    const contacts = loadContacts(cfg.paths.contacts);
    const unsent = getUnsentContacts(cfg.paths.contacts, cfg.paths.sentLog);
    const token = loadToken();

    console.log(chalk.cyan("\n═══ Mail Outbound Status ═══\n"));
    console.log(`  Auth:          ${token ? chalk.green("Authenticated") : chalk.red("Not authenticated")}`);
    console.log(`  Total contacts: ${contacts.length}`);
    console.log(`  Unsent:         ${unsent.length}`);
    console.log(`  Sent:           ${contacts.length - unsent.length}`);
    console.log(`  Daily limit:    ${cfg.dailySendLimit}`);
    console.log(`  Send delay:     ${cfg.sendDelayMs}ms`);
    console.log();
  });

program.parse();
