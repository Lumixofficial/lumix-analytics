const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

test("native dev setup is repeatable, preserves existing settings/secrets and selects only test Mongo", async () => {
  const { configureVisitorDev } = await import("../scripts/visitors-dev-config.mjs");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lumix-dev-config-"));
  const directory = path.join(root, ".local", "visitors-test");
  fs.mkdirSync(directory, { recursive: true });
  const uri = "mongodb://test:fixture@mongo:27017/lumix_visitors_test?authSource=lumix_visitors_test";
  fs.writeFileSync(path.join(directory, "visitor-mongo-uri"), uri);
  fs.writeFileSync(path.join(directory, "admin-login.json"), JSON.stringify({ username: "existing_admin", password: "unchanged" }));
  fs.writeFileSync(path.join(root, ".env.local"), "NEXT_PUBLIC_API_URL=http://localhost:8080\nEXISTING_SETTING=preserved\n");
  try {
    configureVisitorDev(root);
    const first = fs.readFileSync(path.join(root, ".env.local"), "utf8");
    configureVisitorDev(root);
    assert.equal(fs.readFileSync(path.join(root, ".env.local"), "utf8"), first);
    assert.match(first, /VISITOR_ANALYTICS_ORIGIN="http:\/\/localhost:3000"/);
    assert.match(first, /EXISTING_SETTING=preserved/);
    assert.match(first, /VISITOR_ADMIN_USERNAME="existing_admin"/);
    assert.equal(fs.readFileSync(path.join(directory, "visitor-mongo-uri"), "utf8"), uri);
    assert.match(fs.readFileSync(path.join(directory, "visitor-mongo-uri-dev"), "utf8"), /127\.0\.0\.1:27029\/lumix_visitors_test/);
    fs.appendFileSync(path.join(root, ".env.local"), "VISITOR_ANALYTICS_DATASET=production\n");
    const conflict = fs.readFileSync(path.join(root, ".env.local"), "utf8");
    assert.throws(() => configureVisitorDev(root), /reconciled manually/);
    assert.equal(fs.readFileSync(path.join(root, ".env.local"), "utf8"), conflict);
  } finally {
    for (const name of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, name));
    fs.rmdirSync(directory); fs.rmdirSync(path.dirname(directory));
    fs.unlinkSync(path.join(root, ".env.local")); fs.rmdirSync(root);
  }
});
