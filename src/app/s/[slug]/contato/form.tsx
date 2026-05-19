"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enviarContato, type ContatoState } from "./actions";

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center h-11 px-6 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Enviando..." : "Enviar mensagem"}
    </button>
  );
}

export function FormContato({ slug }: { slug: string }) {
  const acao = enviarContato.bind(null, slug);
  const [state, action] = useActionState<ContatoState, FormData>(acao, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-6 text-sm">
        {state.mensagem}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Campo rotulo="Nome" name="nome" required maxLength={200} />
      <Campo rotulo="Email" name="email" type="email" maxLength={200} />
      <Campo rotulo="Telefone" name="telefone" type="tel" maxLength={30} />
      <div className="space-y-1.5">
        <label htmlFor="mensagem" className="text-sm font-medium">Mensagem</label>
        <textarea
          id="mensagem"
          name="mensagem"
          required
          maxLength={5000}
          rows={5}
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden
      />
      {state && !state.ok ? (
        <p className="text-sm text-red-600" role="alert">{state.erro}</p>
      ) : null}
      <Botao />
    </form>
  );
}

function Campo({
  rotulo,
  name,
  type = "text",
  required,
  maxLength,
}: {
  rotulo: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {rotulo}{required ? <span className="text-red-500"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
    </div>
  );
}
