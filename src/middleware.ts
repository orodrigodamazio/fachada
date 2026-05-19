import { NextRequest, NextResponse } from "next/server";

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

const ADMIN_USER = process.env.ADMIN_USER ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function challenge() {
  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Fachada Admin", charset="UTF-8"' },
  });
}

function checkAdminAuth(authHeader: string | null): boolean {
  if (!ADMIN_USER || !ADMIN_PASSWORD) return false;
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authHeader.slice(6));
    const sep = decoded.indexOf(":");
    if (sep < 0) return false;
    const u = decoded.slice(0, sep);
    const p = decoded.slice(sep + 1);
    return timingSafeEqual(u, ADMIN_USER) && timingSafeEqual(p, ADMIN_PASSWORD);
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host) return NextResponse.next();

  const pathname = req.nextUrl.pathname;
  const isAdminHost = host.startsWith("admin.");
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminHost || isAdminPath) {
    if (!checkAdminAuth(req.headers.get("authorization"))) return challenge();
  }

  if (APP_HOSTS.has(host)) return NextResponse.next();
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return NextResponse.next();

  const sub = matchSub(host);
  if (!sub) return NextResponse.next();

  const url = req.nextUrl.clone();
  const PASS_THROUGH = ["/sitemap.xml", "/robots.txt"];
  if (
    url.pathname.startsWith("/s/") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    PASS_THROUGH.includes(url.pathname)
  ) {
    return NextResponse.next();
  }
  url.pathname = `/s/${sub}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
