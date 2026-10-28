import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { resolve } from "path";

function listTemplates(templatesDir) {
  if (!existsSync(templatesDir)) return [];
  return readdirSync(templatesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

function loadTemplate(templatesDir, name) {
  const filePath = resolve(templatesDir, `${name}.json`);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function saveTemplate(templatesDir, name, data) {
  if (!existsSync(templatesDir)) {
    mkdirSync(templatesDir, { recursive: true });
  }
  const filePath = resolve(templatesDir, `${name}.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export { listTemplates, loadTemplate, saveTemplate };
