import { randomBytes, scryptSync } from "node:crypto";
import { mkdirSync, existsSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { configureVisitorDev } from "./visitors-dev-config.mjs";

const root = resolve(import.meta.dirname, "..");
const command = process.argv[2] ?? "setup";
const production = command === "production-secrets";
const directory = resolve(root, ".local", production ? "visitors-production" : "visitors-test");
const docker = process.platform === "win32" ? "docker.exe" : "docker";
function run(args) {
  const result = spawnSync(docker, args, { cwd: root, stdio: "inherit", windowsHide: true });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
function create(name, content) {
  const target = resolve(directory, name);
  if (!existsSync(target)) writeFileSync(target, content, { mode: 0o600, flag: "wx" });
  return readFileSync(target, "utf8").trim();
}
if (command === "setup" || production) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (process.platform === "win32") {
    const account = `${process.env.USERDOMAIN}\\${process.env.USERNAME}`;
    const acl = spawnSync("icacls.exe", [directory, "/inheritance:r", "/grant:r", `${account}:(OI)(CI)F`, "*S-1-5-18:(OI)(CI)F"], { windowsHide: true, stdio: "ignore" });
    if (acl.status !== 0) throw new Error("Could not restrict the secrets directory ACL. No credentials were generated.");
  } else chmodSync(directory, 0o700);
  const secret = () => randomBytes(32).toString("hex");
  create("mongo-root-password", secret());
  const mongoPassword = create("mongo-app-password", secret());
  const database = production ? "lumix_visitors" : "lumix_visitors_test";
  create("visitor-mongo-uri", `mongodb://${database}:${mongoPassword}@${production ? "mongo-lumix" : "mongo"}:27017/${database}?authSource=${database}`);
  const credentials = JSON.parse(create("admin-login.json", JSON.stringify({ username: "admin", password: randomBytes(24).toString("base64url") }, null, 2)));
  const salt = randomBytes(16);
  create("admin-password-hash", `scrypt:${salt.toString("hex")}:${scryptSync(credentials.password, salt, 32).toString("hex")}`);
  if (production) {
    const apiPassword = create("mongo-api-password", secret());
    create("compose.env", `LUMIX_ANALYTICS_DEPLOY_DIR=${root.replaceAll("\\", "/")}\nLUMIX_API_MONGODB_URI=mongodb://lumix_api:${apiPassword}@mongo-lumix:27017/lumix?authSource=lumix\n`);
  }
  // Compose file-backed secrets inherit host permissions. The containing
  // directory remains owner-only; mounted files must be readable by UID 1001.
  for (const file of ["mongo-root-password", "mongo-app-password", "visitor-mongo-uri", "admin-password-hash", ...(production ? ["mongo-api-password"] : [])]) {
    chmodSync(resolve(directory, file), 0o444);
  }
  console.log(`Private ${production ? "production" : "local test"} secrets are ready in ${directory}. Existing credentials were preserved.`);
  console.log("Login name: admin. Read admin-login.json privately for the password; do not commit or share it.");
  if (!production) {
    configureVisitorDev(root);
    console.log("Next: npm run visitors:db, then npm run dev. Dashboard: http://localhost:3000/admin/visitors. Restart dev after setup changes.");
  }
} else if (["up", "down", "reset", "db"].includes(command)) {
  if (!existsSync(resolve(directory, "visitor-mongo-uri"))) throw new Error("Run npm run visitors:setup first.");
  const compose = ["compose", "-f", "compose.visitors-test.yml"];
  if (command === "db") run([...compose, "-f", "compose.visitors-dev.yml", "up", "-d", "--wait", "mongo"]);
  if (command === "up") run([...compose, "up", "-d", "--build"]);
  if (command === "down") run([...compose, "down"]);
  if (command === "reset") run([...compose, "exec", "-T", "mongo", "mongosh", "--quiet", "--file", "/run/lumix/reset-test.cjs"]);
} else throw new Error("Expected setup, up, down, reset or production-secrets.");
