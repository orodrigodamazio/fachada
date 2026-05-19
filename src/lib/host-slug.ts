import { headers } from "next/headers";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fachada.local").toLowerCase();

export async function slugFromHost(): Promise<string | null> {
  const h = await headers();
  const raw = (h.get("host") ?? "").toLowerCase().split(":")[0];
  if (!raw) return null;
  if (raw === ROOT || raw === `www.${ROOT}`) return null;
  if (!raw.endsWith(`.${ROOT}`)) {
    if (!raw.endsWith(".localhost")) return null;
    const sub = raw.slice(0, -".localhost".length);
    return sub.includes(".") || ["www", "admin", "api"].includes(sub) ? null : sub;
  }
  const sub = raw.slice(0, -1 * (ROOT.length + 1));
  return sub.includes(".") || ["www", "admin", "api"].includes(sub) ? null : sub;
}

export async function urlBaseFromHost(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? `${ROOT}`;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
