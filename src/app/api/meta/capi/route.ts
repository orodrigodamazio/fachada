import crypto from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

type Payload = {
  event?: string;
  url?: string;
  slug?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  value?: number;
  currency?: string;
};

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
}

function hashTel(tel: string): string {
  return sha256(tel.replace(/\D/g, ""));
}

async function siteByHost(host: string | null, slugFromBody?: string) {
  const h = (host ?? "").toLowerCase().split(":")[0];
  const roots = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase());

  for (const root of roots) {
    if (h.endsWith(`.${root}`)) {
      const sub = h.slice(0, -1 * (root.length + 1));
      if (!sub.includes(".")) {
        const s = await prisma.site.findUnique({
          where: { slug: sub },
          select: { metaPixel: true, metaCapiToken: true, slug: true },
        });
        if (s) return s;
      }
    }
  }
  if (slugFromBody) {
    return prisma.site.findUnique({
      where: { slug: slugFromBody },
      select: { metaPixel: true, metaCapiToken: true, slug: true },
    });
  }
  return null;
}

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = (body.event ?? "PageView").slice(0, 50);
  if (!body.url || body.url.length > 2000) return Response.json({ error: "missing_url" }, { status: 400 });

  const h = await headers();
  const site = await siteByHost(h.get("host"), body.slug);
  if (!site) return Response.json({ error: "site_not_found" }, { status: 404 });
  if (!site.metaPixel || !site.metaCapiToken) {
    return Response.json({ ok: true, skipped: "no_capi_token" });
  }

  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "";
  const ua = h.get("user-agent") ?? "";
  const fbc = h.get("x-fbc") ?? undefined;
  const fbp = h.get("x-fbp") ?? undefined;

  const userData: Record<string, string> = { client_ip_address: ip, client_user_agent: ua };
  if (body.email) userData.em = sha256(body.email);
  if (body.phone) userData.ph = hashTel(body.phone);
  if (body.externalId) userData.external_id = sha256(body.externalId);
  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;

  const eventId = crypto.randomUUID();
  const payload = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: body.url,
        action_source: "website",
        user_data: userData,
        custom_data: body.value && body.currency ? { value: body.value, currency: body.currency } : undefined,
      },
    ],
  };

  try {
    const r = await fetch(
      `https://graph.facebook.com/v23.0/${site.metaPixel}/events?access_token=${encodeURIComponent(site.metaCapiToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const respJson = await r.json().catch(() => null);
    if (!r.ok) {
      log.warn("CAPI rejeitado", { slug: site.slug, event, status: r.status, resp: JSON.stringify(respJson).slice(0, 300) });
      return Response.json({ ok: false, status: r.status }, { status: 502 });
    }
    log.info("CAPI ok", { slug: site.slug, event, eventId, received: respJson?.events_received });
    return Response.json({ ok: true, eventId, events_received: respJson?.events_received });
  } catch (e) {
    log.error("CAPI exception", { slug: site.slug, event, error: (e as Error).message.slice(0, 200) });
    return Response.json({ ok: false, error: "capi_failed" }, { status: 502 });
  }
}
