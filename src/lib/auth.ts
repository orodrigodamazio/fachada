import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser, type SessionUser } from "@/lib/session";

export type { SessionUser };

export const getCurrentUser = cache(getSessionUser);

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/app");
  return user;
}

// Authz para páginas: garante que o usuário logado pode ver/editar o site.
// ADMIN acessa qualquer site; usuário comum só os próprios. Caso contrário, 404.
export async function siteParaUsuario(slug: string) {
  const user = await requireUser();
  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { leads: true } },
    },
  });
  if (!site) notFound();
  if (user.role !== "ADMIN" && site.userId !== user.id) notFound();
  return { site, user };
}

// Authz para server actions de mutação: lança se não autorizado.
export async function garantirAcessoAoSite(slug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sessão expirada.");
  if (user.role === "ADMIN") return;
  const site = await prisma.site.findUnique({ where: { slug }, select: { userId: true } });
  if (!site || site.userId !== user.id) throw new Error("Acesso negado a este site.");
}
