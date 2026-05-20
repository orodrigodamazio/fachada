"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateText, LLMError } from "@/lib/llm";
import { uploadImagem, deletarImagem, R2Error } from "@/lib/r2";
import { tituloEmpresa } from "@/lib/site-loader";
import { log } from "@/lib/logger";
import { verificarCname, verificarMX, validarDominio, alvoCNAME, MX_CLOUDFLARE, SPF_CLOUDFLARE } from "@/lib/dns-verify";

export type EditState = { ok?: boolean; erro?: string } | undefined;
export type IaResult = { ok: true; texto: string } | { ok: false; erro: string };

const PROMPTS: Record<string, string> = {
  heroTitulo: "Escreva uma frase de impacto curta (máx 12 palavras) pro hero do site institucional. Deve transmitir solidez, sem ser genérica. Sem usar a razão social literal.",
  heroSubtitulo: "Escreva 1 a 2 frases pra subtítulo do hero. Deve complementar o título com a área de atuação. Tom profissional. Máximo 200 caracteres.",
  sobre: "Escreva 2 parágrafos institucionais sobre a empresa. Use a razão social uma vez. Mencione o segmento. Foco em compromisso, qualidade e relacionamento. Sem clichês como 'líder de mercado' ou 'soluções inovadoras'.",
  missao: "Escreva a missão da empresa em 1 parágrafo curto (máx 3 frases). Concreta, sem clichê. Foco em como a empresa atua, não em ideais abstratos.",
  visao: "Escreva a visão da empresa em 1 parágrafo curto. Aspiração de futuro coerente com o segmento. Sem 'ser referência nacional', 'líder de mercado' etc.",
  rodape: "Escreva uma frase curta institucional pra rodapé. Reforça compromisso ou identidade da empresa. Máximo 120 caracteres.",
  metaTitle: "Escreva um title SEO curto (máx 60 chars) pra home do site institucional. Inclui o nome da empresa.",
  metaDescription: "Escreva uma meta description SEO entre 130 e 160 chars. Descreve a empresa, segmento e proposta. Sem 'líder', 'inovador' etc.",
};

const SYSTEM = `Você gera texto institucional brasileiro pra sites de empresas. Regras invioláveis:
1. NUNCA use travessões (— ou –). Substitua por ponto, vírgula, dois pontos ou pipe.
2. NUNCA use emojis.
3. NUNCA use clichês: "no entanto", "outrossim", "destarte", "soluções inovadoras", "líder de mercado", "referência nacional", "alavancar", "sinergia".
4. Tom profissional brasileiro, frases diretas, sem encheção. Português Brasil correto.
5. Não invente fatos. Use só o que está no contexto.
6. Retorne APENAS o texto pedido, sem aspas, sem prefixo "Aqui está", sem markdown.`;

