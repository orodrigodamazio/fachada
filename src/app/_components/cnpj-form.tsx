"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarSite, type CriarSiteState } from "../actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? "Consultando Receita..." : "Gerar site"}
    </Button>
  );
}

function formatarCnpjVisual(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function CnpjForm() {
  const [state, action] = useActionState<CriarSiteState, FormData>(criarSite, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          name="cnpj"
          inputMode="numeric"
          autoComplete="off"
          placeholder="00.000.000/0000-00"
          maxLength={18}
          required
          onInput={(e) => {
            const el = e.currentTarget;
            el.value = formatarCnpjVisual(el.value);
          }}
        />
        {state?.erro ? (
          <p className="text-sm text-red-500" role="alert">
            {state.erro}
          </p>
        ) : null}
      </div>
      <Botao />
    </form>
  );
}
