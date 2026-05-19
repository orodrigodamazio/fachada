export type ReceitaResponse = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  capital_social: number | null;
  data_inicio_atividade: string | null;
  cnae_fiscal: number | null;
  cnae_fiscal_descricao: string | null;
  cnaes_secundarios: Array<{ codigo: number; descricao: string }>;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  ddd_telefone_1: string | null;
  email: string | null;
  qsa: Array<{
    nome_socio: string;
    qualificacao_socio: string;
    data_entrada_sociedade: string | null;
  }>;
  porte: string | null;
  descricao_porte: string | null;
  natureza_juridica: string | null;
};

export class CnpjError extends Error {
  constructor(message: string, public code: "INVALIDO" | "NAO_ENCONTRADO" | "RATE_LIMIT" | "API_FORA" | "DESCONHECIDO") {
    super(message);
    this.name = "CnpjError";
  }
}

export function limparCnpj(input: string): string {
  return input.replace(/\D/g, "");
}

export function validarCnpj(cnpj: string): boolean {
  const c = limparCnpj(cnpj);
  if (c.length !== 14) return false;
  if (/^(\d)\1+$/.test(c)) return false;

  const calcDigito = (base: string, pesos: number[]) => {
    const soma = base.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, ...pesos1];
  const d1 = calcDigito(c.slice(0, 12), pesos1);
  const d2 = calcDigito(c.slice(0, 12) + d1, pesos2);
  return d1 === Number(c[12]) && d2 === Number(c[13]);
}

export function formatarCnpj(cnpj: string): string {
  const c = limparCnpj(cnpj);
  return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export async function consultarCnpj(cnpj: string): Promise<ReceitaResponse> {
  const c = limparCnpj(cnpj);
  if (!validarCnpj(c)) throw new CnpjError("CNPJ inválido", "INVALIDO");

  let res: Response;
  try {
    res = await fetch(`https://minhareceita.org/${c}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CnpjError("Falha ao acessar Minha Receita", "API_FORA");
  }

  if (res.status === 404) throw new CnpjError("CNPJ não encontrado na Receita", "NAO_ENCONTRADO");
  if (res.status === 429) throw new CnpjError("Rate limit Minha Receita", "RATE_LIMIT");
  if (!res.ok) throw new CnpjError(`Resposta ${res.status}`, "DESCONHECIDO");

  return res.json() as Promise<ReceitaResponse>;
}

export function gerarSlug(razao: string, cnpj: string): string {
  const base = razao
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const tail = limparCnpj(cnpj).slice(-6);
  return `${base}-${tail}`;
}
