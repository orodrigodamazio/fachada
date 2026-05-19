import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

export const carregarSitePorSlug = cache(async (slug: string) => {
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site || !site.ativo) notFound();
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
