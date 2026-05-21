"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarContatoRedes, type ContatoState } from "./actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center h-9 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar contato e redes"}
    </button>
  );
}

type Defaults = {
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  horarioAtend: string | null;
};

export function ContatoForm({ slug, defaults }: { slug: string; defaults: Defaults }) {
  const [state, action] = useActionState<ContatoState, FormData>(salvarContatoRedes.bind(null, slug), undefined);

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Contato e redes</h2>
        <p className="text-xs text-zinc-500">Aparecem no rodapé e na seção de contato do site. Quanto mais completo, mais confiança.</p>
      </header>

      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">Telefone / WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={defaults.whatsapp ?? ""} placeholder="(11) 99999-9999" />
          <p className="text-xs text-zinc-400">É o mesmo número no site e no botão de WhatsApp.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail de contato</Label>
          <Input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} placeholder="contato@suaempresa.com.br" />
          <p className="text-xs text-zinc-400">Aparece no site para os clientes.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram</Label>
          <Input id="instagram" name="instagram" defaultValue={defaults.instagram ?? ""} placeholder="@suaempresa" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="facebook">Facebook</Label>
          <Input id="facebook" name="facebook" defaultValue={defaults.facebook ?? ""} placeholder="suaempresa ou URL" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input id="linkedin" name="linkedin" defaultValue={defaults.linkedin ?? ""} placeholder="company/suaempresa ou URL" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="horarioAtend">Horário de atendimento</Label>
          <Input id="horarioAtend" name="horarioAtend" defaultValue={defaults.horarioAtend ?? ""} placeholder="Seg a Sex, das 9h às 18h" />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <Botao />
          {state?.ok ? <span className="text-sm text-emerald-600">Salvo.</span> : null}
          {state?.erro ? <span className="text-sm text-red-600">{state.erro}</span> : null}
        </div>
      </form>
    </section>
  );
}
