"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { consultarCnpj, limparCnpj, validarCnpj, gerarSlug, CnpjError } from "@/lib/cnpj";

export type CriarSiteState = { erro?: string; campo?: string } | undefined;

export async function criarSite(_prev: CriarSiteState, formData: FormData): Promise<CriarSiteState> {
  const cnpjRaw = String(formData.get("cnpj") ?? "");
  const cnpj = limparCnpj(cnpjRaw);

  if (!validarCnpj(cnpj)) return { erro: "CNPJ inválido", campo: "cnpj" };

  const existente = await prisma.site.findUnique({ where: { cnpj }, select: { slug: true } });
  if (existente) redirect(`/preview/${existente.slug}`);

  let receita;
  try {
    receita = await consultarCnpj(cnpj);
  } catch (e) {
    const err = e as CnpjError;
    const msg =
      err.code === "NAO_ENCONTRADO" ? "CNPJ não encontrado na base da Receita"
      : err.code === "RATE_LIMIT" ? "Muitas consultas. Tente em alguns segundos."
      : err.code === "API_FORA" ? "Minha Receita fora do ar agora. Tente em instantes."
      : err.code === "INVALIDO" ? "CNPJ inválido"
      : "Falha ao consultar CNPJ";
    return { erro: msg };
  }

  const slug = gerarSlug(receita.razao_social, cnpj);

  await prisma.site.create({
    data: {
      cnpj,
      slug,
      razaoSocial: receita.razao_social,
      nomeFantasia: receita.nome_fantasia,
      endereco: {
        logradouro: receita.logradouro,
        numero: receita.numero,
        complemento: receita.complemento,
        bairro: receita.bairro,
        municipio: receita.municipio,
        uf: receita.uf,
        cep: receita.cep,
      },
      telefone: receita.ddd_telefone_1,
      emailContato: receita.email,
      cnaeFiscal: receita.cnae_fiscal ? String(receita.cnae_fiscal) : null,
      cnaeDescricao: receita.cnae_fiscal_descricao,
      capitalSocial: receita.capital_social ?? null,
      dataAbertura: receita.data_inicio_atividade ? new Date(receita.data_inicio_atividade) : null,
      socios: receita.qsa as unknown as object,
      receitaRaw: receita as unknown as object,
    },
  });

  redirect(`/preview/${slug}`);
}
