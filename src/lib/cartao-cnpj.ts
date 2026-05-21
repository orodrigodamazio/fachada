import { extractText, getDocumentProxy } from "unpdf";
import type { ReceitaResponse } from "./cnpj";
import { limparCnpj, validarCnpj } from "./cnpj";

export class CartaoCnpjError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartaoCnpjError";
  }
}

// Rótulos do "Comprovante de Inscrição e de Situação Cadastral" (IN RFB 2.119),
// na ordem em que aparecem. Servem de delimitadores: o valor de um campo é o
// texto entre o fim do seu rótulo e o início do próximo rótulo encontrado.
const CAMPOS: { k: string; label: string }[] = [
  { k: "inscricao", label: "NÚMERO DE INSCRIÇÃO" },
  { k: "_titulo", label: "COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO CADASTRAL" },
  { k: "abertura", label: "DATA DE ABERTURA" },
  { k: "nome", label: "NOME EMPRESARIAL" },
  { k: "fantasia", label: "TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA)" },
  { k: "porte", label: "PORTE" },
  { k: "cnaePrincipal", label: "CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL" },
  { k: "cnaeSec", label: "CÓDIGO E DESCRIÇÃO DAS ATIVIDADES ECONÔMICAS SECUNDÁRIAS" },
  { k: "natureza", label: "CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA" },
  { k: "logradouro", label: "LOGRADOURO" },
  { k: "numero", label: "NÚMERO" },
  { k: "complemento", label: "COMPLEMENTO" },
  { k: "cep", label: "CEP" },
  { k: "bairro", label: "BAIRRO/DISTRITO" },
  { k: "municipio", label: "MUNICÍPIO" },
  { k: "uf", label: "UF" },
  { k: "email", label: "ENDEREÇO ELETRÔNICO" },
  { k: "telefone", label: "TELEFONE" },
  { k: "efr", label: "ENTE FEDERATIVO RESPONSÁVEL (EFR)" },
  { k: "situacao", label: "SITUAÇÃO CADASTRAL" },
  { k: "dataSituacao", label: "DATA DA SITUAÇÃO CADASTRAL" },
  { k: "motivo", label: "MOTIVO DE SITUAÇÃO CADASTRAL" },
  { k: "situacaoEspecial", label: "SITUAÇÃO ESPECIAL" },
  { k: "dataEspecial", label: "DATA DA SITUAÇÃO ESPECIAL" },
  { k: "_fim", label: "Aprovado pela Instrução Normativa" },
];

function nulo(v: string | undefined | null): string | null {
  if (!v) return null;
  const t = v.trim();
  if (!t || /^\*+$/.test(t)) return null;
  return t;
}

function dataIso(v: string | null): string | null {
  if (!v) return null;
  const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function porteDescricao(porte: string | null): string | null {
  if (!porte) return null;
  const p = porte.toUpperCase();
  if (p === "ME") return "Microempresa";
  if (p === "EPP") return "Empresa de Pequeno Porte";
  if (p.includes("DEMAIS")) return "Demais";
  return porte;
}

function partirCnae(v: string | null): { codigo: number | null; descricao: string | null } {
  if (!v) return { codigo: null, descricao: null };
  const m = v.match(/^([\d.\-/]+)\s*-\s*([\s\S]+)$/);
  if (!m) return { codigo: null, descricao: v.trim() || null };
  const codigo = Number(limparCnpj(m[1]));
  return { codigo: Number.isFinite(codigo) && codigo > 0 ? codigo : null, descricao: m[2].trim() };
}

function partirSecundarios(v: string | null): Array<{ codigo: number; descricao: string }> {
  if (!v) return [];
  const re = /(\d{2}\.\d{2}-\d-\d{2})\s*-\s*([\s\S]+?)(?=\s*\d{2}\.\d{2}-\d-\d{2}\s*-|$)/g;
  const out: Array<{ codigo: number; descricao: string }> = [];
  for (const m of v.matchAll(re)) {
    const codigo = Number(m[1].replace(/\D/g, ""));
    const descricao = m[2].trim().replace(/\s+/g, " ");
    if (Number.isFinite(codigo) && descricao) out.push({ codigo, descricao });
  }
  return out;
}

function fatiar(texto: string): Record<string, string> {
  const achados: { k: string; ini: number; fim: number }[] = [];
  let cursor = 0;
  for (const c of CAMPOS) {
    const pos = texto.indexOf(c.label, cursor);
    if (pos >= 0) {
      achados.push({ k: c.k, ini: pos + c.label.length, fim: pos });
      cursor = pos + c.label.length;
    }
  }
  const val: Record<string, string> = {};
  for (let i = 0; i < achados.length; i++) {
    const inicio = achados[i].ini;
    const fim = i + 1 < achados.length ? achados[i + 1].fim : texto.length;
    val[achados[i].k] = texto.slice(inicio, fim).trim();
  }
  return val;
}

export async function extrairTextoPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return String(text).replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** Converte um cartão CNPJ (PDF da Receita) no mesmo shape de consultarCnpj. */
export async function parseCartaoCnpj(bytes: Uint8Array): Promise<ReceitaResponse> {
  let texto: string;
  try {
    texto = await extrairTextoPdf(bytes);
  } catch {
    throw new CartaoCnpjError("Não consegui ler o PDF. Envie o cartão CNPJ original da Receita.");
  }

  if (!texto.includes("NÚMERO DE INSCRIÇÃO") || !texto.includes("CADASTRO NACIONAL DA PESSOA")) {
    throw new CartaoCnpjError("Esse PDF não parece o cartão CNPJ da Receita. Baixe em solucoes.receita.fazenda.gov.br.");
  }

  const v = fatiar(texto);

  const cnpjMatch = (v.inscricao || "").match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
  const cnpj = cnpjMatch ? limparCnpj(cnpjMatch[1]) : "";
  if (!validarCnpj(cnpj)) {
    throw new CartaoCnpjError("Não encontrei um CNPJ válido no cartão.");
  }

  const principal = partirCnae(nulo(v.cnaePrincipal));
  const natureza = nulo(v.natureza);

  return {
    cnpj,
    razao_social: nulo(v.nome) ?? "",
    nome_fantasia: nulo(v.fantasia),
    capital_social: null, // não consta no comprovante
    data_inicio_atividade: dataIso(nulo(v.abertura)),
    cnae_fiscal: principal.codigo,
    cnae_fiscal_descricao: principal.descricao,
    cnaes_secundarios: partirSecundarios(nulo(v.cnaeSec)),
    logradouro: nulo(v.logradouro),
    numero: nulo(v.numero),
    complemento: nulo(v.complemento),
    bairro: nulo(v.bairro),
    municipio: nulo(v.municipio),
    uf: nulo(v.uf),
    cep: v.cep ? limparCnpj(v.cep) || null : null,
    ddd_telefone_1: v.telefone ? v.telefone.replace(/\D/g, "") || null : null,
    email: nulo(v.email)?.toLowerCase() ?? null,
    qsa: [], // sócios não constam no comprovante
    porte: nulo(v.porte),
    descricao_porte: porteDescricao(nulo(v.porte)),
    natureza_juridica: natureza,
  };
}
