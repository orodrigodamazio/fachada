import { prisma } from "@/lib/prisma";
import { slugFromHost, urlBaseFromHost } from "@/lib/host-slug";

export const dynamic = "force-dynamic";

const ROOTS = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  const slug = await slugFromHost();
  const base = await urlBaseFromHost();

  if (slug) return sitemapSubdomain(base, slug);
  return sitemapApex(base);
}

async function sitemapSubdomain(base: string, slug: string): Promise<Response> {
  const site = await prisma.site.findUnique({
    where: { slug },
    select: { updatedAt: true, ativo: true },
  });
  if (!site || !site.ativo) return new Response("", { status: 404 });

  const lastmod = site.updatedAt.toISOString();
  const paths = ["", "/sobre", "/servicos", "/contato", "/privacidade", "/termos"];

  return xmlResponse(
    paths.map((p) => urlEntry(`${base}${p || "/"}`, lastmod, p === "" ? "1.0" : "0.7", "monthly")),
  );
}

async function sitemapApex(base: string): Promise<Response> {
  const sites = await prisma.site.findMany({
    where: { ativo: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const root = ROOTS[0] ?? base.replace(/^https?:\/\//, "");

  const entries: string[] = [
    urlEntry(base + "/", new Date().toISOString(), "1.0", "weekly"),
    urlEntry(`${base}/status`, new Date().toISOString(), "0.3", "weekly"),
  ];

  for (const s of sites) {
    entries.push(urlEntry(`https://${s.slug}.${root}/`, s.updatedAt.toISOString(), "0.8", "monthly"));
  }

  return xmlResponse(entries);
}

function urlEntry(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function xmlResponse(entries: string[]): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "s-maxage=3600" },
  });
}
