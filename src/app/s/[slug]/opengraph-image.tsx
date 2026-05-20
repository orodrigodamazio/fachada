import { ImageResponse } from "next/og";
import { carregarSitePorSlug, formatarCnpj, tituloEmpresa } from "@/lib/site-loader";
import { paletaDoSite } from "@/lib/palette";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const pal = paletaDoSite(site);
  const endereco = site.endereco as { municipio?: string; uf?: string };
  const cidadeUf = [endereco?.municipio, endereco?.uf].filter(Boolean).join(" / ");

  return new ImageResponse(
    (
      <div
        style={{
          background: pal.primaria,
          backgroundImage: `linear-gradient(135deg, ${pal.primaria} 0%, ${pal.secundaria} 100%)`,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {site.cnaeDescricao ?? "Empresa"}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 1040 }}>
            {titulo}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "rgba(255,255,255,0.82)",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "white", fontSize: 24 }}>{site.razaoSocial}</div>
            <div>{`CNPJ ${formatarCnpj(site.cnpj)}`}</div>
          </div>
          {cidadeUf ? <div>{cidadeUf}</div> : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
