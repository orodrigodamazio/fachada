import { ImageResponse } from "next/og";
import { carregarSitePorSlug, formatarCnpj, tituloEmpresa } from "@/lib/site-loader";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          backgroundImage: "linear-gradient(135deg, #18181b 0%, #0a0a0a 100%)",
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
              color: "#a1a1aa",
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
            color: "#a1a1aa",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "white", fontSize: 24 }}>{site.razaoSocial}</div>
            <div>CNPJ {formatarCnpj(site.cnpj)}</div>
          </div>
          {(site.endereco as { municipio?: string; uf?: string })?.municipio ? (
            <div>
              {(site.endereco as { municipio: string }).municipio} /{" "}
              {(site.endereco as { uf?: string }).uf ?? ""}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
