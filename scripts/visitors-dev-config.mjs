import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export function configureVisitorDev(root) {
  const directory = resolve(root, ".local/visitors-test");
  const uri = new URL(readFileSync(resolve(directory, "visitor-mongo-uri"), "utf8").trim());
  if (uri.pathname !== "/lumix_visitors_test") throw new Error("Development must use the test database.");
  uri.hostname = "127.0.0.1"; uri.port = "27029";
  const nativeUri = resolve(directory, "visitor-mongo-uri-dev");
  if (existsSync(nativeUri)) {
    if (readFileSync(nativeUri, "utf8").trim() !== uri.toString()) throw new Error("Existing native Mongo secret differs; reconcile it manually. Nothing was overwritten.");
  } else writeFileSync(nativeUri, uri.toString(), { mode: 0o600, flag: "wx" });
  const filename = resolve(root, ".env.local");
  const current = existsSync(filename) ? readFileSync(filename, "utf8") : "";
  const start = "# BEGIN managed visitor development", end = "# END managed visitor development";
  const without = current.replace(new RegExp(String.raw`${start}[\s\S]*?${end}\r?\n?`, "g"), "");
  if (/^\s*VISITOR_(?:ANALYTICS|ADMIN)_/m.test(without)) throw new Error("Existing visitor configuration outside the managed block must be reconciled manually. Secrets and local settings were preserved.");
  const values = {
    VISITOR_ANALYTICS_ENABLED: "true", VISITOR_ANALYTICS_DATASET: "test", VISITOR_ANALYTICS_MODE: "local-test",
    VISITOR_FRONT_ENABLED: "true", VISITOR_FRONT_ORIGIN: "http://localhost:3001", VISITOR_FRONT_UNIQUES_ENABLED: "true",
    VISITOR_ANALYTICS_ORIGIN: "http://localhost:3000", VISITOR_ANALYTICS_RETENTION_DAYS: "30",
    VISITOR_ANALYTICS_UNIQUES_ENABLED: "true", VISITOR_ANALYTICS_TRUST_PROXY: "true",
    VISITOR_ANALYTICS_MONGODB_URI_FILE: nativeUri.replaceAll("\\", "/"),
    VISITOR_ADMIN_USERNAME: JSON.parse(readFileSync(resolve(directory, "admin-login.json"), "utf8")).username,
    VISITOR_ADMIN_PASSWORD_HASH_FILE: resolve(directory, "admin-password-hash").replaceAll("\\", "/"),
  };
  const block = Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n");
  writeFileSync(filename, `${without.trimEnd()}\n\n${start}\n${block}\n${end}\n`, { mode: 0o600 });
}
