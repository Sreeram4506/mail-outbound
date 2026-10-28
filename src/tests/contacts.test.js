import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { loadContacts, appendContacts } from "../contacts.js";

const TEST_FILE = resolve(import.meta.dirname, "../../test_contacts.csv");

describe("contacts", () => {
  afterEach(() => {
    if (existsSync(TEST_FILE)) unlinkSync(TEST_FILE);
  });

  it("returns empty array for missing file", () => {
    const contacts = loadContacts("/tmp/nonexistent.csv");
    assert.deepEqual(contacts, []);
  });

  it("loads contacts from CSV", () => {
    writeFileSync(
      TEST_FILE,
      "company,email,contact_name,industry,location,notes\nAcme,info@acme.com,John,Tech,NYC,Makes widgets\n",
    );
    const contacts = loadContacts(TEST_FILE);
    assert.equal(contacts.length, 1);
    assert.equal(contacts[0].company, "Acme");
    assert.equal(contacts[0].email, "info@acme.com");
  });

  it("deduplicates on append", () => {
    writeFileSync(
      TEST_FILE,
      "company,email,contact_name,industry,location,notes\nAcme,info@acme.com,John,Tech,NYC,Makes widgets\n",
    );

    const result = appendContacts(TEST_FILE, [
      { company: "Acme", email: "info@acme.com", contact_name: "John", industry: "Tech", location: "NYC", notes: "Dup" },
      { company: "Beta", email: "hi@beta.io", contact_name: "Jane", industry: "SaaS", location: "SF", notes: "New" },
    ]);

    assert.equal(result.added, 1);
    assert.equal(result.duplicates, 1);
    assert.equal(result.total, 2);
  });
});
