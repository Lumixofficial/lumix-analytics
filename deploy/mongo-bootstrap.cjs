// Run via docker compose exec on the Mongo host, during a maintenance window.
// Mongo's localhost exception allows the FIRST administrator only when no users
// exist. Existing installations with users need their actual administrator.
const fs = require("fs");
const adminDb = db.getSiblingDB("admin");
const rootPassword = fs.readFileSync("/run/secrets/mongo_root_password", "utf8").trim();
try {
  if (!adminDb.auth("lumix_root", rootPassword)) throw new Error("Authentication required");
} catch {
  adminDb.createUser({ user: "lumix_root", pwd: rootPassword, roles: ["root"] });
  adminDb.auth("lumix_root", rootPassword);
}
for (const entry of [
  { name: "lumix", user: "lumix_api", file: "mongo_api_password" },
  { name: "lumix_visitors", user: "lumix_visitors", file: "mongo_app_password" },
]) {
  const target = db.getSiblingDB(entry.name);
  if (!target.getUser(entry.user)) target.createUser({ user: entry.user,
    pwd: fs.readFileSync(`/run/secrets/${entry.file}`, "utf8").trim(), roles: [{ role: "readWrite", db: entry.name }] });
}
print("Authenticated database users are provisioned. No application data was changed.");
