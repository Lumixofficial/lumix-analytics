const { test } = require("node:test");
const assert = require("node:assert/strict");
const { scryptSync } = require("node:crypto");
const { adminConfig, authenticateAdmin } = require("../lib/visitors/auth.ts");
const { createReportHandler } = require("../lib/visitors/report-handler.ts");
const { summarizePageviews } = require("../lib/visitors/report.ts");
const { networkPrefix, dailyPseudonym, nextUtcDay } = require("../lib/visitors/estimator.ts");
const { visitorState, visitorStorageConfig, visitorStorageState, estimatorConfig } = require("../lib/visitors/config.ts");

const salt = Buffer.alloc(16, 7), password = "test-admin-password";
const env = { VISITOR_ADMIN_USERNAME: "admin", VISITOR_ADMIN_PASSWORD_HASH: `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 32).toString("hex")}`,
  VISITOR_ANALYTICS_ORIGIN: "https://analytics.example.test" };
const basic = (username, pass) => "Basic " + Buffer.from(`${username}:${pass}`).toString("base64");

test("admin verifies salted server-side passwords, rejects missing/wrong credentials and insecure public origins", async () => {
  assert.ok(adminConfig(env));
  assert.equal(await authenticateAdmin(null, env), "unauthorized");
  assert.equal(await authenticateAdmin(basic("admin", password), env), "authorized");
  assert.equal(await authenticateAdmin(basic("wrong", password), env), "unauthorized");
  assert.equal(await authenticateAdmin(basic("admin", "wrong"), env), "unauthorized");
  assert.equal(await authenticateAdmin("Bearer secret", env), "unauthorized");
  assert.equal(await authenticateAdmin(basic("admin", password), { ...env, VISITOR_ADMIN_PASSWORD_HASH: "" }), "unconfigured");
  assert.equal(adminConfig({ ...env, VISITOR_ANALYTICS_ORIGIN: "http://public.example.test" }), null);
  assert.equal(adminConfig({ ...env, VISITOR_ANALYTICS_ORIGIN: "http://localhost:3404", VISITOR_ANALYTICS_DATASET: "test", VISITOR_ANALYTICS_MODE: "local-test" }).username, "admin");
});

test("report authenticates before data access; private/no-store responses and errors disclose no secrets", async () => {
  let reads = 0;
  const report = async () => { reads++; return { dataset: "test", pageviews: { today: 9 } }; };
  const request = new Request("https://analytics.example.test/admin/visitors/report");
  const denied = await createReportHandler({ authenticate: async () => "unauthorized", report })(request);
  assert.equal(denied.status, 401); assert.equal(reads, 0);
  assert.match(denied.headers.get("www-authenticate"), /^Basic /);
  const allowed = await createReportHandler({ authenticate: async () => "authorized", report })(request);
  assert.equal(allowed.status, 200); assert.equal((await allowed.json()).pageviews.today, 9);
  assert.match(allowed.headers.get("cache-control"), /no-store/);assert.equal(allowed.headers.get("vary"), "Authorization");
  assert.equal(allowed.headers.get("access-control-allow-origin"), null);
  const failed = await createReportHandler({ authenticate: async () => "authorized", report: async () => { throw Error("DATABASE_PASSWORD"); } })(request);
  assert.equal(failed.status, 503);assert.equal((await failed.text()).includes("DATABASE_PASSWORD"), false);
});

test("reports actual retained counts, zero-fills UTC dates and never sums visitor estimates", () => {
  const now = new Date("2026-11-15T23:59:59Z");
  const row = (day, route, pageviews, expiry = "2027-01-01") => ({ _id: day+route, day, route, pageviews, expiresAt: new Date(expiry) });
  const summary = summarizePageviews([
    row("2026-11-15", "/", 5), row("2026-11-15", "/transactions", 2), row("2026-11-09", "/", 3),
    row("2026-10-17", "/", 11), row("2026-10-16", "/", 99), row("2026-11-16", "/", 99),
    row("2026-11-14", "/", 88, "2026-11-15T00:00:00Z"), row("2026-11-15", "/private", 99),
  ], now, 30);
  assert.deepEqual(summary.pageviews, { today: 7, last7Days: 10, last30Days: 21 });
  assert.equal(summary.daily.length, 30); assert.deepEqual(summary.daily.at(-1), { day: "2026-11-15", pageviews: 7 });
  assert.deepEqual(summary.daily.at(-2), { day: "2026-11-14", pageviews: 0 });
  assert.deepEqual(summary.routes[0], { route: "/", today: 5, last7Days: 8, last30Days: 19 });
  assert.equal(Object.hasOwn(summary, "uniquePeople"), false);
  assert.equal(summarizePageviews([], now, 7).daily[0].pageviews, null);
});

