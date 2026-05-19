import { prisma } from "@/lib/prisma";
import { verificarCname, verificarMX, alvoCNAME } from "@/lib/dns-verify";
import { log } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function autenticado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!autenticado(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const t0 = Date.now();
  const sites = await prisma.site.findMany({
    where: {
      dominioProprio: { not: null },
      dominioStatus: { in: ["PENDENTE_DNS", "VERIFICADO", "FALHA"] },
    },
    select: { id: true, slug: true, dominioProprio: true, cnameAlvo: true, dominioStatus: true },
  });

  const alvo = alvoCNAME();
  const resultados: Array<{ slug: string; antes: string; depois: string }> = [];

  for (const site of sites) {
    if (!site.dominioProprio) continue;
    const r = await verificarCname(site.dominioProprio, site.cnameAlvo ?? alvo);
    const novoStatus = r.ok ? "VERIFICADO" : "FALHA";
    if (novoStatus !== site.dominioStatus) {
      await prisma.site.update({
        where: { id: site.id },
        data: { dominioStatus: novoStatus, dominioVerifEm: new Date() },
      });
      revalidatePath(`/admin/${site.slug}`);
      log.info("dominio status mudou", {
        slug: site.slug,
        dominio: site.dominioProprio,
        de: site.dominioStatus,
        para: novoStatus,
      });
    } else {
      await prisma.site.update({
        where: { id: site.id },
        data: { dominioVerifEm: new Date() },
      });
    }
    resultados.push({ slug: site.slug, antes: site.dominioStatus, depois: novoStatus });
  }

  const emailSites = await prisma.site.findMany({
    where: {
      dominioProprio: { not: null },
      dominioStatus: "VERIFICADO",
      emailHandle: { not: null },
      emailStatus: { in: ["PENDENTE_MX", "VERIFICADO", "FALHA"] },
    },
    select: { id: true, slug: true, dominioProprio: true, emailStatus: true },
  });

  const emailResultados: Array<{ slug: string; antes: string; depois: string }> = [];
  for (const s of emailSites) {
    if (!s.dominioProprio) continue;
    const r = await verificarMX(s.dominioProprio);
    const novo = r.ok ? "VERIFICADO" : "FALHA";
    if (novo !== s.emailStatus) {
      await prisma.site.update({
        where: { id: s.id },
        data: { emailStatus: novo, emailVerifEm: new Date() },
      });
      revalidatePath(`/admin/${s.slug}`);
      log.info("email MX mudou", { slug: s.slug, de: s.emailStatus, para: novo });
    } else {
      await prisma.site.update({ where: { id: s.id }, data: { emailVerifEm: new Date() } });
    }
    emailResultados.push({ slug: s.slug, antes: s.emailStatus, depois: novo });
  }

  return Response.json({
    ok: true,
    duracao_ms: Date.now() - t0,
    dominios: {
      total: sites.length,
      mudancas: resultados.filter((r) => r.antes !== r.depois).length,
      resultados,
    },
    emails: {
      total: emailSites.length,
      mudancas: emailResultados.filter((r) => r.antes !== r.depois).length,
      resultados: emailResultados,
    },
  });
}
