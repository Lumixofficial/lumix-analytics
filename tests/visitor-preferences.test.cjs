const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/visitors/preferences.ts"), "utf8");

test("privacy control stores only an objection and keeps it effective when preference writes fail", () => {
  const values = new Map(), window = new EventTarget();
  let privacyEvents = 0, denyWrite = false, denyRead = false;
  window.addEventListener("lumix:privacy", () => privacyEvents++);
  const localStorage = {
    getItem(key) { if (denyRead) throw Error("denied"); return values.get(key) ?? null; },
    setItem(key, value) { if (denyWrite) throw Error("quota"); values.set(key, value); },
    removeItem(key) { if (denyWrite) throw Error("denied"); values.delete(key); },
  };
  const context = vm.createContext({ window, localStorage, navigator: {}, Event, exports: {} });
  vm.runInContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  const { privacyPreference, setVisitorOptOut } = context.exports;
  assert.equal(privacyPreference(), "available");
  assert.equal(setVisitorOptOut(true), true);
  assert.deepEqual([...values], [["lumix:visitor-opt-out", "1"]]);
  assert.equal(privacyPreference(), "out");
  assert.equal(setVisitorOptOut(false), true); assert.equal(values.size, 0);
  denyWrite = true;
  assert.equal(setVisitorOptOut(true), false);
  assert.equal(values.size, 0); assert.equal(privacyPreference(), "out");
  assert.equal(privacyEvents, 3);
  denyRead = true; window.__lumixVisitorOptOut = false;
  assert.equal(privacyPreference(), "blocked");
  denyRead = false; window.doNotTrack = "1";
  assert.equal(privacyPreference(), "blocked");
});
