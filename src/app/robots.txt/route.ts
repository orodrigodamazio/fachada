import { slugFromHost, urlBaseFromHost } from "@/lib/host-slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const slug = await slugFromHost();
  const base = await urlBaseFromHost();

  const body = slug
    ? `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`
    : `User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
