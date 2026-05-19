import { prisma } from "@/lib/prisma";
import { slugFromHost, urlBaseFromHost } from "@/lib/host-slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const slug = await slugFromHost();
  if (!slug) return new Response("", { status: 404 });

  const site = await prisma.site.findUnique({
    where: { slug },
    select: { updatedAt: true, ativo: true },
  });
  if (!site || !site.ativo) return new Response("", { status: 404 });

  const base = await urlBaseFromHost();
  const lastmod = site.updatedAt.toISOString();
  const paths = ["", "/sobre", "/servicos", "/contato", "/privacidade", "/termos"];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (p) => `  <url>
    <loc>${base}${p || "/"}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${p === "" ? "1.0" : "0.7"}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
