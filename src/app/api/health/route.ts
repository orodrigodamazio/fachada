import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; ms: number; detail?: string };

async function timed<T>(name: string, fn: () => Promise<T>): Promise<Check> {
  const t0 = Date.now();
  try {
    await fn();
    return { name, ok: true, ms: Date.now() - t0 };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - t0, detail: (e as Error).message.slice(0, 200) };
  }
}

export async function GET(req: Request) {
  const verbose = new URL(req.url).searchParams.has("verbose");
  const checks: Check[] = [
    await timed("database", () => prisma.$queryRaw`SELECT 1`),
  ];

  if (process.env.R2_PUBLIC_BASE_URL) {
    checks.push(
      await timed("cdn", async () => {
        const r = await fetch(process.env.R2_PUBLIC_BASE_URL!, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        if (r.status >= 500) throw new Error(`status ${r.status}`);
      }),
    );
  }

  const ok = checks.every((c) => c.ok);
  return Response.json(
    {
      status: ok ? "ok" : "degraded",
      uptime: Math.floor(process.uptime?.() ?? 0),
      version: process.env.GIT_SHA ?? "dev",
      checks: verbose ? checks : checks.map((c) => ({ name: c.name, ok: c.ok })),
    },
    { status: ok ? 200 : 503 },
  );
}
