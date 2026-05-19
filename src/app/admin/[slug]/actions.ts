"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type EditState = { ok?: boolean; erro?: string } | undefined;

const CAMPOS_TEXTO = ["heroTitulo", "heroSubtitulo", "sobre", "missao", "visao", "rodape", "metaTitle", "metaDescription"] as const;
type CampoTexto = (typeof CAMPOS_TEXTO)[number];

export async function salvarTextos(slug: string, _prev: EditState, formData: FormData): Promise<EditState> {
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return { erro: "Site não encontrado" };

  const data: Partial<Record<CampoTexto, string | null>> = {};
  for (const c of CAMPOS_TEXTO) {
    const v = formData.get(c);
    if (v !== null) {
      const s = String(v).trim();
      data[c] = s ? s.slice(0, 5000) : null;
    }
  }

  await prisma.site.update({ where: { id: site.id }, data });
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/s/${slug}`);
  return { ok: true };
}

export async function alternarAtivo(slug: string) {
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, ativo: true } });
  if (!site) return;
  await prisma.site.update({ where: { id: site.id }, data: { ativo: !site.ativo } });
  revalidatePath(`/admin`);
  revalidatePath(`/admin/${slug}`);
}

export async function deletarSite(slug: string) {
  await prisma.site.delete({ where: { slug } });
  revalidatePath(`/admin`);
  redirect("/admin");
}
