"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { uploadImagemAction, removerImagem, type UploadState } from "./actions";

function Botao({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center h-9 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Enviando..." : label}
    </button>
  );
}

export function UploadImagem({
  slug,
  tipo,
  rotulo,
  urlAtual,
  aspectRatio,
}: {
  slug: string;
  tipo: "logo" | "hero";
  rotulo: string;
  urlAtual: string | null;
  aspectRatio: "square" | "wide";
}) {
  const acao = uploadImagemAction.bind(null, slug, tipo);
  const [state, action] = useActionState<UploadState, FormData>(acao, undefined);
  const remover = removerImagem.bind(null, slug, tipo);

  const url = state?.url ?? urlAtual;

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{rotulo}</h2>

      {url ? (
        <div className="space-y-3">
          <div
            className={`relative bg-zinc-100 rounded-md overflow-hidden ${
              aspectRatio === "wide" ? "aspect-[3/1]" : "aspect-square w-32"
            }`}
          >
            <Image src={url} alt={rotulo} fill className="object-contain" unoptimized />
          </div>
          <form action={remover}>
            <button
              type="submit"
              className="inline-flex items-center h-8 px-3 rounded-md border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Remover
            </button>
          </form>
        </div>
      ) : null}

      <form action={action} className="space-y-3">
        <input
          type="file"
          name="arquivo"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          required
          className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-100 file:text-zinc-900 file:cursor-pointer hover:file:bg-zinc-200"
        />
        <p className="text-xs text-zinc-500">JPEG, PNG, WebP ou SVG. Máximo 4 MB.</p>
        <Botao label={url ? "Substituir" : "Enviar imagem"} />
        {state?.erro ? <p className="text-sm text-red-600">{state.erro}</p> : null}
      </form>
    </section>
  );
}
