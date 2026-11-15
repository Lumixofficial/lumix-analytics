const { test } = require("node:test");
const assert = require("node:assert/strict");
const { visitorConfig } = require("../lib/visitors/config.ts");
const { createCollector, isPageview, MAX_EVENT_BYTES } = require("../lib/visitors/collector.ts");
const { normalizeVisitorRoute } = require("../lib/visitors/routes.ts");
const { dailyBucket } = require("../lib/visitors/store.ts");

const env = {
  NODE_ENV: "production", VISITOR_ANALYTICS_ENABLED: "true", VISITOR_ANALYTICS_MODE: "reviewed-exemption",
  VISITOR_ANALYTICS_REVIEW_ID: "test-review", VISITOR_ANALYTICS_LOG_REVIEWED: "true",
  VISITOR_ANALYTICS_ORIGIN: "https://analytics.example.test",
  VISITOR_ANALYTICS_MONGODB_URI: "mongodb://visitors:secret@localhost:27017/lumix_visitors",
  VISITOR_ANALYTICS_CONTROLLER: "Test operator", VISITOR_ANALYTICS_CONTACT_EMAIL: "privacy@example.test",
  VISITOR_ANALYTICS_EXEMPTION: "Test review only", VISITOR_ANALYTICS_HOSTING: "Test host",
  VISITOR_ANALYTICS_PROCESSORS: "Test processor", VISITOR_ANALYTICS_TRANSFERS: "Test assessment",
};
const event = { v: 1, type: "pageview", site: "lumix-analytics", route: "/" };
const now = new Date("2026-11-15T23:59:59.999Z");
function request(body = JSON.stringify(event), headers = {}, extra = {}) {
  return new Request("https://analytics.example.test/api/visitors", {
    method: "POST", body,
    headers: { origin: env.VISITOR_ANALYTICS_ORIGIN, "content-type": "application/json", "sec-fetch-site": "same-origin", ...headers },
    ...extra,
  });
}
function setup(config = visitorConfig(env), overrides = {}) {
  const increments = [], budgets = [];
  const store = {
    takeBudget: async (...args) => { budgets.push(args); return true; },
    increment: async (...args) => { increments.push(args); }, ...overrides,
  };
  let connects = 0;
  const collect = createCollector({ config: () => config, store: async () => { connects++; return store; }, now: () => now });
  return { collect, increments, budgets, connects: () => connects };
}

test("deployment gate fails closed for missing review, notice, logs, storage, invalid limits/origins", () => {
  assert.equal(visitorConfig({}), null);
  assert.ok(visitorConfig(env));
  for (const key of Object.keys(env).filter(k => k.startsWith("VISITOR_"))) {
    assert.equal(visitorConfig({ ...env, [key]: "" }), null, key);
  }
  for (const origin of ["*", "null", "https://analytics.example.test/", "https://a.test/path", "http://a.test", "https://user:pass@a.test"]) {
    assert.equal(visitorConfig({ ...env, VISITOR_ANALYTICS_ORIGIN: origin }), null);
  }
  for (const uri of ["mongodb://localhost/lumix", "mongodb://localhost/lumix_visitors", "https://a.test/lumix_visitors"]) {
    assert.equal(visitorConfig({ ...env, VISITOR_ANALYTICS_MONGODB_URI: uri }), null);
  }
  for (const days of ["0", "91", "NaN", "1.5", ""]) {
    assert.equal(visitorConfig({ ...env, VISITOR_ANALYTICS_RETENTION_DAYS: days }), null);
  }
});

test("strict schema and route normalization exclude arbitrary and identifying dimensions", () => {
  assert.equal(isPageview(event), true);
  for (const key of ["wallet", "txHash", "account", "email", "url", "referrer", "timestamp", "ip", "userAgent", "session"]) {
    assert.equal(isPageview({ ...event, [key]: "sensitive" }), false);
  }
  for (const value of [null, [], {}, { ...event, v: "1" }, { ...event, site: "other" },
    { ...event, route: "/transactions?wallet=secret" }, { ...event, type: "swap" }]) assert.equal(isPageview(value), false);
  assert.equal(normalizeVisitorRoute("/transactions/?wallet=secret#hash"), "/transactions");
  for (const route of ["/transactions/secret", "/account/email@example.test", "/privacy", "/%74ransactions", "//evil.test", "/api/visitors"]) {
    assert.equal(normalizeVisitorRoute(route), null);
  }
});

test("disabled and privacy-signalled requests never open storage or read a body", async () => {
  const off = setup(null);
  assert.equal((await off.collect(request("invalid"))).status, 204);
  assert.equal(off.connects(), 0);
  for (const headers of [{ dnt: "1" }, { "sec-gpc": "1" }]) {
    const ctx = setup();
    assert.equal((await ctx.collect(request("invalid", headers))).status, 204);
    assert.equal(ctx.connects(), 0);
  }
});

