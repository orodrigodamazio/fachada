import Image from "next/image";
import { iniciais } from "@/lib/site-loader";

// Mostra o logo enviado; se não houver, gera um selo com as iniciais da empresa
// no degradê da paleta (CSS vars --cor-primaria/--cor-secundaria do layout).
export function LogoMarca({ logoUrl, nome, size = 40 }: { logoUrl?: string | null; nome: string; size?: number }) {
  if (logoUrl) {
    return (
      <Image src={logoUrl} alt={nome} width={size} height={size} className="object-contain rounded" unoptimized />
    );
  }
  return (
    <span
      aria-label={nome}
      className="inline-flex items-center justify-center rounded-md text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, var(--cor-primaria), var(--cor-secundaria))",
        fontSize: Math.round(size * 0.4),
        letterSpacing: 0.5,
      }}
    >
      {iniciais(nome)}
    </span>
  );
}
