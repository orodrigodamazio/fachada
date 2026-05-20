"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { consultarCnpj, limparCnpj, validarCnpj, gerarSlug, CnpjError } from "@/lib/cnpj";
import { gerarPaletaSeed } from "@/lib/palette";
import { log } from "@/lib/logger";
import { prewarmSite } from "@/lib/prewarm";

export type CriarSiteState = { erro?: string; campo?: string } | undefined;

export async function criarSite(_prev: CriarSiteState, formData: FormData): Promise<CriarSiteState> {
  const user = await requireUser();

  const cnpjRaw = String(formData.get("cnpj") ?? "");
  const cnpj = limparCnpj(cnpjRaw);

  if (!validarCnpj(cnpj)) return { erro: "CNPJ inválido", campo: "cnpj" };

  const existente = await prisma.site.findUnique({ where: { cnpj }, select: { slug: true, userId: true } });
  if (existente) {
    if (existente.userId === user.id) redirect(`/app/${existente.slug}`);
    return { erro: "Esse CNPJ já possui um site na plataforma.", campo: "cnpj" };
  }

  let receita;
  try {
    receita = await consultarCnpj(cnpj);
  } catch (e) {
    const err = e as CnpjError;
    log.warn("consultarCnpj falhou", { cnpj, code: err.code });
    const msg =
      err.code === "NAO_ENCONTRADO" ? "CNPJ não encontrado na base da Receita"
      : err.code === "RATE_LIMIT" ? "Muitas consultas. Tente em alguns segundos."
      : err.code === "API_FORA" ? "Minha Receita fora do ar agora. Tente em instantes."
      : err.code === "INVALIDO" ? "CNPJ inválido"
      : "Falha ao consultar CNPJ";
    return { erro: msg };
  }

  const slug = gerarSlug(receita.razao_social, cnpj);
  const paleta = gerarPaletaSeed(`${receita.razao_social}|${cnpj}`);

  // Pré-preenchimento automático a partir do cartão CNPJ (sem IA). Usuário ajusta no editor.
  const nomeEmpresa = receita.nome_fantasia?.trim() || receita.razao_social;
  const seg = receita.cnae_fiscal_descricao;
  const cidade = receita.municipio;
  const anoAb = receita.data_inicio_atividade ? new Date(receita.data_inicio_atividade).getFullYear() : null;
  const conteudo = {
    heroTitulo: nomeEmpresa,
    heroSubtitulo: seg ? `${seg}${cidade ? ` em ${cidade}` : ""}.` : "Compromisso, qualidade e atendimento próximo em tudo que entregamos.",
    sobre: `A ${receita.razao_social} atua${seg ? ` em ${seg.toLowerCase()}` : " em seu segmento"}${anoAb ? `, em atividade desde ${anoAb}` : ""}. Construímos relações duradouras com clientes e parceiros, sustentadas por compromisso, transparência e qualidade no que entregamos.`,
    missao: "Oferecer soluções consistentes e atendimento próximo, com responsabilidade e cuidado em cada etapa da relação com nossos clientes.",
    horarioAtend: "Segunda a sexta, das 9h às 18h",
    whatsapp: receita.ddd_telefone_1 || null,
  };

  log.info("site criado", { cnpj, slug, razao: receita.razao_social });

  await prisma.site.create({
    data: {
      userId: user.id,
      ativo: false, // nasce como rascunho; publica no editor após revisar
      cnpj,
      slug,
      corPrimaria: paleta.primaria,
      corSecundaria: paleta.secundaria,
      heroTitulo: conteudo.heroTitulo,
      heroSubtitulo: conteudo.heroSubtitulo,
      sobre: conteudo.sobre,
      missao: conteudo.missao,
      horarioAtend: conteudo.horarioAtend,
      whatsapp: conteudo.whatsapp,
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

  await prewarmSite(slug).catch(() => false);

  redirect(`/app/${slug}`);
}
