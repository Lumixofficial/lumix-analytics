# Visitor measurement: local testing and secure deployment

## Frontend integration and site separation

Verified locally: frontend initial and client-navigation pageviews persisted in
Mongo and appeared in the protected site selector; duplicate/query events were
suppressed, objections stopped collection, Analytics counts remained separate,
daily secrets were distinct, and invalid site/route/origin requests were rejected.
The check did not reset data. Both repositories passed type checks and production
builds; frontend lint retains its pre-existing warnings.

The existing collector now accepts `lumix-analytics` only with `/` or
`/transactions` from its configured origin, and `lumix-front` only with `/spot`
from the separately configured frontend origin. Direct browser CORS is used:
exact origin, POST, JSON/content-type only, no credential grants. No frontend
server proxies visitors; production ingress on Analytics must overwrite the
client-IP header with validated real-client metadata. Native dev uses a deliberately
fixed loopback estimate, separately keyed for each site.

`visitors:setup` configures local `VISITOR_FRONT_ENABLED=true`,
`VISITOR_FRONT_ORIGIN=http://localhost:3001`, and
`VISITOR_FRONT_UNIQUES_ENABLED=true` in the ignored managed development block.
Production defaults off; enabling requires a real HTTPS frontend origin and
`VISITOR_FRONT_REVIEW_ID`. Daily estimation additionally requires explicit
`VISITOR_FRONT_UNIQUES_ENABLED=true` and `VISITOR_FRONT_UNIQUES_REVIEW_ID`.
These reviews are separate from Analytics-site approval. The existing master
Analytics collection/storage/privacy gate still applies. Restart dev for env changes.

Legacy compatibility is explicit: all original collections and IDs continue to
belong exclusively to `lumix-analytics`, with no destructive migration. Frontend
data uses the same authenticated dataset database but the five collections
`front_daily_pageviews`, `front_collector_budgets`, `front_daily_visitor_keys`,
`front_daily_visitor_secrets`, and `front_daily_estimation_health`. These have the
same TTL policies as their originals. Random daily secrets are independent, so
daily pseudonyms are not linkable across the websites. Counts and reports never
combine sites. Existing Analytics records and credentials are preserved.
Apply the existing temporary-data backup, logging and export exclusions to the
`front_*` collections as well as the original collections.

The protected dashboard has a Site selector. The protected endpoint accepts only
`?site=lumix-front` or `?site=lumix-analytics` (default), rejecting other query keys
and duplicate site parameters. Authentication still runs before selection/DB access.

Start Analytics with `npm run visitors:setup`, `npm run visitors:db`, `npm run dev`.
Start frontend per `../lumix-front/docs/visitor-tracker.md`. Dashboard:
http://localhost:3000/admin/visitors; frontend test URL:
http://localhost:3001/spot. Read the existing local login privately with
`Get-Content .local/visitors-test/admin-login.json`.
Visit Spot, choose Lumix Front in the admin selector, and refresh. Change to Lumix
Analytics to inspect its separate counts. Frontend privacy choices are managed on
the frontend's own `/privacy` origin. The focused no-reset integration command is
`node scripts/verify-front-integration.mjs`; it exercises both servers using the
frontend's existing Playwright dependency and installed Chrome on Windows.

This extends the existing first-party pageview collector in `lumix-analytics`.
The external script, exact four-field event schema, route allowlist, preferences,
daily Mongo counters and original tests remain. Visitor metrics are separate from
the public Mainnet swap analytics. No other Lumix app has been instrumented.

## Normal development on localhost:3000

Run from this repository:

```powershell
npm run visitors:setup
npm run visitors:db
npm run dev
```

Open **http://localhost:3000/admin/visitors**. Sign in as `admin` using the existing
password retrieved privately with `Get-Content .local/visitors-test/admin-login.json`.
Open **http://localhost:3000/** and visit Transactions; refresh the dashboard or wait
ten seconds. Both the collector and report use the same authenticated
`lumix_visitors_test` database as the optional Docker stack. No reset is performed.

