const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MongoClient } = require("mongodb");
const { initializeEstimatorCollections, estimationStore, collectionStore } = require("../lib/visitors/store.ts");

const uri = process.env.VISITOR_TEST_MONGODB_URI;
test("Mongo daily estimator: concurrency, site-wide dedup, rollover, expiry and no raw IP/history", { skip: !uri, timeout: 15_000 }, async () => {
  assert.equal(uri, "mongodb://127.0.0.1:27028/lumix_visitors");
  const client = new MongoClient(uri); await client.connect();
  const db = client.db("lumix_visitors_test");
  try {
    await db.dropDatabase();
    const keys = db.collection("daily_visitor_keys"), secrets = db.collection("daily_visitor_secrets"), health = db.collection("daily_estimation_health");
    await initializeEstimatorCollections(keys, secrets, health);
    const store = estimationStore(keys, secrets, health);
    const pageviews = collectionStore(db.collection("daily_pageviews"), db.collection("collector_budgets"));
    // Use future UTC dates so Mongo's real clock cannot expire rollover fixtures.
    const now = new Date("2099-06-01T23:59:59.999Z"), next = new Date("2099-06-02T00:00:00Z");
    await Promise.all(Array.from({ length: 50 }, async (_, i) => {
      await pageviews.increment(i % 2 ? "/" : "/transactions", now, 30);
      await store.estimate("192.0.2.5", now, "https://a.test");
    }));
    assert.deepEqual(await store.readEstimate(now), { count: 1, unestimated: 0, missingNetwork: 0, storageErrors: 0 });
    assert.equal((await db.collection("daily_pageviews").find().toArray()).reduce((n, row) => n + row.pageviews, 0), 50);
    await store.estimate("192.0.2.200", now, "https://a.test");
    assert.equal((await store.readEstimate(now)).count, 1);
    await store.estimate("198.51.100.1", now, "https://a.test");
    assert.equal((await store.readEstimate(now)).count, 2);
    await Promise.all(Array.from({ length: 20 }, () => store.estimate(null, now, "https://a.test")));
    assert.equal((await store.readEstimate(now)).unestimated, 20);
    assert.equal((await store.readEstimate(now)).missingNetwork, 20);
    assert.equal((await store.readEstimate(next)).count, 0);
    await store.estimate("192.0.2.5", next, "https://a.test");
    assert.equal((await store.readEstimate(next)).count, 1);
    assert.equal(await secrets.countDocuments(), 2);
    const rows = await keys.find().toArray();
    for (const row of rows) {
      assert.deepEqual(Object.keys(row).sort(), ["_id", "day", "expiresAt"]);
      assert.equal(row.expiresAt.toISOString(), row.day === "2099-06-01" ? next.toISOString() : "2099-06-03T00:00:00.000Z");
      assert.equal(JSON.stringify(row).includes("192.0.2"), false);
      assert.equal(Object.hasOwn(row, "route"), false);
    }
    assert.notEqual(rows.find(r => r.day === "2099-06-01")._id.split(":")[1], rows.find(r => r.day === "2099-06-02")._id.split(":")[1]);
    await keys.updateMany({}, { $set: { expiresAt: new Date(0) } });
    await secrets.updateMany({}, { $set: { expiresAt: new Date(0) } });
    await health.updateMany({}, { $set: { expiresAt: new Date(0) } });
    assert.equal((await store.readEstimate(now)).count, 0); // Expired values excluded before TTL catches up.
    const deadline = Date.now() + 8000;
    while ((await keys.countDocuments() || await secrets.countDocuments() || await health.countDocuments()) && Date.now() < deadline) await new Promise(r => setTimeout(r, 250));
    assert.equal(await keys.countDocuments(), 0); assert.equal(await secrets.countDocuments(), 0); assert.equal(await health.countDocuments(), 0);
  } finally { await db.dropDatabase(); await client.close(); }
});
