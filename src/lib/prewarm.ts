import { log } from "@/lib/logger";

const ROOTS = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const HEADERS = {
  "User-Agent": "FachadaPrewarm/1.0",
  Accept: "text/html,*/*;q=0.8",
};

export async function prewarmSite(slug: string, maxAttempts = 4): Promise<boolean> {
  const root = ROOTS[0];
  if (!root || root.endsWith(".local")) return false;
  const url = `https://${slug}.${root}/`;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000), redirect: "manual" });
      if (r.status < 500) {
        log.info("prewarm ok", { slug, status: r.status, attempt: i + 1 });
        return true;
      }
    } catch (e) {
      log.debug("prewarm tentativa falhou", { slug, attempt: i + 1, error: (e as Error).message.slice(0, 80) });
    }
    if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, 1500));
  }
  log.warn("prewarm desistiu", { slug, maxAttempts });
  return false;
}
