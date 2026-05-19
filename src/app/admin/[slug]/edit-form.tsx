"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarTextos, type EditState } from "./actions";

type Defaults = Partial<{
  heroTitulo: string | null;
  heroSubtitulo: string | null;
  sobre: string | null;
  missao: string | null;
  visao: string | null;
  rodape: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}>;

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center h-10 px-5 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export function EditForm({ slug, defaults }: { slug: string; defaults: Defaults }) {
  const acao = salvarTextos.bind(null, slug);
  const [state, action] = useActionState<EditState, FormData>(acao, undefined);

  return (
    <form action={action} className="space-y-6">
      <Bloco titulo="Hero">
        <Texto name="heroTitulo" rotulo="Título do hero" defaultValue={defaults.heroTitulo} placeholder="Ex: Soluções de tecnologia com presença em todo o país" />
        <Area name="heroSubtitulo" rotulo="Subtítulo do hero" defaultValue={defaults.heroSubtitulo} rows={3} />
      </Bloco>

      <Bloco titulo="Sobre a empresa">
        <Area name="sobre" rotulo="Sobre" defaultValue={defaults.sobre} rows={6} />
        <Area name="missao" rotulo="Missão" defaultValue={defaults.missao} rows={3} />
        <Area name="visao" rotulo="Visão" defaultValue={defaults.visao} rows={3} />
      </Bloco>

      <Bloco titulo="Rodapé">
        <Area name="rodape" rotulo="Texto do rodapé" defaultValue={defaults.rodape} rows={3} />
      </Bloco>

      <Bloco titulo="SEO">
        <Texto name="metaTitle" rotulo="Título da aba (title)" defaultValue={defaults.metaTitle} maxLength={70} />
        <Area name="metaDescription" rotulo="Descrição (meta description)" defaultValue={defaults.metaDescription} rows={2} maxLength={160} />
      </Bloco>

      <div className="flex items-center gap-4">
        <Save />
        {state?.ok ? <span className="text-sm text-emerald-700">Salvo.</span> : null}
        {state?.erro ? <span className="text-sm text-red-600">{state.erro}</span> : null}
      </div>
    </form>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{titulo}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Texto({
  name,
  rotulo,
  defaultValue,
  placeholder,
  maxLength,
}: {
  name: string;
  rotulo: string;
  defaultValue?: string | null;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{rotulo}</label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
    </div>
  );
}

function Area({
  name,
  rotulo,
  defaultValue,
  rows = 4,
  maxLength,
}: {
  name: string;
  rotulo: string;
  defaultValue?: string | null;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{rotulo}</label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
    </div>
  );
}