Setup preserves credentials and unrelated `.env.local` settings (including the
swap API URL), and maintains a clearly marked visitor-only block. Conflicting
visitor settings outside that block require manual reconciliation rather than
being overwritten. Native secret-file paths are absolute host paths, not Docker's
`/run/secrets` paths. The host Mongo URI is stored separately as
`.local/visitors-test/visitor-mongo-uri-dev`; the existing container URI is preserved.
All local settings/secrets remain ignored by Git and excluded from Docker builds.

`visitors:db` reuses the existing Mongo service, credentials and named test volume,
publishing only **127.0.0.1:27029** for native Next. It does not start a second Mongo
or require the port-3404 app. Mongo still requires authentication. The dev server
binds to 127.0.0.1:3000. Native loopback development deliberately uses one fixed
local network estimate, ignoring caller IP headers; real IP estimation still
requires trusted ingress outside native development. This is not a production mode.

The script URL and event endpoint remain relative to the current origin. The
managed allowed origin is `http://localhost:3000`. Privacy preferences are preserved;
GPC, DNT and objections still block events. If port 3404 is also running, it retains
its own origin configuration and shares test counts; use one app when comparing
isolated test results. Stop the optional 3404 app without deleting data via
`docker compose -f compose.visitors-test.yml stop web analytics`.

Restart `npm run dev` after setup or changes to origin, dataset, feature flags,
credential-file paths or credential contents. Start Mongo with `visitors:db` after
Docker restarts. On later runs with unchanged configuration, only `visitors:db`
and `npm run dev` are needed. Never copy this local-test block into production.
If you subsequently run the isolated `visitors:up` deployment, run `visitors:db`
again before native development to restore its loopback Mongo port mapping.

Native development verification passed on port 3000 before and after restarting
`npm run dev`: configured login, unauthenticated page/report rejection, successful
same-origin pageviews for both public routes, and corresponding dashboard refresh.
All 23 tests (including real-Mongo tests), lint, type checks and production build
passed. Existing secrets, browser preferences and test/production records were not
reset by setup or this verification.

## Optional isolated Docker dashboard on port 3404

From this repository, with Docker Desktop/Linux containers and Node 22 available:

```powershell
npm run visitors:setup
npm run visitors:up
Get-Content .local/visitors-test/admin-login.json
```

Open **http://localhost:3404/admin/visitors** in a private browser window. The
browser's sign-in prompt uses username **admin** and the generated password in
that private JSON file. No password is committed, printed by setup, embedded in
the image or placed in a `NEXT_PUBLIC_*` variable. Re-running setup preserves
existing credentials. Close the private window to clear cached HTTP credentials.

Open **http://localhost:3404/** in another tab. Visit Transactions, return to
Overview, or reload. In the admin tab click **Refresh counts**, or wait up to ten
seconds while the tab is visible. Today’s pageviews increase; repeat requests from
the same coarse network still contribute one daily network estimate. Select
**7 days** or **30 days** for trends and route totals. New installations have no
historical pageviews; zeroes mean no retained events, not invented history.

Query/hash changes do not count extra views. Privacy and admin pages never count.
An objection, GPC, DNT or unreadable preference storage suppresses events; `/privacy`
shows the specific reason. Do not clear a visitor's preferences to make a test pass.
You may explicitly remove your own saved objection on that page when desired.

The local stack uses the existing API through `http://host.docker.internal:8080`.
To use a different existing API, set `VISITOR_TEST_API_URL` before `visitors:up`;
this public API URL is a Docker build argument. If the swap API is unavailable,
its existing error UI remains; visitor measurement and the admin page still work.
The visitor numbers always come from this stack's Mongo data, not API fixtures.

Safe reset and stop:

```powershell
npm run visitors:reset
npm run visitors:down
```

Reset authenticates to the test Mongo container and deletes only the five named
collections in **lumix_visitors_test**. It cannot take a database argument, drop
users, delete volumes, or clear production. It does not touch browser preferences.
Down stops this Compose project and preserves its test volume and credentials.
Keep `.local/` private; it is excluded from Git and Docker build context. On Unix,
its secret directories are owner-only; mounted service files are readable by the
non-root container user. On Windows setup restricts the directory ACL to the
current account and SYSTEM. `admin-login.json` stays a private host-side file.

