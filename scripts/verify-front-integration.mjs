import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "../lumix-front/package.json"));
const { chromium } = require("playwright");
const credentials = JSON.parse(readFileSync(resolve(root, ".local/visitors-test/admin-login.json"), "utf8"));
const headers = { Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}` };
const analytics = "http://localhost:3000", front = "http://localhost:3001";
const report = async site => { const r = await fetch(`${analytics}/admin/visitors/report?site=${site}`, { headers }); assert.equal(r.status, 200); return r.json(); };
const post = (site, route, origin) => fetch(`${analytics}/api/visitors`, { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ v: 1, type: "pageview", site, route }) });
// Warm compilation with an invalid body; no count or reset.
assert.equal((await post("unknown", "/spot", front)).status, 400);
const beforeFront = await report("lumix-front"), beforeAnalytics = await report("lumix-analytics");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined), headless: true });
try {
  const context = await browser.newContext(); const page = await context.newPage();
  let events = 0; page.on("request", request => { if (request.url() === `${analytics}/api/visitors` && request.method() === "POST") events++; });
  const received = page.waitForResponse(r => r.url() === `${analytics}/api/visitors` && r.request().method() === "POST");
  await page.goto(`${front}/spot?wallet=synthetic#private`); const event = await received;
  assert.equal(event.status(), 204); assert.deepEqual(event.request().postDataJSON(), { v: 1, type: "pageview", site: "lumix-front", route: "/spot" });
  await page.evaluate(() => { window.dispatchEvent(new Event("lumix:route")); history.pushState(null, "", "/spot?page=2#other"); });
  await page.waitForTimeout(300); assert.equal(events, 1);
  await page.evaluate(() => history.pushState(null, "", "/privacy")); await page.waitForTimeout(100);
  const navigation = page.waitForResponse(r => r.url() === `${analytics}/api/visitors` && r.request().method() === "POST");
  await page.evaluate(() => history.pushState(null, "", "/spot")); assert.equal((await navigation).status(), 204); assert.equal(events, 2);
  assert.equal((await report("lumix-front")).pageviews.today, beforeFront.pageviews.today + 2);
  assert.equal((await report("lumix-analytics")).pageviews.today, beforeAnalytics.pageviews.today);
  await page.goto(`${front}/privacy`); await page.getByRole("button", { name: "Object to visitor measurement", exact: true }).click();
  await page.getByRole("status").getByText("Objection saved for this origin.", { exact: true }).waitFor();
  await page.goto(`${front}/spot`); await page.waitForTimeout(350); assert.equal(events, 2);
  const adminContext = await browser.newContext({ httpCredentials: credentials }); const admin = await adminContext.newPage();
  await admin.goto(`${analytics}/admin/visitors`); await admin.getByLabel("Site", { exact: true }).selectOption("lumix-front");
  await admin.getByTestId("today-pageviews").getByText(String(beforeFront.pageviews.today + 2), { exact: true }).waitFor();
  assert.ok((await report("lumix-front")).uniques.today >= 1);
  const capture = resolve(root, ".impeccable/review/frontend"); mkdirSync(capture, { recursive: true });
  await admin.screenshot({ path: resolve(capture, "dashboard.png"), fullPage: true });
  const ownEvent = admin.waitForResponse(r => r.url() === `${analytics}/api/visitors` && r.request().method() === "POST");
  await admin.goto(`${analytics}/`); assert.equal((await ownEvent).status(), 204);
  assert.equal((await report("lumix-analytics")).pageviews.today, beforeAnalytics.pageviews.today + 1);
  assert.equal((await report("lumix-front")).pageviews.today, beforeFront.pageviews.today + 2);
  assert.equal((await post("lumix-front", "/transactions", front)).status, 400);
  assert.equal((await post("lumix-front", "/spot", "https://evil.test")).status, 403);
  assert.equal((await post("lumix-analytics", "/", front)).status, 403);
  assert.equal((await fetch(`${analytics}/admin/visitors/report?site=lumix-front`)).status, 401);
  const { MongoClient } = createRequire(resolve(root, "package.json"))("mongodb");
  const db = new MongoClient(readFileSync(resolve(root, ".local/visitors-test/visitor-mongo-uri-dev"), "utf8"));
  try {
    await db.connect(); const database = db.db("lumix_visitors_test"), day = new Date().toISOString().slice(0, 10);
    const [a, b] = await Promise.all([database.collection("daily_visitor_secrets").findOne({ _id: day }), database.collection("front_daily_visitor_secrets").findOne({ _id: day })]);
    assert.ok(a && b); assert.notEqual(a.secret, b.secret);
    const row = await database.collection("front_daily_pageviews").findOne({ day, route: "/spot" }); assert.ok(row.pageviews >= 2);
  } finally { await db.close(); }
  console.log("PASS: frontend initial + navigation = 2 events, duplicate signals/query changes = 0, objection = 0, independent Analytics event = 1; authenticated selector/report and Mongo site separation verified; invalid site/route/origins rejected. No data reset.");
} finally { await browser.close(); }
