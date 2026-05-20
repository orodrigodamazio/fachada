"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup, type AuthState } from "../actions";

function Botao({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-4">
      {isSignup ? (
        <div className="space-y-2">
          <Label htmlFor="nome">Nome (opcional)</Label>
          <Input id="nome" name="nome" autoComplete="name" placeholder="Seu nome" />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder={isSignup ? "Mínimo 8 caracteres" : "Sua senha"}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </div>

      {state?.erro ? (
        <p className="text-sm text-red-600" role="alert">
          {state.erro}
        </p>
      ) : null}

      <Botao
        label={isSignup ? "Criar conta" : "Entrar"}
        pendingLabel={isSignup ? "Criando conta..." : "Entrando..."}
      />

      <p className="text-sm text-zinc-500 text-center">
        {isSignup ? (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="text-zinc-900 underline underline-offset-2">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Ainda não tem conta?{" "}
            <Link href="/signup" className="text-zinc-900 underline underline-offset-2">
              Criar agora
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
