"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ContatoState =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string }
  | undefined;

export async function enviarContato(
  slug: string,
  _prev: ContatoState,
  formData: FormData,
): Promise<ContatoState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const mensagem = String(formData.get("mensagem") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");

  if (honeypot) return { ok: true, mensagem: "Recebido. Em breve retornaremos." };
  if (!nome || !mensagem) return { ok: false, erro: "Nome e mensagem são obrigatórios." };
  if (!email && !telefone) return { ok: false, erro: "Informe email ou telefone." };
  if (mensagem.length > 5000) return { ok: false, erro: "Mensagem muito longa." };
  if (nome.length > 200) return { ok: false, erro: "Nome muito longo." };

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return { ok: false, erro: "Site não encontrado." };

  const h = await headers();
  await prisma.lead.create({
    data: {
      siteId: site.id,
      nome,
      email: email || null,
      telefone: telefone || null,
      mensagem,
      ip: h.get("x-forwarded-for")?.split(",")[0].trim() || null,
      userAgent: h.get("user-agent")?.slice(0, 500) || null,
    },
  });

  revalidatePath(`/admin/${slug}/leads`);
  return { ok: true, mensagem: "Mensagem recebida. Em breve retornaremos." };
}
