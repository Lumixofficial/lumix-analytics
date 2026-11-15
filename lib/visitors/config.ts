import { serverSecret, type Environment } from "./secrets";

export type VisitorStorageConfig = {
  mongoUri: string;
  database: "lumix_visitors" | "lumix_visitors_test";
  dataset: "test" | "production";
  retentionDays: number;
  maxPerMinute: number;
};

export type VisitorConfig = VisitorStorageConfig & {
  origin: string;
  localTest: boolean;
  estimator: { enabled: boolean; reason: string };
  notice: VisitorNotice;
};

export type VisitorNotice = {
  controller: string;
  contact: string;
  exemption: string;
  hosting: string;
  processors: string;
  transfers: string;
};

export function visitorNotice(env: Environment = process.env): VisitorNotice {
  const value = (key: string) => env[`VISITOR_ANALYTICS_${key}`]?.trim() ?? "";
  return {
    controller: value("CONTROLLER"), contact: value("CONTACT_EMAIL"),
    exemption: value("EXEMPTION"), hosting: value("HOSTING"),
    processors: value("PROCESSORS"), transfers: value("TRANSFERS"),
  };
}

export function isLoopbackOrigin(origin: string): boolean {
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname); }
  catch { return false; }
}

export function visitorStorageState(env: Environment = process.env): { config: VisitorStorageConfig | null; reason: string } {
  const off = (reason: string) => ({ config: null, reason });
  const dataset = env.VISITOR_ANALYTICS_DATASET ?? "production";
  if (dataset !== "production" && dataset !== "test") return off("The visitor dataset must be test or production.");
  const database = dataset === "test" ? "lumix_visitors_test" : "lumix_visitors";
  const mongoUri = serverSecret("VISITOR_ANALYTICS_MONGODB_URI", env);
  const retentionDays = Number(env.VISITOR_ANALYTICS_RETENTION_DAYS ?? "30");
  const maxPerMinute = Number(env.VISITOR_ANALYTICS_MAX_PER_MINUTE ?? "300");
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 90) return off("Pageview retention must be an integer from 1 to 90 days.");
  if (!Number.isInteger(maxPerMinute) || maxPerMinute < 1 || maxPerMinute > 10_000) return off("The collector budget must be an integer from 1 to 10000 per minute.");
  if (!mongoUri) return off(env.VISITOR_ANALYTICS_MONGODB_URI_FILE ? "The visitor Mongo secret is unavailable." : "The visitor Mongo URI is missing.");
  try {
    const db = new URL(mongoUri);
    if (!["mongodb:", "mongodb+srv:"].includes(db.protocol)) return off("The visitor database URI must use MongoDB.");
    if (db.pathname !== `/${database}`) return off("The visitor database name does not match the selected dataset.");
    if (!db.username || !db.password) return off("Visitor Mongo authentication credentials are missing.");
  } catch { return off("The visitor Mongo URI is invalid."); }
  return { config: { mongoUri, database, dataset, retentionDays, maxPerMinute }, reason: "Authenticated visitor storage is configured." };
}

export function visitorStorageConfig(env: Environment = process.env): VisitorStorageConfig | null {
  return visitorStorageState(env).config;
}

export function estimatorConfig(env: Environment = process.env, localTest = false) {
  if (env.VISITOR_ANALYTICS_UNIQUES_ENABLED !== "true") return { enabled: false, reason: "Daily visitor estimation is switched off." };
  if (!localTest && !env.VISITOR_ANALYTICS_UNIQUES_REVIEW_ID?.trim()) return { enabled: false, reason: "Daily visitor estimation needs its own privacy review." };
  if (env.VISITOR_ANALYTICS_TRUST_PROXY !== "true") return { enabled: false, reason: "A trusted ingress that overwrites the client-IP header has not been confirmed." };
  return { enabled: true, reason: "Daily network estimation is enabled." };
}

// Review flags are operator attestations, never proof of legal compliance.
export function visitorState(env: Environment = process.env): { config: VisitorConfig | null; reason: string } {
  const off = (reason: string) => ({ config: null, reason });
  if (env.VISITOR_ANALYTICS_ENABLED !== "true") return off("Pageview collection is switched off.");
  const origin = env.VISITOR_ANALYTICS_ORIGIN ?? "";
  const localTest = env.VISITOR_ANALYTICS_MODE === "local-test" && env.VISITOR_ANALYTICS_DATASET === "test" && isLoopbackOrigin(origin);
  if (!localTest && env.VISITOR_ANALYTICS_MODE !== "reviewed-exemption") return off("The collection mode has not been approved for this deployment.");
  if (!localTest && !env.VISITOR_ANALYTICS_REVIEW_ID?.trim()) return off("The pageview privacy review is missing.");
  if (!localTest && env.VISITOR_ANALYTICS_LOG_REVIEWED !== "true") return off("The infrastructure logging review is missing.");
  const notice = visitorNotice(env);
  if (!localTest && (Object.values(notice).some((value) => !value) ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(notice.contact))) return off("The public privacy information is incomplete.");
  try {
    const url = new URL(origin);
    const loopback = isLoopbackOrigin(origin) && (localTest || env.NODE_ENV !== "production");
    if (url.origin !== origin || (url.protocol !== "https:" && !(loopback && url.protocol === "http:"))) return off("The allowed site origin is invalid.");
  } catch { return off("The allowed site origin is missing or invalid."); }
  const storage = visitorStorageState(env);
  if (!storage.config) return off(storage.reason);
  return { config: { ...storage.config, origin, localTest, notice, estimator: estimatorConfig(env, localTest) }, reason: "Pageview collection is enabled." };
}

export function visitorConfig(env: Environment = process.env): VisitorConfig | null {
  return visitorState(env).config;
}