`compose.visitors-test.yml` binds only its ingress to **127.0.0.1:3404**. Neither
Next nor Mongo publishes a host port. Mongo runs with `--auth`, separate root and
test-app credentials, and an internal database network. The app account has only
`readWrite` on `lumix_visitors_test`. Root credentials never reach Next. The local
ingress overwrites `X-Lumix-Client-IP` using its socket peer and discards forwarded
IP headers. Docker NAT/shared networks can collapse all local visits to one estimate.

The `local-test` mode is accepted only for the test dataset and an exact loopback
origin. HTTP is allowed only for that controlled local case. It is **not** a public
staging exemption or a consent determination. Do not expose this stack through a
public tunnel. A public/access-controlled staging host must use HTTPS, the reviewed
mode, appropriate privacy review and test database credentials.

## Protected dashboard and reporting

- Page: `/admin/visitors`.
- Reporting endpoint: `GET /admin/visitors/report`, no query parameters.
- Both require server-side HTTP Basic authentication. Passwords are verified with
  salted scrypt and constant-time comparisons; verification work and attempts are
  bounded. Use HTTPS for public deployments. A fresh private browser window is the
  simplest login/logout workflow; no admin tracking cookie or session framework.
- Next's `proxy.ts` supplies the browser challenge. The server page and report
  handler independently authorize **before** any data access or serialization.
  Proxy alone is not an authorization boundary.
- Unauthorized requests receive 401; missing login setup receives 503; excessive
  login attempts receive 429. Reports are `private, no-store`, vary on Authorization,
  grant no CORS access and expose no credentials, IPs, pseudonyms or daily secrets.
- The dashboard shows actual stored pageviews today, 7/30-day daily trends, route
  totals, today's optional network estimate, collection/estimation status, dataset,
  UTC dates and last-read time. It refreshes every ten seconds while visible.
  Storage errors show unavailable/stale state instead of fabricated zeroes.
- Expired records are excluded even before Mongo's TTL monitor deletes them. Days
  outside configured retention are unavailable; period pageview totals cover only
  retained data. Daily visitor estimates are never summed into weekly/monthly people.

## Secure the existing shared Mongo deployment

The inspected `../api/docker-compose.yml` service runs without authentication.
This repository now supplies **deploy/mongo-secure.compose.yml**, which enables
`--auth`, removes its host port, places Mongo only on the internal `lumix-database`
network, and gives the existing API a distinct authenticated `lumix` connection.
The analytics production Compose now requires that private network and read-only
secret mounts, without falling back to an unprotected database. Existing Mongo
data stays in the existing volume. No sibling repository source is changed.

**This is an operator-run shared-service migration, not an automatic production
rollout.** Take and verify a backup under the existing database runbook and plan a
maintenance window before applying it. Preserve the original Compose project name
and volume. The commands below use the locally observed project name `api`; use
the actual existing name if different. Do not run `down -v`, delete volumes or
initialize a replacement database to make authentication work.

Generate private production secrets, then validate the merged configuration:

```powershell
npm run visitors:secrets:production
$secureArgs = @('compose', '-p', 'api', '--env-file', '.local/visitors-production/compose.env', '-f', '../api/docker-compose.yml', '-f', 'deploy/mongo-secure.compose.yml')
docker @secureArgs config --quiet
```

The generated private `compose.env` contains the absolute analytics directory and
the API's authenticated URI; it contains no public activation or legal approval.
Do not use `docker compose config` without `--quiet` in shared logs, since rendered
API environment values include credentials. `readWrite` application roles remain
separate: `lumix_api` can access `lumix`; `lumix_visitors` can access only
`lumix_visitors`. Root can administer Mongo and is mounted only into that service.

For the previously unauthenticated service with no existing users, after backup:

