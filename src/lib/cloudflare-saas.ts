const API = "https://api.cloudflare.com/client/v4";
const TOKEN = process.env.CF_API_TOKEN ?? "";
const ZONE = process.env.CF_ZONE_ID ?? "";

export class CfSaasError extends Error {
  constructor(message: string, public code: "NO_CONFIG" | "API_ERROR" | "NOT_FOUND") {
    super(message);
    this.name = "CfSaasError";
  }
}

function ensure() {
  if (!TOKEN || !ZONE) throw new CfSaasError("CF_API_TOKEN/CF_ZONE_ID não configurados", "NO_CONFIG");
}

async function cf(path: string, init?: RequestInit) {
  ensure();
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await r.json().catch(() => null)) as { success?: boolean; result?: unknown; errors?: unknown };
  if (!j?.success) {
    throw new CfSaasError(`CF API: ${JSON.stringify(j?.errors).slice(0, 200)}`, "API_ERROR");
  }
  return j.result;
}

export type CustomHostname = {
  id: string;
  hostname: string;
  ssl: { status: string; validation_records?: { txt_name?: string; txt_value?: string }[] };
  status: string;
};

export async function adicionarCustomHostname(dominio: string): Promise<CustomHostname> {
  const existente = await acharCustomHostname(dominio);
  if (existente) return existente;
  return (await cf(`/zones/${ZONE}/custom_hostnames`, {
    method: "POST",
    body: JSON.stringify({
      hostname: dominio,
      // TXT DCV: o cert pode validar via DNS independente do edge estar no caminho.
      // (Para não-wildcard a CF ainda tenta HTTP automático depois que o domínio aponta.)
      ssl: { method: "txt", type: "dv", settings: { min_tls_version: "1.2" } },
    }),
  })) as CustomHostname;
}

export async function acharCustomHostname(dominio: string): Promise<CustomHostname | null> {
  const res = (await cf(`/zones/${ZONE}/custom_hostnames?hostname=${encodeURIComponent(dominio)}`)) as CustomHostname[];
  return res.length > 0 ? res[0] : null;
}

export async function removerCustomHostname(dominio: string): Promise<void> {
  const ch = await acharCustomHostname(dominio);
  if (!ch) return;
  await cf(`/zones/${ZONE}/custom_hostnames/${ch.id}`, { method: "DELETE" });
}

export async function statusCustomHostname(dominio: string): Promise<{ ativo: boolean; sslStatus: string; status: string } | null> {
  const ch = await acharCustomHostname(dominio);
  if (!ch) return null;
  return { ativo: ch.status === "active" && ch.ssl.status === "active", sslStatus: ch.ssl.status, status: ch.status };
}

export type DnsRecord = { tipo: "CNAME" | "TXT"; nome: string; valor: string; descricao: string };

// Records que o cliente precisa criar no DNS dele. Busca do CF (fonte da verdade).
export async function recordsNecessarios(dominio: string): Promise<{ records: DnsRecord[]; ativo: boolean; sslStatus: string }> {
  const raw = (await cf(`/zones/${ZONE}/custom_hostnames?hostname=${encodeURIComponent(dominio)}`)) as Record<string, unknown>[];
  if (!raw.length) return { records: [], ativo: false, sslStatus: "none" };
  const ch = raw[0] as {
    status: string;
    ssl: { status: string; validation_records?: { txt_name?: string; txt_value?: string }[] };
    ownership_verification?: { name?: string; value?: string };
  };

  const records: DnsRecord[] = [];
  const ativo = ch.status === "active" && ch.ssl.status === "active";

  // 1. CNAME sempre (aponta o domínio pro nosso fallback)
  records.push({
    tipo: "CNAME",
    nome: dominio,
    valor: fallbackTarget(),
    descricao: "Aponta seu domínio para o servidor",
  });

  // 2. TXT ownership (se o CF ainda pede)
  if (!ativo && ch.ownership_verification?.name && ch.ownership_verification?.value) {
    records.push({
      tipo: "TXT",
      nome: ch.ownership_verification.name,
      valor: ch.ownership_verification.value,
      descricao: "Comprova que o domínio é seu",
    });
  }

  // 3. TXT de validação SSL (se o CF ainda pede)
  for (const vr of ch.ssl.validation_records ?? []) {
    if (!ativo && vr.txt_name && vr.txt_value) {
      records.push({
        tipo: "TXT",
        nome: vr.txt_name,
        valor: vr.txt_value,
        descricao: "Libera a emissão do certificado SSL",
      });
    }
  }

  return { records, ativo, sslStatus: ch.ssl.status };
}

export function fallbackTarget(): string {
  return process.env.CF_SAAS_FALLBACK ?? "";
}

export function saasConfigurado(): boolean {
  return Boolean(TOKEN && ZONE && process.env.CF_SAAS_FALLBACK);
}
