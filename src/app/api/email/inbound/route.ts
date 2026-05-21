import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "vertentebr.com.br")
  .split(",")[0]
  .trim()
  .toLowerCase();

// Extrai o slug do site a partir do destinatário: <local>@<slug>.<root>
function slugDoDestinatario(to: string): string | null {
  const at = to.toLowerCase().trim().split("@")[1];
  if (!at) return null;
  const suffix = `.${ROOT}`;
  if (!at.endsWith(suffix)) return null;
  const sub = at.slice(0, at.length - suffix.length);
  if (!sub || sub.includes(".")) return null; // só 1 nível de subdomínio
  return sub;
}

// Heurística pra destacar código de verificação (4-8 dígitos, ou 5-8 alfanumérico).
function extrairCodigo(subject: string, texto: string): string | null {
  const alvo = `${subject}\n${texto}`;
  const numerico = alvo.match(/\b(\d{4,8})\b/);
  if (numerico) return numerico[1];
  const alfanum = alvo.match(/\b([A-Z0-9]{5,8})\b/);
  if (alfanum && /\d/.test(alfanum[1]) && /[A-Z]/.test(alfanum[1])) return alfanum[1];
  return null;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-mail-token");
  if (!process.env.MAIL_INBOUND_SECRET || token !== process.env.MAIL_INBOUND_SECRET) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { to?: string; from?: string; subject?: string; text?: string; html?: string }
    | null;
  if (!body?.to || !body?.from) {
    return NextResponse.json({ ok: false, erro: "campos obrigatórios: to, from" }, { status: 400 });
  }

  const slug = slugDoDestinatario(body.to);
  if (!slug) return NextResponse.json({ ok: false, erro: "destinatário fora do domínio" }, { status: 422 });

  // Recebe pra qualquer site existente, mesmo rascunho/inativo (códigos de verificação
  // precisam chegar antes de publicar). Só descarta se o site não existir.
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) {
    log.warn("email inbound sem site", { slug });
    return NextResponse.json({ ok: true, descartado: true });
  }

  const subject = (body.subject ?? "").slice(0, 500);
  const texto = (body.text ?? "").slice(0, 20000);
  const html = (body.html ?? "").slice(0, 100000);
  const codigo = extrairCodigo(subject, body.text ?? "");

  await prisma.emailMessage.create({
    data: {
      siteId: site.id,
      fromAddr: String(body.from).slice(0, 320),
      toAddr: String(body.to).slice(0, 320),
      subject: subject || null,
      texto: texto || null,
      html: html || null,
      codigo,
    },
  });

  log.info("email inbound", { slug, from: String(body.from).slice(0, 40), temCodigo: !!codigo });
  return NextResponse.json({ ok: true });
}