```powershell
docker @secureArgs stop api
docker @secureArgs up -d --no-deps mongo-lumix
docker @secureArgs exec -T mongo-lumix mongosh --quiet --file /run/lumix/mongo-bootstrap.cjs
docker @secureArgs up -d api
```

The script uses Mongo's localhost exception only to create the **first**
administrator, then authenticates and provisions restricted application users.
It never erases collections or resets existing user passwords. If users already
exist, supply the actual administrator credentials and perform provisioning with
that administrator; do not bypass authentication or assume a generated password
will match an existing account. Verify API health and restricted database roles
before proceeding. These commands affect service authentication, not swap schemas
or HTTP response contracts. Keep the override in subsequent API deployments;
running the sibling's original Compose alone would remove the hardening.

Copy `.env.example` to the analytics deployment's `.env` if needed; preserve
existing values. Set its real HTTPS origin and other settings described below,
then use the normal secured analytics deployment:

```powershell
docker compose config --quiet
docker compose up -d --build analytics
```

The normal app still binds to **127.0.0.1:3004**. Put it behind the actual HTTPS
ingress; `deploy/nginx-visitors.conf.example` shows header overwrite and global
collector limits. Restrict direct access to Next so a caller cannot supply its own
trusted header. If a CDN is in front, configure real-client-IP handling only for
explicitly trusted CDN addresses; do not accept arbitrary X-Forwarded-For chains.
Without that assurance, leave daily estimation off. Use Mongo TLS outside a trusted
same-host container network. Server credentials belong in the secret mounts or a
deployment secret manager; never in browser code or build arguments.

## Configuration names

All settings are server-only. Defaults leave public collection and daily estimation
off. The admin can still report retained data while collection is off, provided
storage, origin and admin authentication are configured.

| Setting | Meaning |
| --- | --- |
| `VISITOR_ANALYTICS_ENABLED` | Exactly `true` enables eligible pageview collection |
| `VISITOR_ANALYTICS_MODE` | `reviewed-exemption` for reviewed deployments; `local-test` only for loopback/test |
| `VISITOR_ANALYTICS_DATASET` | `production` (default) requires `/lumix_visitors`; `test` requires `/lumix_visitors_test` |
| `VISITOR_ANALYTICS_ORIGIN` | Exact HTTPS origin, no path/trailing slash/wildcards; local test uses `http://localhost:3404` |
| `VISITOR_ANALYTICS_MONGODB_URI_FILE` | Preferred secret file, takes precedence over `VISITOR_ANALYTICS_MONGODB_URI` |
| `VISITOR_ANALYTICS_MONGODB_URI` | Alternative authenticated server-only Mongo URI; database must match dataset |
| `VISITOR_ANALYTICS_RETENTION_DAYS` | Integer 1–90, default 30, daily pageview totals |
| `VISITOR_ANALYTICS_MAX_PER_MINUTE` | Integer 1–10000, default 300, shared valid-event budget |
| `VISITOR_ANALYTICS_REVIEW_ID` | Restricted record of completed pageview legal/consent assessment |
| `VISITOR_ANALYTICS_LOG_REVIEWED` | Exactly `true` only after auditing real infrastructure/backup handling |
| `VISITOR_ANALYTICS_UNIQUES_ENABLED` | Independent estimator request, default false; pageviews work without it |
| `VISITOR_ANALYTICS_UNIQUES_REVIEW_ID` | **Separate** assessment of temporary network pseudonyms; pageview review is insufficient |
| `VISITOR_ANALYTICS_TRUST_PROXY` | Exactly `true` after verifying isolated ingress overwrites `X-Lumix-Client-IP` |
| `VISITOR_ADMIN_USERNAME` | Admin login name, generated setup uses `admin` |
| `VISITOR_ADMIN_PASSWORD_HASH_FILE` | Secret file containing `scrypt:<16-byte hex salt>:<32-byte hex digest>`; fixed N=16384, r=8, p=1 |
| `VISITOR_ADMIN_PASSWORD_HASH` | Alternative server-only hash; FILE takes precedence |
| `VISITOR_ANALYTICS_CONTROLLER` | Real public legal identity and postal address |
| `VISITOR_ANALYTICS_CONTACT_EMAIL` | Real monitored public privacy contact |
| `VISITOR_ANALYTICS_EXEMPTION` | Operator's stated jurisdiction-specific consent basis and explanation |
| `VISITOR_ANALYTICS_HOSTING` | Actual provider, location and operational-log/backup retention |
| `VISITOR_ANALYTICS_PROCESSORS` | Actual processors/subprocessors and purposes |
| `VISITOR_ANALYTICS_TRANSFERS` | Actual transfer destinations and safeguards, or assessed absence |

