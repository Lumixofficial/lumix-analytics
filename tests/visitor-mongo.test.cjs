const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MongoClient } = require("mongodb");
const { initializeVisitorCollections, collectionStore } = require("../lib/visitors/store.ts");

const uri = process.env.VISITOR_TEST_MONGODB_URI;
test("Mongo: concurrent aggregation, shared budget, retention changes and idle TTL deletion", { skip: !uri, timeout: 15_000 }, async () => {
  // This test owns ONLY the explicitly documented disposable localhost port.
  assert.equal(uri, "mongodb://127.0.0.1:27028/lumix_visitors");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("lumix_visitors");
  try {
    await db.dropDatabase();
    const daily = db.collection("daily_pageviews"), budgets = db.collection("collector_budgets");
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    await daily.insertOne({ _id: "2000-01-01:/", day: "2000-01-01", route: "/", pageviews: 1, expiresAt: new Date("2099-01-01") });
    await daily.insertOne({ _id: `${today}:/transactions`, day: today, route: "/transactions", pageviews: 1, expiresAt: new Date("2099-01-01") });
    await initializeVisitorCollections(daily, budgets, 1, now);
    assert.equal(await daily.countDocuments({ day: "2000-01-01" }), 0);
    const existing = await daily.findOne({ route: "/transactions" });
    assert.equal(existing.expiresAt.getTime(), Date.parse(today + "T00:00:00Z") + 86_400_000);
    const store = collectionStore(daily, budgets);
    await Promise.all(Array.from({ length: 100 }, () => store.increment("/", now, 1)));
    const row = await daily.findOne({ route: "/" });
    assert.equal(row.pageviews, 100);
    assert.deepEqual(Object.keys(row).sort(), ["_id", "day", "expiresAt", "pageviews", "route"]);
    assert.equal(await daily.countDocuments(), 2);
    const permits = await Promise.all(Array.from({ length: 50 }, () => store.takeBudget(now, 5)));
    assert.equal(permits.filter(Boolean).length, 5);
    const budget = await budgets.findOne({});
    assert.deepEqual(Object.keys(budget).sort(), ["_id", "count", "expiresAt"]);
    assert.equal(budget.expiresAt.getTime(), now.getTime() + 120_000);
    // Test instance runs TTL every second. No HTTP traffic triggers this cleanup.
    await daily.updateMany({}, { $set: { expiresAt: new Date(0) } });
    await budgets.updateMany({}, { $set: { expiresAt: new Date(0) } });
    const deadline = Date.now() + 8000;
    while ((await daily.countDocuments() || await budgets.countDocuments()) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.equal(await daily.countDocuments(), 0);
    assert.equal(await budgets.countDocuments(), 0);
    assert.equal((await daily.indexes()).find(i => i.name === "visitor_retention").expireAfterSeconds, 0);
  } finally { await db.dropDatabase(); await client.close(); }
});
