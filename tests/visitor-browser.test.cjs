const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { VISITOR_ROUTES } = require("../lib/visitors/routes.ts");
const code = fs.readFileSync(require("node:path").join(__dirname, "../public/visitor-analytics.js"), "utf8");

function browser(options = {}) {
  const events = new EventTarget(), document = new EventTarget();
  document.currentScript = { dataset: { site: "lumix-analytics" } };
  document.visibilityState = options.hidden ? "hidden" : "visible";
  const values = new Map(options.optOut ? [["lumix:visitor-opt-out", "1"]] : []);
  const writes = [], calls = [], timers = new Map();
  const localStorage = {
    getItem(key) { if (options.storageError) throw new Error("blocked"); return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, value]); values.set(key, value); },
    removeItem(key) { writes.push([key]); values.delete(key); },
  };
  const window = Object.assign(events, { navigator: { globalPrivacyControl: options.gpc, doNotTrack: options.dnt } });
  window.top = window.self = window;
  const location = { pathname: options.path ?? "/", search: "?wallet=secret", hash: "#email=secret" };
  const context = vm.createContext({ window, document, location, navigator: window.navigator, localStorage,
    AbortController, Set, JSON,
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, init) { calls.push({ url, init }); return options.failure ? Promise.reject(new Error("offline")) : Promise.resolve({ status: 204 }); },
  });
  const run = () => vm.runInContext(code, context);
  const dispatch = (type) => window.dispatchEvent(new Event(type));
  const navigate = (path) => { location.pathname = path; dispatch("lumix:route"); };
  run();
  return { calls, writes, values, window, document, navigate, dispatch, run, timers };
}

test("external script counts initial and client navigations once, ignoring queries/fragments and unknown identifiers", () => {
  const b = browser();
  b.dispatch("lumix:route"); b.run(); b.dispatch("lumix:route");
  assert.equal(b.calls.length, 1);
  b.navigate("/transactions"); b.dispatch("lumix:route"); b.navigate("/transactions/");
  assert.equal(b.calls.length, 2);
  b.navigate("/"); assert.equal(b.calls.length, 3);
  b.navigate("/transactions/private-wallet"); b.navigate("/privacy");
  assert.equal(b.calls.length, 3);
  b.navigate("/"); assert.equal(b.calls.length, 4);
  assert.deepEqual([...new Set(b.calls.map(c => JSON.parse(c.init.body).route))], VISITOR_ROUTES);
  for (const call of b.calls) {
    assert.equal(call.url, "/api/visitors");
    assert.deepEqual(Object.keys(JSON.parse(call.init.body)), ["v", "type", "site", "route"]);
    assert.equal(call.init.credentials, "omit"); assert.equal(call.init.referrerPolicy, "no-referrer");
    assert.equal(call.init.keepalive, true); assert.equal(call.init.cache, "no-store");
    assert.equal(call.init.mode, "same-origin");
    assert.equal(call.init.body.includes("secret"), false);
  }
  assert.deepEqual(b.writes, []);
});

test("privacy preferences and signals block initial and later events, storage denial fails closed", () => {
  for (const options of [{ optOut: true }, { gpc: true }, { dnt: "1" }, { dnt: "yes" }, { storageError: true }]) {
    const b = browser(options); b.navigate("/transactions");
    assert.equal(b.calls.length, 0); assert.deepEqual(b.writes, []);
  }
  const b = browser();
  b.window.__lumixVisitorOptOut = true; b.dispatch("lumix:privacy");
  assert.equal(b.calls[0].init.signal.aborted, true);
  b.navigate("/transactions"); assert.equal(b.calls.length, 1);
  b.window.__lumixVisitorOptOut = false; b.values.delete("lumix:visitor-opt-out"); b.dispatch("lumix:privacy");
  assert.equal(b.calls.length, 1); // Removing a preference does not trigger collection.
  b.navigate("/transactions"); assert.equal(b.calls.length, 2);
  b.values.set("lumix:visitor-opt-out", "1"); b.dispatch("storage"); b.navigate("/");
  assert.equal(b.calls.length, 2);
});

test("hidden loads wait for visibility; offline events never retry or store a queue", async () => {
  const b = browser({ hidden: true, failure: true });
  assert.equal(b.calls.length, 0);
  b.document.visibilityState = "visible"; b.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(b.calls.length, 1);
  await new Promise(resolve => setImmediate(resolve));
  b.dispatch("lumix:route"); assert.equal(b.calls.length, 1);
  assert.equal(b.timers.size, 0); assert.deepEqual(b.writes, []);
});
