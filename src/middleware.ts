import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "fachada_session";

const ROOT_DOMAINS = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fachada.local")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const APP_HOSTS = new Set(
  (process.env.NEXT_PUBLIC_APP_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

const RESERVED = new Set(["www", "admin", "api", ""]);

function matchSub(host: string): string | null {
  for (const root of ROOT_DOMAINS) {
    if (host === root || host === `www.${root}`) return null;
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -1 * (root.length + 1));
      if (RESERVED.has(sub) || sub.includes(".")) return null;
      return sub;
    }
  }
  return null;
}

function needsAuth(pathname: string): boolean {
  return (
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host) return NextResponse.next();

  const pathname = req.nextUrl.pathname;

  // Gate otimista de autenticação (presença do cookie). A verificação real
  // — sessão válida no banco e role — acontece no DAL (requireUser/requireAdmin).
  if (needsAuth(pathname)) {
    if (!req.cookies.get(SESSION_COOKIE)?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (APP_HOSTS.has(host)) return NextResponse.next();
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return NextResponse.next();

  const isAdminHost = ROOT_DOMAINS.some((r) => host === `admin.${r}`);
  const isKnownRoot = ROOT_DOMAINS.some((r) => host === r || host === `www.${r}`);
  if (isAdminHost || isKnownRoot) return NextResponse.next();

  const url = req.nextUrl.clone();
  const PASS_THROUGH = ["/sitemap.xml", "/robots.txt", "/status"];
  if (
    url.pathname.startsWith("/s/") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    PASS_THROUGH.includes(url.pathname)
  ) {
    return NextResponse.next();
  }

  // subdomínio do nosso domínio → /s/<sub>
  const sub = matchSub(host);
  if (sub) {
    url.pathname = `/s/${sub}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  // domínio próprio do cliente (Cloudflare for SaaS) → /s/<host>, loader resolve por dominioProprio
  if (host.includes(".")) {
    url.pathname = `/s/${encodeURIComponent(host)}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
