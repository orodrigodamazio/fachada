"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export type AuthState = { erro?: string } | undefined;

const emailSchema = z.string().trim().toLowerCase().email("E-mail inválido");
const senhaSchema = z.string().min(8, "A senha precisa de ao menos 8 caracteres").max(200);

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await clientIp();
  const rl = rateLimit(`signup:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) return { erro: `Muitas tentativas. Aguarde ${rl.retryAfterSec}s.` };

  const email = emailSchema.safeParse(formData.get("email"));
  const senha = senhaSchema.safeParse(formData.get("senha"));
  const nomeRaw = String(formData.get("nome") ?? "").trim();

  if (!email.success) return { erro: email.error.issues[0].message };
  if (!senha.success) return { erro: senha.error.issues[0].message };

  const existente = await prisma.user.findUnique({ where: { email: email.data }, select: { id: true } });
  if (existente) return { erro: "Já existe uma conta com esse e-mail." };

  const passwordHash = await hashPassword(senha.data);
  const user = await prisma.user.create({
    data: { email: email.data, passwordHash, nome: nomeRaw || null },
    select: { id: true },
  });

  log.info("user criado", { userId: user.id });
  await createSession(user.id);
  redirect("/app");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await clientIp();
  const email = emailSchema.safeParse(formData.get("email"));
  const senhaRaw = String(formData.get("senha") ?? "");

  const rl = rateLimit(`login:${ip}`, 10, 15 * 60_000);
  if (!rl.ok) return { erro: `Muitas tentativas. Aguarde ${rl.retryAfterSec}s.` };

  if (!email.success || !senhaRaw) return { erro: "E-mail ou senha inválidos." };

  const user = await prisma.user.findUnique({
    where: { email: email.data },
    select: { id: true, passwordHash: true },
  });

  const ok = user ? await verifyPassword(senhaRaw, user.passwordHash) : false;
  if (!user || !ok) return { erro: "E-mail ou senha inválidos." };

  await createSession(user.id);
  redirect("/app");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
