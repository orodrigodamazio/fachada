// Identidade visual: cada empresa recebe uma paleta própria, derivada de forma
// determinística do nome + CNPJ (mesma empresa => mesma cor sempre) e ajustável no painel.

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// h: 0-360, s/l: 0-100. Retorna hex #rrggbb.
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export type Paleta = { primaria: string; secundaria: string };

// Primária escura o suficiente (L=38%) pra texto branco passar contraste AA.
export function gerarPaletaSeed(seed: string): Paleta {
  const h = hashString(seed) % 360;
  return {
    primaria: hslToHex(h, 62, 38),
    secundaria: hslToHex((h + 26) % 360, 58, 47),
  };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
export const corValida = (c: string | null | undefined): c is string => !!c && HEX.test(c);

export function paletaDoSite(site: {
  corPrimaria?: string | null;
  corSecundaria?: string | null;
  razaoSocial: string;
  cnpj: string;
}): Paleta {
  const base = gerarPaletaSeed(`${site.razaoSocial}|${site.cnpj}`);
  return {
    primaria: corValida(site.corPrimaria) ? site.corPrimaria : base.primaria,
    secundaria: corValida(site.corSecundaria) ? site.corSecundaria : base.secundaria,
  };
}
