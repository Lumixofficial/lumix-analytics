import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export function utcDay(now: Date): string { return now.toISOString().slice(0, 10); }
export function nextUtcDay(now: Date): Date { return new Date(Date.parse(`${utcDay(now)}T00:00:00Z`) + 86_400_000); }

// Coarse network prefix only: IPv4 /24, IPv6 /48. No UA or browser attributes.
// Prefixes exist in request memory only; they are never returned or persisted.
export function networkPrefix(value: string | null): string | null {
  if (!value || value.length > 64 || value.includes(",") || value.includes("%")) return null;
  let ip = value.trim();
  if (isIP(ip) === 6) {
    ip = new URL(`http://[${ip}]`).hostname.slice(1, -1);
    const mapped = /^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/i.exec(ip);
    if (mapped) {
      const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
      ip = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    }
  }
  if (isIP(ip) === 4) return `v4:${ip.split(".").slice(0, 3).join(".")}.0/24`;
  if (isIP(ip) !== 6) return null;
  const [left, right] = ip.split("::");
  const head = left ? left.split(":") : [], tail = right ? right.split(":") : [];
  const parts = right === undefined ? head : [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail];
  return `v6:${parts.slice(0, 3).map(part => part.padStart(4, "0")).join(":")}::/48`;
}

export function dailyPseudonym(prefix: string, secret: string, origin: string): string {
  return createHmac("sha256", Buffer.from(secret, "hex")).update(`lumix-analytics\n${origin}\n${prefix}`).digest("base64url");
}
