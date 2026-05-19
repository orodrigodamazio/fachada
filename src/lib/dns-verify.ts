import { promises as dns } from "node:dns";

export type DnsCheck =
  | { ok: true; alvo: string; tipo: "CNAME" | "A" }
  | { ok: false; razao: "NXDOMAIN" | "WRONG_TARGET" | "INVALID_DOMAIN" | "TIMEOUT" | "UNKNOWN"; detalhe?: string };

export function validarDominio(dom: string): boolean {
  if (!dom || dom.length > 253) return false;
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(dom)) return false;
  return true;
}

export async function verificarCname(dominio: string, alvoEsperado: string): Promise<DnsCheck> {
  if (!validarDominio(dominio)) return { ok: false, razao: "INVALID_DOMAIN" };

  const resolver = new dns.Resolver({ timeout: 5000, tries: 2 });
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);

  try {
    const cnames = await resolver.resolveCname(dominio).catch(() => null);
    if (cnames && cnames.length > 0) {
      const alvo = cnames[0].toLowerCase().replace(/\.$/, "");
      if (alvo === alvoEsperado.toLowerCase() || alvo.endsWith(`.${alvoEsperado.toLowerCase()}`)) {
        return { ok: true, alvo, tipo: "CNAME" };
      }
      return { ok: false, razao: "WRONG_TARGET", detalhe: alvo };
    }

    const expectedIPs = await resolver.resolve4(alvoEsperado).catch(() => null);
    const actualIPs = await resolver.resolve4(dominio).catch(() => null);
    if (actualIPs && expectedIPs && actualIPs.some((ip) => expectedIPs.includes(ip))) {
      return { ok: true, alvo: actualIPs[0], tipo: "A" };
    }
    if (actualIPs && actualIPs.length > 0) {
      return { ok: false, razao: "WRONG_TARGET", detalhe: actualIPs.join(",") };
    }
    return { ok: false, razao: "NXDOMAIN" };
  } catch (e) {
    const msg = (e as NodeJS.ErrnoException).code ?? (e as Error).message;
    if (msg === "ETIMEOUT") return { ok: false, razao: "TIMEOUT" };
    if (msg === "ENOTFOUND" || msg === "ENODATA") return { ok: false, razao: "NXDOMAIN" };
    return { ok: false, razao: "UNKNOWN", detalhe: String(msg).slice(0, 100) };
  }
}

export function alvoCNAME(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAINS?.split(",")[0]?.trim() ?? "vertentebr.com.br";
}

export const MX_CLOUDFLARE = [
  { hostname: "route1.mx.cloudflare.net", priority: 10 },
  { hostname: "route2.mx.cloudflare.net", priority: 41 },
  { hostname: "route3.mx.cloudflare.net", priority: 92 },
];

export const SPF_CLOUDFLARE = "v=spf1 include:_spf.mx.cloudflare.net ~all";

export type MxCheck =
  | { ok: true; encontrados: { exchange: string; priority: number }[] }
  | { ok: false; razao: "NXDOMAIN" | "INCOMPLETO" | "ERRO"; encontrados?: { exchange: string; priority: number }[]; detalhe?: string };

export async function verificarMX(dominio: string): Promise<MxCheck> {
  if (!validarDominio(dominio)) return { ok: false, razao: "ERRO", detalhe: "domínio inválido" };
  const resolver = new dns.Resolver({ timeout: 5000, tries: 2 });
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);
  try {
    const mx = await resolver.resolveMx(dominio);
    const encontrados = mx.map((m) => ({ exchange: m.exchange.toLowerCase(), priority: m.priority }));
    const esperados = new Set(MX_CLOUDFLARE.map((m) => m.hostname));
    const todosCobertos = [...esperados].every((h) => encontrados.some((e) => e.exchange === h));
    if (todosCobertos) return { ok: true, encontrados };
    return { ok: false, razao: "INCOMPLETO", encontrados };
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") return { ok: false, razao: "NXDOMAIN" };
    return { ok: false, razao: "ERRO", detalhe: String(code ?? (e as Error).message).slice(0, 100) };
  }
}
