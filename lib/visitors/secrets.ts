import { readFileSync } from "node:fs";

export type Environment = Record<string, string | undefined>;

// Server-only callers. Docker secrets are preferred; plain server env remains
// supported for existing installations. Never serialize the returned values.
export function serverSecret(name: string, env: Environment = process.env): string {
  const file = env[`${name}_FILE`];
  if (file) {
    try { return readFileSync(file, "utf8").trim(); } catch { return ""; }
  }
  return env[name]?.trim() ?? "";
}