export async function gerarTextoIA(slug: string, campo: string): Promise<IaResult> {
  if (!PROMPTS[campo]) return { ok: false, erro: "Campo não suportado" };
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) return { ok: false, erro: "Site não encontrado" };

  const ctx = `Contexto da empresa:
- Razão social: ${site.razaoSocial}
- Nome fantasia: ${site.nomeFantasia ?? "(não informado)"}
- Segmento (CNAE): ${site.cnaeDescricao ?? "(não informado)"}
- Em atividade desde: ${site.dataAbertura?.toISOString().slice(0, 10) ?? "(não informado)"}
- Município: ${(site.endereco as { municipio?: string; uf?: string })?.municipio ?? "(não informado)"} / ${(site.endereco as { uf?: string })?.uf ?? ""}
- Nome usado no site: ${tituloEmpresa(site.razaoSocial, site.nomeFantasia)}`;

  try {
    const texto = await generateText(`${PROMPTS[campo]}\n\n${ctx}`, SYSTEM, {
      temperature: 0.7,
      maxTokens: campo === "sobre" ? 600 : campo === "metaTitle" ? 80 : 250,
    });
    return { ok: true, texto: texto.replace(/^["']|["']$/g, "").trim() };
  } catch (e) {
    const err = e as LLMError;
    const msg = err.code === "NO_KEY" ? "Configure LLM_API_KEY nas envs"
      : err.code === "RATE_LIMIT" ? "Limite do provedor LLM. Tente em 30s"
      : err.code === "TIMEOUT" ? "Timeout. Provedor lento."
      : `Falha do LLM: ${err.message}`;
    return { ok: false, erro: msg };
  }
}

const CAMPOS_TEXTO = ["heroTitulo", "heroSubtitulo", "sobre", "missao", "visao", "rodape", "metaTitle", "metaDescription"] as const;
type CampoTexto = (typeof CAMPOS_TEXTO)[number];

const CAMPOS_TRACKING = ["metaPixel", "metaCapiToken", "gaId"] as const;
type CampoTracking = (typeof CAMPOS_TRACKING)[number];

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

export type TrackingState = { ok?: true; erro?: string } | undefined;

export async function salvarTracking(
  slug: string,
  _prev: TrackingState,
  formData: FormData,
): Promise<TrackingState> {
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return { erro: "Site não encontrado" };

  const data: Partial<Record<CampoTracking, string | null>> = {};
  for (const c of CAMPOS_TRACKING) {
    const v = formData.get(c);
    if (v !== null) {
      const s = String(v).trim();
      if (s && c === "metaPixel" && !/^\d{6,20}$/.test(s)) return { erro: "Pixel ID deve ser numérico" };
      if (s && c === "gaId" && !/^(G-|UA-|GTM-)[A-Z0-9-]+$/i.test(s)) return { erro: "GA ID inválido (use G-XXX, UA-XXX ou GTM-XXX)" };
      data[c] = s || null;
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

export type UploadState = { ok?: true; url?: string; erro?: string } | undefined;

export async function uploadImagemAction(
  slug: string,
  tipo: "logo" | "hero",
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const file = formData.get("arquivo") as File | null;
  if (!file || file.size === 0) return { erro: "Selecione um arquivo" };

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, logoUrl: true, heroImageUrl: true },
  });
  if (!site) return { erro: "Site não encontrado" };

  let url: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    url = await uploadImagem({ buffer, contentType: file.type, slug, tipo });
    log.info("imagem upload", { slug, tipo, size: buffer.byteLength, contentType: file.type });
  } catch (e) {
    const err = e as R2Error;
    log.error("upload R2 falhou", { slug, tipo, code: err.code, msg: err.message });
    return { erro: err.message };
  }

  const campo = tipo === "logo" ? "logoUrl" : "heroImageUrl";
  const antigo = tipo === "logo" ? site.logoUrl : site.heroImageUrl;

  await prisma.site.update({ where: { id: site.id }, data: { [campo]: url } });
  if (antigo) await deletarImagem(antigo);

  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/s/${slug}`);
  return { ok: true, url };
}

export type DominioState =
  | { ok: true; status: string; alvo?: string; detalhe?: string }
  | { ok: false; erro: string }
  | undefined;

export async function salvarDominioProprio(
  slug: string,
  _prev: DominioState,
  formData: FormData,
): Promise<DominioState> {
  const raw = String(formData.get("dominio") ?? "").trim().toLowerCase();
  const dominio = raw.replace(/^https?:\/\//, "").replace(/\/.*/, "");

  if (!dominio) {
    await prisma.site.update({
      where: { slug },
      data: { dominioProprio: null, dominioStatus: "NAO_CADASTRADO", dominioVerifEm: null, cnameAlvo: null },
    });
    revalidatePath(`/admin/${slug}`);
    return { ok: true, status: "removido" };
  }

  if (!validarDominio(dominio)) return { ok: false, erro: "Domínio inválido" };

  const alvo = alvoCNAME();
  const existente = await prisma.site.findFirst({
    where: { dominioProprio: dominio, NOT: { slug } },
    select: { slug: true },
  });
  if (existente) return { ok: false, erro: `Domínio já cadastrado em outro site (${existente.slug})` };

  await prisma.site.update({
    where: { slug },
    data: { dominioProprio: dominio, dominioStatus: "PENDENTE_DNS", cnameAlvo: alvo },
  });
  log.info("dominio cadastrado", { slug, dominio, alvo });
  revalidatePath(`/admin/${slug}`);
  return { ok: true, status: "PENDENTE_DNS" };
}

export async function verificarDominioAcao(slug: string): Promise<DominioState> {
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, dominioProprio: true, cnameAlvo: true },
  });
  if (!site || !site.dominioProprio || !site.cnameAlvo) {
    return { ok: false, erro: "Sem domínio cadastrado" };
  }

  const r = await verificarCname(site.dominioProprio, site.cnameAlvo);
  if (r.ok) {
    await prisma.site.update({
      where: { id: site.id },
      data: { dominioStatus: "VERIFICADO", dominioVerifEm: new Date() },
    });
    log.info("dominio verificado", { slug, dominio: site.dominioProprio, alvo: r.alvo });
    revalidatePath(`/admin/${slug}`);
    return { ok: true, status: "VERIFICADO", alvo: r.alvo };
  }
  await prisma.site.update({
    where: { id: site.id },
    data: { dominioStatus: "FALHA", dominioVerifEm: new Date() },
  });
  log.warn("dominio falhou", { slug, dominio: site.dominioProprio, razao: r.razao, detalhe: r.detalhe });
  revalidatePath(`/admin/${slug}`);
  return { ok: false, erro: razaoMsg(r.razao, r.detalhe) };
}

function razaoMsg(razao: string, detalhe?: string): string {
  switch (razao) {
    case "NXDOMAIN":
      return "Nenhum registro DNS encontrado pra esse domínio";
    case "WRONG_TARGET":
      return `Domínio responde mas aponta pra outro alvo${detalhe ? `: ${detalhe}` : ""}`;
    case "INVALID_DOMAIN":
      return "Domínio em formato inválido";
    case "TIMEOUT":
      return "Timeout consultando DNS, tente novamente";
    default:
      return detalhe ? `DNS: ${detalhe}` : "Falha desconhecida no DNS";
  }
}

export type EmailState =
  | { ok: true; status: string; encontrados?: { exchange: string; priority: number }[] }
  | { ok: false; erro: string; encontrados?: { exchange: string; priority: number }[] }
  | undefined;

export async function salvarEmailComercial(
  slug: string,
  _prev: EmailState,
  formData: FormData,
): Promise<EmailState> {
  const handle = String(formData.get("emailHandle") ?? "").trim().toLowerCase();
  const forwardTo = String(formData.get("emailForwardTo") ?? "").trim().toLowerCase();

  if (!handle && !forwardTo) {
    await prisma.site.update({
      where: { slug },
      data: { emailHandle: null, emailForwardTo: null, emailStatus: "NAO_CONFIGURADO", emailVerifEm: null },
    });
    revalidatePath(`/admin/${slug}`);
    return { ok: true, status: "removido" };
  }
  if (!/^[a-z0-9._-]+$/.test(handle)) return { ok: false, erro: "Handle inválido (use letras, números, ., _, -)" };
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(forwardTo)) return { ok: false, erro: "Email de encaminhamento inválido" };

  await prisma.site.update({
    where: { slug },
    data: {
      emailHandle: handle,
      emailForwardTo: forwardTo,
      emailStatus: "PENDENTE_MX",
      mxRecords: JSON.parse(JSON.stringify(MX_CLOUDFLARE)),
      spfRecord: SPF_CLOUDFLARE,
    },
  });
  log.info("email comercial cadastrado", { slug, handle, forwardTo });
  revalidatePath(`/admin/${slug}`);
  return { ok: true, status: "PENDENTE_MX" };
}

export async function verificarEmailAcao(slug: string): Promise<EmailState> {
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, dominioProprio: true, emailHandle: true },
  });
  if (!site || !site.dominioProprio) return { ok: false, erro: "Cadastre o domínio próprio primeiro" };
  if (!site.emailHandle) return { ok: false, erro: "Cadastre o handle de email primeiro" };

  const r = await verificarMX(site.dominioProprio);
  if (r.ok) {
    await prisma.site.update({
      where: { id: site.id },
      data: { emailStatus: "VERIFICADO", emailVerifEm: new Date() },
    });
    log.info("email MX verificado", { slug, dominio: site.dominioProprio });
    revalidatePath(`/admin/${slug}`);
    return { ok: true, status: "VERIFICADO", encontrados: r.encontrados };
  }
  await prisma.site.update({
    where: { id: site.id },
    data: { emailStatus: "FALHA", emailVerifEm: new Date() },
  });
  log.warn("email MX falhou", { slug, dominio: site.dominioProprio, razao: r.razao });
  revalidatePath(`/admin/${slug}`);
  return {
    ok: false,
    erro:
      r.razao === "NXDOMAIN" ? "Nenhum registro MX encontrado"
      : r.razao === "INCOMPLETO" ? "MX presente mas não bate com Cloudflare Email Routing"
      : "Erro consultando MX",
    encontrados: r.encontrados,
  };
}

export async function removerImagem(slug: string, tipo: "logo" | "hero") {
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { id: true, logoUrl: true, heroImageUrl: true },
  });
  if (!site) return;
  const campo = tipo === "logo" ? "logoUrl" : "heroImageUrl";
  const antigo = tipo === "logo" ? site.logoUrl : site.heroImageUrl;
  await prisma.site.update({ where: { id: site.id }, data: { [campo]: null } });
  if (antigo) await deletarImagem(antigo);
  revalidatePath(`/admin/${slug}`);
  revalidatePath(`/s/${slug}`);
}