Restart after runtime configuration changes. A configuration flag records an
operator's assertion, not a compliance finding. Missing estimator review or trusted
ingress disables **estimation**, while otherwise eligible pageviews keep working.
The admin explains the specific deployment block; `/privacy` explains browser
blocks individually (objection, GPC, DNT, unreadable storage, or wrong site origin).
Unpublished operator details are not invented. Technical setup remains in this
private deployment document, not the public privacy flow.

## Collector and data flow

The existing `next/script` integration loads `/visitor-analytics.js` externally
with `strategy="afterInteractive"`, `async`, fixed `data-site="lumix-analytics"`,
the configured `data-origin`, and `referrerPolicy="no-referrer"`. `usePathname()`
signals navigation without sending a URL. Script-load and navigation signals are
deduplicated in document memory. Only `/` and `/transactions` are allowed, with
trailing slashes normalized; queries, fragments and dynamic/unknown paths are never
sent. Hidden/prerendered documents wait for visibility. No persistent event queue.

`POST /api/visitors`, JSON only, at most 256 bytes, one-second streaming read limit:

```json
{"v":1,"type":"pageview","site":"lumix-analytics","route":"/transactions"}
```

The schema still permits **exactly four fields**, rejecting unexpected fields,
wrong types and unknown values. No timestamp or browser ID is added. The server
assigns the UTC day and immediately increments the existing pageview bucket.
Cookies, Authorization and referrer are omitted from browser event requests.
Exact Origin and same-origin fetch metadata checks remain; no CORS grants. Bodies
with Content-Encoding or collector query strings are rejected. Per-process attempt
and concurrency caps and shared Mongo budgets remain IP-independent.

Disabled/preference-blocked events return 204 without storage; accepted events
return 204; invalid schema 400, origin 403, slow body 408, size 413, media 415,
budget 429 and storage failures 503. Responses are empty/no-store. The script aborts
after two seconds and never retries or blocks rendering/navigation on failure.

With daily estimation enabled, only the trusted ingress header is considered.
IPv4 is reduced to /24 and IPv6 to /48 in request memory. There is no UA, device,
language, screen or other fingerprint input and no X-Forwarded-For fallback. A
cryptographically random 32-byte key is created atomically for each UTC day in the
same dataset. HMAC-SHA-256 combines that key, the exact site origin and the coarse
prefix. A unique Mongo primary key records membership once for that day. Concurrent
requests share the daily secret and unique key. No per-person route list or visit
counter is attached; today's estimate is the cardinality of that temporary set.

**These are pseudonymous network values, not anonymous visitor identifiers.** A
coarse network is not a person: shared addresses/prefixes, VPNs and NAT undercount;
changing networks/prefixes can overcount; bots and blocked browsers affect results.
This is intentionally less precise than browser fingerprinting. It cannot identify
unique people. Daily estimates are available only for today and are never summed
into a 7/30-day unique-person claim. Pageviews remain independently usable.
Access to both a daily secret and the temporary set permits testing candidate
network prefixes; the hash is not an anonymization guarantee. Restrict access and
exclude both collections from backups and command-payload logging.

Missing/invalid trusted headers skip only the estimate and increment a short-lived
global unestimated-pageview diagnostic. Estimation errors do not undo the already
accepted pageview; diagnostics show incomplete estimates where recorded. A complete
database failure can prevent that diagnostic too and returns an unavailable result.

## Mongo storage and expiry

Production uses **lumix_visitors**; isolated tests use **lumix_visitors_test**.
Authentication roles and URI validation enforce that separation.