test("estimation is independently gated and local-test cannot activate on a public origin or production database", () => {
  const testEnv = { VISITOR_ANALYTICS_ENABLED: "true", VISITOR_ANALYTICS_MODE: "local-test", VISITOR_ANALYTICS_DATASET: "test",
    VISITOR_ANALYTICS_ORIGIN: "http://localhost:3404", VISITOR_ANALYTICS_MONGODB_URI: "mongodb://test:password@mongo/lumix_visitors_test" };
  assert.ok(visitorState(testEnv).config);
  assert.equal(visitorState({ ...testEnv, VISITOR_ANALYTICS_ORIGIN: "https://public.test" }).config, null);
  assert.equal(visitorState({ ...testEnv, VISITOR_ANALYTICS_DATASET: "production" }).config, null);
  assert.equal(visitorStorageConfig({ ...testEnv, VISITOR_ANALYTICS_MONGODB_URI: "mongodb://test:password@mongo/lumix_visitors" }), null);
  assert.equal(estimatorConfig({ VISITOR_ANALYTICS_UNIQUES_ENABLED: "true", VISITOR_ANALYTICS_TRUST_PROXY: "true" }).enabled, false);
  assert.equal(estimatorConfig({ VISITOR_ANALYTICS_UNIQUES_ENABLED: "true", VISITOR_ANALYTICS_UNIQUES_REVIEW_ID: "review" }).enabled, false);
  assert.equal(estimatorConfig({ VISITOR_ANALYTICS_UNIQUES_ENABLED: "true", VISITOR_ANALYTICS_UNIQUES_REVIEW_ID: "review", VISITOR_ANALYTICS_TRUST_PROXY: "true" }).enabled, true);
  assert.equal(visitorState({ ...testEnv, VISITOR_ANALYTICS_UNIQUES_ENABLED: "true" }).config.estimator.enabled, false);
});

test("daily pseudonyms use only a coarse canonical network, site and random daily key", () => {
  assert.equal(networkPrefix("192.0.2.1"), "v4:192.0.2.0/24");
  assert.equal(networkPrefix("192.0.2.200"), networkPrefix("::ffff:192.0.2.200"));
  assert.equal(networkPrefix("2001:db8:1234:5::1"), networkPrefix("2001:0db8:1234:ffff:0000:0000:0000:0002"));
  for (const value of [null, "192.0.2.1, 203.0.113.1", "unknown", "fe80::1%eth0"]) assert.equal(networkPrefix(value), null);
  const prefix = networkPrefix("192.0.2.1"), key1 = "a".repeat(64), key2 = "b".repeat(64);
  assert.notEqual(dailyPseudonym(prefix, key1, "https://a.test"), dailyPseudonym(prefix, key2, "https://a.test"));
  assert.notEqual(dailyPseudonym(prefix, key1, "https://a.test"), dailyPseudonym(prefix, key1, "https://b.test"));
  assert.equal(nextUtcDay(new Date("2026-11-15T23:59:59.999Z")).toISOString(), "2026-11-16T00:00:00.000Z");
  assert.equal(nextUtcDay(new Date("2026-11-16T00:00:00.000Z")).toISOString(), "2026-11-17T00:00:00.000Z");
});

test("configuration gives a specific storage-block reason without disclosing credentials", () => {
  assert.equal(visitorStorageState({}).reason, "The visitor Mongo URI is missing.");
  assert.match(visitorStorageState({ VISITOR_ANALYTICS_RETENTION_DAYS: "0" }).reason, /retention/);
  assert.match(visitorStorageState({ VISITOR_ANALYTICS_DATASET: "unknown" }).reason, /dataset/);
  assert.match(visitorStorageState({ VISITOR_ANALYTICS_MONGODB_URI: "mongodb://localhost/lumix_visitors" }).reason, /credentials/);
  assert.match(visitorStorageState({ VISITOR_ANALYTICS_MONGODB_URI: "mongodb://user:secret@localhost/lumix_visitors_test" }).reason, /database name/);
});
