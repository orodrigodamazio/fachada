import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type EnderecoJson = {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
};

export type SocioJson = { nome_socio: string; qualificacao_socio: string };

export const carregarSitePorSlug = cache(async (slugOrDomain: string) => {
  const id = decodeURIComponent(slugOrDomain).toLowerCase();
  const site = id.includes(".")
    ? await prisma.site.findFirst({ where: { dominioProprio: id, dominioStatus: "VERIFICADO" } })
    : await prisma.site.findUnique({ where: { slug: id } });
  if (!site) notFound();
  // Rascunho (não publicado): só o dono/admin enxerga (preview); público vê 404.
  if (!site.ativo) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && site.userId !== user.id)) notFound();
  }
  return site;
});

export function formatarCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatarTelefone(tel: string | null) {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return tel;
}

export function formatarEndereco(e: EnderecoJson) {
  return [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.municipio, e.uf].filter(Boolean).join(" / "),
    e.cep ? `CEP ${e.cep}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function tituloEmpresa(razaoSocial: string, nomeFantasia: string | null) {
  return nomeFantasia?.trim() || razaoSocial;
}

export function urlPublica(site: {
  slug: string;
  dominioProprio?: string | null;
  dominioStatus?: string | null;
}): string {
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "vertentebr.com.br")
    .split(",")[0]
    .trim();
  if (site.dominioProprio && site.dominioStatus === "VERIFICADO") return `https://${site.dominioProprio}`;
  return `https://${site.slug}.${root}`;
}
