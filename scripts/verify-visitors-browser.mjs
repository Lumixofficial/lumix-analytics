// Run after visitors:setup/up. Uses isolated browser contexts, not your profile.
// npm exec --package=playwright -c "node scripts/verify-visitors-browser.mjs --reset-test-data"
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, delimiter, join } from "node:path";
import { execFileSync } from "node:child_process";

if (!process.argv.includes("--reset-test-data")) throw new Error("Pass --reset-test-data to allow clearing only the isolated TEST database.");
const root = resolve(import.meta.dirname, ".."), local = resolve(root, ".local/visitors-test");
const require = createRequire(import.meta.url);
let chromium;
for (const location of [process.env.PLAYWRIGHT_MODULE_PATH, "playwright", ...(process.env.PATH ?? "").split(delimiter).map(dir => join(dir, "..", "playwright"))].filter(Boolean)) {
  try { ({ chromium } = require(location)); break; } catch { /* Try npm exec's package path. */ }
}
if (!chromium) throw new Error("Run with npm exec --package=playwright, or set PLAYWRIGHT_MODULE_PATH to its installed module path.");
const credentials = JSON.parse(readFileSync(resolve(local, "admin-login.json"), "utf8"));
const authorization = "Basic " + Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");
const docker = process.platform === "win32" ? "docker.exe" : "docker";
const composeArgs = ["compose", "-f", "compose.visitors-test.yml"];
const dockerRun = args => execFileSync(docker, args, { cwd: root, windowsHide: true, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const reset = () => dockerRun([...composeArgs, "exec", "-T", "mongo", "mongosh", "--quiet", "--file", "/run/lumix/reset-test.cjs"]);
const shell = script => dockerRun([...composeArgs, "exec", "-T", "mongo", "mongosh", "--quiet", "--eval", script]).trim();
const capture = resolve(root, ".impeccable/review/visitors-admin");mkdirSync(capture, { recursive: true });
const base = "http://localhost:3404", sentinel = "SYNTHETIC_PRIVATE_MARKER";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function report() {
  const response = await fetch(base + "/admin/visitors/report", { headers: { Authorization: authorization } });
  assert.equal(response.status, 200, "Authenticated report must succeed");
  assert.match(response.headers.get("cache-control"), /no-store/);
  return response.json();
}
async function expected(views, uniques) {
  for (let i = 0; i < 20; i++) { const data = await report(); if (data.pageviews.today === views && data.uniques.today === uniques) return data; await delay(100); }
  const data = await report();assert.equal(data.pageviews.today, views);assert.equal(data.uniques.today, uniques);return data;
}
async function navigate(page, name) {
  await page.getByRole("navigation", { name: "Analytics navigation" }).getByRole("link", { name, exact: true }).click();
  await page.waitForURL(url => url.pathname === (name === "Overview" ? "/" : "/transactions"));await delay(300);
}
async function noOverflow(page) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); }
function override(values) {
  const filename = resolve(local, "runtime-override.yml");
  writeFileSync(filename, "services:\n  analytics:\n    environment:\n" + Object.entries(values).map(([key,value])=>`      ${key}: \"${value}\"\n`).join(""));
  dockerRun([...composeArgs, "-f", filename, "up", "-d", "--no-deps", "analytics"]);
}
function restore() { dockerRun([...composeArgs, "up", "-d", "--no-deps", "analytics"]); }
async function ready() {
  for (let i=0;i<80;i++) { try { const r=await fetch(base+"/privacy");if(r.ok)return; } catch {} await delay(250); }
  throw new Error("Local test app did not become ready");
}