test("collector accepts only exact same origin, JSON, bounded schema and size", async () => {
  const cases = [
    [request(undefined, { origin: "https://evil.test" }), 403],
    [request(undefined, { origin: "null" }), 403],
    [request(undefined, { "sec-fetch-site": "same-site" }), 403],
    [request(undefined, { "content-type": "text/plain" }), 415],
    [request(undefined, { "content-encoding": "gzip" }), 415],
    [request("invalid"), 400], [request(JSON.stringify({ ...event, email: "private" })), 400],
    [request(" ".repeat(MAX_EVENT_BYTES + 1)), 413],
    [request(undefined, { "content-length": "257" }), 413],
    [request(undefined, { "content-length": "bad" }), 413],
    [request(undefined, {}, { method: "PUT" }), 405],
  ];
  const withQuery = request();
  cases.push([new Request(withQuery.url + "?email=private", withQuery), 403]);
  for (const [req, status] of cases) {
    const ctx = setup();
    const response = await ctx.collect(req);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(await response.text(), "");
    assert.equal(ctx.connects(), 0);
  }
});

test("valid events promptly increment only a canonical route and server UTC day", async () => {
  const ctx = setup();
  const response = await ctx.collect(request(undefined, {
    "x-forwarded-for": "192.0.2.1", "user-agent": "secret-client", referer: "https://a.test/wallet/secret",
    cookie: "wallet=secret", "content-type": "application/json; charset=utf-8",
  }));
  assert.equal(response.status, 204);
  assert.deepEqual(ctx.increments, [["/", now, 30]]);
  assert.deepEqual(ctx.budgets, [[now, 300]]);
  assert.deepEqual(dailyBucket("/", now, 30), {
    _id: "2026-11-15:/", day: "2026-11-15", route: "/", expiresAt: new Date("2026-12-15T00:00:00Z"),
  });
  assert.equal(dailyBucket("/", new Date("2026-11-16T00:00:00Z"), 1).day, "2026-11-16");
});

test("database failures are private and do not escape or retry", async () => {
  const ctx = setup(undefined, { increment: async () => { throw new Error("secret database credentials"); } });
  const response = await ctx.collect(request());
  assert.equal(response.status, 503);
  assert.equal(await response.text(), "");
  assert.equal(ctx.connects(), 1);
});

test("global distributed and local limits use no per-client keys", async () => {
  const shared = setup(undefined, { takeBudget: async () => false });
  assert.equal((await shared.collect(request())).status, 429);
  assert.deepEqual(shared.increments, []);
  const ctx = setup({ ...visitorConfig(env), maxPerMinute: 1 });
  assert.equal((await ctx.collect(request())).status, 204);
  assert.equal((await ctx.collect(request())).status, 204);
  const limited = await ctx.collect(request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "60");
});

test("slow/chunked bodies time out, cancel, and do not retain an event", async () => {
  let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } });
  const ctx = setup();
  const response = await ctx.collect(request(stream, {}, { duplex: "half" }));
  assert.equal(response.status, 408);
  assert.equal(cancelled, true);
  assert.equal(ctx.connects(), 0);
  const big = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(200)); c.enqueue(new Uint8Array(100)); c.close(); } });
  assert.equal((await setup().collect(request(big, {}, { duplex: "half" }))).status, 413);
});

test("collector bounds in-flight work across clients without creating client keys", async () => {
  const release = [];
  const ctx = setup(undefined, { increment: () => new Promise(resolve => release.push(resolve)) });
  const accepted = Array.from({ length: 8 }, () => ctx.collect(request()));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(release.length, 8);
  assert.equal((await ctx.collect(request())).status, 429);
  release.forEach(resolve => resolve());
  assert.deepEqual((await Promise.all(accepted)).map(r => r.status), Array(8).fill(204));
});

test("optional estimator receives only the trusted header after counting; pageviews remain independent", async () => {
  const estimates = [];
  const config = { ...visitorConfig(env), estimator: { enabled: true, reason: "test" } };
  const ctx = setup(config, { estimate: async (...args) => estimates.push(args) });
  assert.equal((await ctx.collect(request(undefined, { "x-lumix-client-ip": "192.0.2.1", "x-forwarded-for": "198.51.100.1", "user-agent": "private" }))).status, 204);
  assert.deepEqual(ctx.increments, [["/", now, 30]]);
  assert.deepEqual(estimates, [["192.0.2.1", now, env.VISITOR_ANALYTICS_ORIGIN]]);
  const off = setup(undefined, { estimate: async () => { throw Error("must not run"); } });
  assert.equal((await off.collect(request())).status, 204);
  assert.equal(off.increments.length, 1);
});
