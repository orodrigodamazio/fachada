import { slugFromHost, urlBaseFromHost } from "@/lib/host-slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const slug = await slugFromHost();
  const base = await urlBaseFromHost();
  const isAdmin = base.includes("admin.");

  if (isAdmin) {
    return new Response(`User-agent: *\nDisallow: /\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /preview/

Sitemap: ${base}/sitemap.xml
${slug ? "" : "# Apex sitemap lista todos os sites públicos.\n"}`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
