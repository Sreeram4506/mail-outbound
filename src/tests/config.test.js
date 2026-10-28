import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, validateConfig } from "../config.js";

describe("config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GMAIL_CLIENT_ID = "test-client-id";
    process.env.GMAIL_CLIENT_SECRET = "test-client-secret";
    process.env.OPENAI_API_KEY = "test-openai-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("loads config from env vars", () => {
    const cfg = loadConfig();
    assert.equal(cfg.gmail.clientId, "test-client-id");
    assert.equal(cfg.gmail.clientSecret, "test-client-secret");
    assert.equal(cfg.openai.apiKey, "test-openai-key");
  });

  it("uses defaults for optional values", () => {
    const cfg = loadConfig();
    assert.equal(cfg.dailySendLimit, 50);
    assert.equal(cfg.sendDelayMs, 2000);
  });

  it("validates missing config fields", () => {
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.OPENAI_API_KEY;
    const cfg = loadConfig();
    const missing = validateConfig(cfg);
    assert.ok(missing.includes("GMAIL_CLIENT_ID"));
    assert.ok(missing.includes("OPENAI_API_KEY"));
    assert.ok(!missing.includes("GMAIL_CLIENT_SECRET"));
  });
});
