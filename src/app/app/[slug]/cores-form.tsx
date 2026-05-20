"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarCores, resetarCores, type CoresState } from "./actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center h-9 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar cores"}
    </button>
  );
}

function CampoCor({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-zinc-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-zinc-300 bg-white cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="h-9 w-28 rounded-md border border-zinc-300 px-2 text-sm font-mono"
        />
      </div>
    </div>
  );
}

export function CoresForm({
  slug,
  primaria,
  secundaria,
}: {
  slug: string;
  primaria: string;
  secundaria: string;
}) {
  const [state, action] = useActionState<CoresState, FormData>(salvarCores.bind(null, slug), undefined);
  const [p, setP] = useState(primaria);
  const [s, setS] = useState(secundaria);
  const reset = resetarCores.bind(null, slug);

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-4">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Identidade visual</h2>
        <p className="text-xs text-zinc-500">
          As cores da sua empresa no site. Geramos uma paleta inicial automaticamente; ajuste como quiser.
        </p>
      </header>

      <form action={action} className="space-y-4">
        <div className="flex flex-wrap gap-6">
          <CampoCor label="Cor primária" name="corPrimaria" value={p} onChange={setP} />
          <CampoCor label="Cor secundária" name="corSecundaria" value={s} onChange={setS} />
        </div>

        <div className="rounded-md overflow-hidden border border-zinc-200">
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${p}, ${s})` }} />
          <div className="p-4 flex items-center gap-4">
            <span
              className="inline-flex h-9 px-4 items-center rounded-md text-white text-sm font-medium"
              style={{ background: p }}
            >
              Botão
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: p }}>
              Rótulo da seção
            </span>
          </div>
        </div>

        {state?.erro ? <p className="text-sm text-red-600" role="alert">{state.erro}</p> : null}
        {state?.ok ? <p className="text-sm text-emerald-600">Cores salvas.</p> : null}

        <Botao />
      </form>

      <form action={reset}>
        <button type="submit" className="text-xs text-zinc-500 underline underline-offset-2">
          Voltar à paleta automática
        </button>
      </form>
    </section>
  );
}
