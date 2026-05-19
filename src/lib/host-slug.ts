import { headers } from "next/headers";

const ROOTS = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fachada.local")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const RESERVED = new Set(["www", "admin", "api"]);

export async function slugFromHost(): Promise<string | null> {
  const h = await headers();
  const raw = (h.get("host") ?? "").toLowerCase().split(":")[0];
  if (!raw) return null;

  for (const root of ROOTS) {
    if (raw === root || raw === `www.${root}`) return null;
    if (raw.endsWith(`.${root}`)) {
      const sub = raw.slice(0, -1 * (root.length + 1));
      return sub.includes(".") || RESERVED.has(sub) ? null : sub;
    }
  }

  if (raw.endsWith(".localhost")) {
    const sub = raw.slice(0, -".localhost".length);
    return sub.includes(".") || RESERVED.has(sub) ? null : sub;
  }
  return null;
}

export async function urlBaseFromHost(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? ROOTS[0];
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