| Collection | Stored fields and expiry |
| --- | --- |
| `daily_pageviews` | Existing `_id` (day/route), `day`, `route`, `pageviews`, `expiresAt`; default 30 days from UTC day start |
| `collector_budgets` | Global epoch-minute `_id`, `count`, `expiresAt`; two minutes after window's first request |
| `daily_visitor_keys` | Day/HMAC `_id`, `day`, `expiresAt`; **next UTC midnight**; no route, IP/prefix, UA or visitor event times |
| `daily_visitor_secrets` | UTC-day `_id`, random `secret`, `expiresAt`; **next UTC midnight**; separate independent keys each day |
| `daily_estimation_health` | UTC-day `_id`, global `unestimated`, `missingNetwork` and `storageErrors` counts, `expiresAt`; **next UTC midnight** |

All expiry uses Mongo TTL, normally checked every minute and possibly delayed under
load. Reads exclude expired values immediately, including at UTC rollover. Cleanup
continues while the app/collection is stopped, provided Mongo runs. App restart does
not change today's dedup key because it lives temporarily in Mongo. Daily keys are
not derived from a long-lived master secret. There is no visitor-level history.

The pageview retention policy is reapplied to existing pageview rows at the first
storage connection after restart, including admin reads while collection is off.
No retention update prolongs temporary estimation records beyond their UTC day.
If Mongo is stopped, physical deletion waits for restart. Reports use retained data
only and disclose shorter retention; they do not treat expired days as observed zeroes.

Exclude temporary key/secret/diagnostic collections from backups, snapshots, exports,
profiling and audit payload capture; preferably exclude the visitor database from
long-lived backups. Application TTL cannot erase snapshots or stopped disks. Reapply
retention **before** using any restored pageview data; do not restore expired daily
dedup keys. Document backup/access/restore handling before enabling public estimation.

## Privacy review and remaining public activation requirements

The sole purpose is improving this site's content/navigation. Proposed GDPR/UK GDPR
Article 6(1)(f) processing needs a documented purpose, necessity and balancing
assessment, including whether even a coarse daily IP-based estimator is necessary
in this financial-service context. Data-subject objection/rights handling, public
notices, security and retention must be assessed. Hashing does not remove GDPR.

The deployment owner must supply real controller/contact details, establishment and
served jurisdictions, hosting/processor/subprocessor identities and locations,
Article 28 terms, transfer destinations and safeguards, operational-log/backup
handling, and completed assessment records. No production controller or hosting
facts were supplied in this task. No French exemption is assumed elsewhere.

Daily deduplication changes the previous pageview-only design. Review whether
holding temporary pseudonymous network values until midnight fits **each** claimed
audience-measurement exemption and whether a less intrusive approach suffices.
Where no valid exemption applies, keep that feature off (or public collection off
entirely when required); there is no consent-based fallback in this implementation.
Existing pageview approval must not silently activate the estimator.

Official guidance checked 15 November 2026:

