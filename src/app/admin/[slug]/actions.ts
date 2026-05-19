"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateText, LLMError } from "@/lib/llm";
import { uploadImagem, deletarImagem, R2Error } from "@/lib/r2";
import { tituloEmpresa } from "@/lib/site-loader";
import { log } from "@/lib/logger";

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