let browser;
try {
  await ready();reset();
  for (const path of ["/admin/visitors", "/admin/visitors/report"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 401);assert.match(response.headers.get("www-authenticate"), /^Basic /);assert.match(response.headers.get("cache-control"), /no-store/);
  }
  const wrong = await fetch(base+"/admin/visitors/report", {headers:{Authorization:"Basic "+Buffer.from("admin:wrong").toString("base64")}});assert.equal(wrong.status,401);
  assert.equal(shell("try { db.getSiblingDB('lumix_visitors_test').daily_pageviews.countDocuments({}); quit(2); } catch(e) { if(e.code!==13) throw e; print('AUTH_REQUIRED'); }"), "AUTH_REQUIRED");
  const roleCheck = "const f=require('fs');const t=db.getSiblingDB('lumix_visitors_test');t.auth('lumix_visitors_test',f.readFileSync('/run/secrets/mongo_app_password','utf8').trim());for(const name of ['lumix','lumix_visitors']){try{db.getSiblingDB(name).getCollection('forbidden').findOne();quit(2);}catch(e){if(e.code!==13)throw e;}}print('ROLE_RESTRICTED');";
  assert.equal(shell(roleCheck), "ROLE_RESTRICTED");
  const mongo = JSON.parse(dockerRun(["inspect", "lumix-visitors-test-mongo-1", "--format", "{{json .NetworkSettings.Ports}}"]));
  assert.equal(mongo["27017/tcp"], null);
  console.log("PASS admin/page/report authentication, no-store reporting, Mongo auth and database role isolation, no Mongo host port");

  const executablePath = process.env.CHROME_PATH || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? {executablePath} : {}) });
  const context = await browser.newContext({ httpCredentials: credentials, viewport: {width:1440,height:1000} });
  const page = await context.newPage(), errors=[], events=[];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if(new URL(request.url()).pathname === "/api/visitors") events.push(request); });
  await page.goto(base + "/?wallet=" + sentinel + "#email=" + sentinel);await expected(1,1);
  await navigate(page,"Transactions");await expected(2,1);
  await page.evaluate(() => history.pushState(null,"","/transactions?page=2#private"));await delay(300);await expected(2,1);
  await page.reload();await expected(3,1);
  for(const request of events) {
    assert.deepEqual(Object.keys(request.postDataJSON()),["v","type","site","route"]);
    const headers=await request.allHeaders();assert.equal(headers.cookie,undefined);assert.equal(headers.referer,undefined);assert.equal(headers.authorization,undefined);
    assert.equal(request.postData().includes(sentinel),false);
  }
  assert.deepEqual(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})),{local:[],session:[]});
  assert.deepEqual(await context.cookies(),[]);
  const forged=await fetch(base+"/api/visitors",{method:"POST",headers:{Origin:base,"content-type":"application/json","x-lumix-client-ip":"198.51.100.12"},body:JSON.stringify({v:1,type:"pageview",site:"lumix-analytics",route:"/"})});
  assert.equal(forged.status,204);await expected(4,1);
  await page.goto(base+"/privacy");await page.getByText("These values are pseudonymous, not anonymous.",{exact:false}).waitFor();await expected(4,1);
  await page.getByRole("button",{name:"Object to visitor measurement",exact:true}).click();
  const second=await context.newPage();await second.goto(base+"/");await delay(500);await expected(4,1);
  reset();await expected(0,0);assert.equal(await page.evaluate(()=>localStorage.getItem("lumix:visitor-opt-out")),"1");
  await navigate(second,"Transactions");await expected(0,0);
  await page.getByRole("button",{name:"Remove my saved objection"}).click();await navigate(page,"Overview");await expected(1,1);
  console.log("PASS initial/navigation/reload, query exclusion, site-wide dedup, no browser IDs/cookies, no referrer/auth on events, forged IP overwritten, preserved objection after test-only reset");

  for(const [kind,text] of [["gpc","Global Privacy Control is enabled"],["dnt","Do Not Track is enabled"],["storage","cannot read privacy preference storage"]]) {
    const blocked=await browser.newContext();await blocked.addInitScript(type=>{
      if(type==="gpc")Object.defineProperty(navigator,"globalPrivacyControl",{value:true});
      if(type==="dnt")Object.defineProperty(navigator,"doNotTrack",{value:"1"});
      if(type==="storage")Object.defineProperty(window,"localStorage",{get(){throw new Error("unavailable");}});
    },kind);
    const p=await blocked.newPage();await p.goto(base+"/");await delay(400);await expected(1,1);
    await p.goto(base+"/privacy");await p.getByText(text,{exact:false}).waitFor();await blocked.close();
  }
  console.log("PASS specific GPC, DNT and storage-block reasons with zero events");

  override({VISITOR_ANALYTICS_UNIQUES_ENABLED:"false"});await ready();
  await page.goto(base+"/");await expected(2,null);
  await page.goto(base+"/privacy");await page.getByText("Daily estimation is off, so visitor measurement creates no visitor identifier.",{exact:false}).waitFor();
  override({VISITOR_ANALYTICS_ENABLED:"false"});await ready();await page.goto(base+"/");await delay(400);await expected(2,null);
  await page.goto(base+"/privacy");await page.getByText("Collection is off on this deployment.",{exact:false}).waitFor();
  restore();await ready();await page.goto(base+"/");await expected(3,1);
  await navigate(page,"Transactions");const final=await expected(4,1);
  assert.equal(final.dataset,"test");assert.equal(final.collection.enabled,true);assert.equal(final.daily.length,30);
  assert.equal(final.routes.reduce((count,row)=>count+row.today,0),4);
  console.log("PASS independent pageviews-only and fully disabled modes, then restored enabled local testing");

  const admin=await context.newPage();await admin.goto(base+"/admin/visitors");await admin.getByRole("heading",{name:"Visitor statistics",exact:true}).waitFor();
  await admin.getByRole("button",{name:"Refresh counts"}).click();await admin.getByTestId("today-pageviews").getByText("4",{exact:true}).waitFor();
  assert.equal(await admin.getByTestId("today-uniques").textContent(),"1");await noOverflow(admin);
  await admin.screenshot({path:resolve(capture,"admin-desktop.png"),fullPage:true});
  await admin.getByRole("button",{name:"30 days",exact:true}).click();assert.equal(await admin.getByRole("button",{name:"30 days",exact:true}).getAttribute("aria-pressed"),"true");
  await admin.setViewportSize({width:390,height:844});await delay(300);await noOverflow(admin);await admin.screenshot({path:resolve(capture,"admin-mobile.png"),fullPage:true});
  await page.goto(base+"/privacy");await noOverflow(page);await page.screenshot({path:resolve(capture,"privacy-desktop.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});await noOverflow(page);await page.screenshot({path:resolve(capture,"privacy-mobile.png"),fullPage:true});
  assert.deepEqual(errors,[]);
  const invalid=await fetch(base+"/api/visitors",{method:"POST",headers:{Origin:base,"content-type":"application/json"},body:JSON.stringify({v:1,type:"pageview",site:"lumix-analytics",route:"/",email:sentinel})});assert.equal(invalid.status,400);
  const logs=dockerRun([...composeArgs,"logs","--no-color","analytics"]);assert.equal(logs.includes(sentinel),false);assert.equal(logs.includes(credentials.password),false);
  const databaseCheck="const a=db.getSiblingDB('admin');a.auth('lumix_root',require('fs').readFileSync('/run/secrets/mongo_root_password','utf8').trim());const t=db.getSiblingDB('lumix_visitors_test');const rows=t.daily_visitor_keys.find().toArray();if(!rows.every(r=>Object.keys(r).sort().join(',')==='_id,day,expiresAt'))quit(2);print('AGGREGATES_AND_TEMP_KEYS_ONLY');";
  assert.equal(shell(databaseCheck),"AGGREGATES_AND_TEMP_KEYS_ONLY");
  writeFileSync(resolve(capture,"verification.txt"),"Production Docker/Chromium checks passed: private auth/reporting, real counts, estimator independence, specific privacy reasons, no browser IDs, test reset, ingress sanitization, Mongo auth/role/network isolation, desktop/mobile layouts. Final test counts: 4 pageviews, 1 daily network estimate.\n");
  console.log("PASS live dashboard 7/30-day controls and refresh, desktop/mobile overflow, private logs and storage field sets");
  console.log("Dashboard ready: http://localhost:3404/admin/visitors (admin; password in .local/visitors-test/admin-login.json)");
} finally {
  if(browser)await browser.close();
  restore();
}