- [EDPB Article 5(3) scope, version 2](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf): cookie-free does not settle terminal access/consent rules.
- [EDPB legitimate-interest guidance v2, adopted 10 November 2026](https://www.edpb.europa.eu/system/files/2026-11/edpb_guidelines_202401_legitimateinterest_v2_en.pdf): purpose, necessity and balancing require assessment before processing; ePrivacy still applies separately.
- [CNIL audience-measurement guidance](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience) and [July 2025 self-assessment](https://www.cnil.fr/sites/default/files/2025-07/outil_d_auto-evaluation_mesure_d_audience.pdf): publisher-only restricted purposes, separation, minimization and applicable configuration conditions require analysis. Its tool does not certify overall compliance.
- [ICO statistical-purpose exception](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/): assess UK-specific aggregate-purpose, individual-data retention, disclosure and free objection conditions; do not substitute a French analysis.
- [Mongo authentication/localhost exception](https://www.mongodb.com/docs/manual/core/localhost-exception/), [TTL behavior](https://www.mongodb.com/docs/manual/core/index-ttl/), [Docker secret mounts](https://docs.docker.com/compose/how-tos/use-secrets/), and [Next server authorization](https://nextjs.org/docs/app/guides/authentication) inform deployment/security choices.

### Logging and unavoidable network processing

Raw IPs and UAs necessarily reach delivery infrastructure and Next. Only the
separately enabled estimator reads the trusted IP header, in memory, to reduce it
to a prefix and compute a pseudonym. No raw IP/prefix/UA enters analytics records.
No visitor bodies, headers, credentials, secrets or driver errors are logged by
the collector/reporting code. Production error responses are generic.

The local ingress has no access logger and Mongo command profiling is not enabled;
test security checks inspect captured app output with synthetic markers. This
does not validate a public proxy/CDN/WAF/host. Audit that complete chain, including
Next middleware, APM, Docker log drivers, Mongo profiling/slow-query/error logs,
support access, backups and exports. Disable collection of visitor URLs/query
strings, bodies, IPs/UAs, pseudonyms, daily keys, cookies and Authorization in logs.
Any unavoidable security logging needs a distinct purpose/basis, restricted access,
short justified retention and accurate public disclosure. `access_log off` alone
does not suppress Nginx error logs. Do not set the review flag without this work.

## Verification commands

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

The original tests remain. Extensions cover authentication-before-access, reporting
totals/date windows, independent configuration gates, network normalization,
per-site/day pseudonyms, concurrent membership updates, UTC rollover, expiry and
absence of raw IP/history fields. Optional fast-TTL integration tests use only an
explicitly asserted disposable localhost URI, never the running app database:

```powershell
docker run -d --rm --name lumix-visitors-unit-mongo -p 127.0.0.1:27028:27017 mongo:7.0 --setParameter ttlMonitorSleepSecs=1
$env:VISITOR_TEST_MONGODB_URI='mongodb://127.0.0.1:27028/lumix_visitors'
npm test
Remove-Item Env:VISITOR_TEST_MONGODB_URI
docker stop lumix-visitors-unit-mongo
```

This disposable test-only Mongo is loopback-bound and contains no real data. The
working local/staging app uses authenticated Mongo with no published DB port.

For reproducible production-Docker browser checks after `visitors:setup/up`:

```powershell
npm.cmd exec --yes --package=playwright -c "node scripts/verify-visitors-browser.mjs --reset-test-data"
```

On Windows this uses installed Chrome. Else install Playwright Chromium or provide
`CHROME_PATH`; `PLAYWRIGHT_MODULE_PATH` can point to an already installed Playwright
module. The explicit flag authorizes clearing **test collections only**. The script
uses isolated browser contexts, checks authentication, real counts and refresh,
pageviews-only/off/restored modes, specific preference reasons, privacy storage,
ingress overwrite, Mongo auth/role/network exposure, logs and desktop/mobile
overflow. It restores the enabled local-test setup and leaves generated pageviews
visible in the dashboard. It never changes a personal browser profile, production
data or the shared API deployment.

`npm run visitors:verify-mongo` additionally tests the legacy-volume authentication
migration on its own disposable container/volume/internal network, using generated
private production secret files. It inserts one synthetic marker before enabling
auth, runs bootstrap, verifies the marker survives and anonymous reads fail, then
removes only its own fixture resources. It never opens the shared API volume.

### Recorded verification: 15 November 2026

All **22** Node tests passed, including both real-Mongo integration tests. ESLint,
TypeScript, the native production build and standalone Docker production build
passed. The populated-volume authentication migration passed in an isolated fixture.
Production Chromium checks passed on the authenticated local Compose stack:
dashboard/report authorization, real pageviews/daily deduplication, query exclusion,
test-only reset preserving preferences, distinct GPC/DNT/storage reasons, estimator
off with pageviews on, collection off, restored enabled testing, trusted header
overwrite, Mongo roles/no published DB port, application-log markers and desktop /
mobile layouts. The stack was left running with four generated test pageviews and
one daily network estimate; counts naturally change with visits and UTC rollover.
The existing shared API stack and its data were not changed or instrumented.
