import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fachada.local";
const APP_HOSTS = new Set(
  (process.env.NEXT_PUBLIC_APP_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
);

function isReservedSubdomain(sub: string) {
  return ["www", "admin", "api", ""].includes(sub);
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host) return NextResponse.next();

  if (APP_HOSTS.has(host)) return NextResponse.next();

  const root = ROOT_DOMAIN.toLowerCase();
  if (host === root || host === `www.${root}`) return NextResponse.next();

  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return NextResponse.next();
  }

  if (!host.endsWith(`.${root}`)) return NextResponse.next();

  const sub = host.slice(0, -1 * (root.length + 1));
  if (isReservedSubdomain(sub) || sub.includes(".")) return NextResponse.next();

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
