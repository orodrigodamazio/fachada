"use client";

import { useActionState, useState } from "react";
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
  const [nomeArquivo, setNomeArquivo] = useState("");

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
        <label className="flex flex-col items-center justify-center gap-1.5 w-full rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 cursor-pointer text-center hover:border-zinc-400 hover:bg-zinc-100 transition-colors">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-sm font-medium text-zinc-700">{nomeArquivo || "Clique para escolher uma imagem"}</span>
          <span className="text-xs text-zinc-500">JPEG, PNG, WebP ou SVG · máx 4 MB</span>
          <input
            type="file"
            name="arquivo"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            required
            onChange={(e) => setNomeArquivo(e.target.files?.[0]?.name ?? "")}
            className="hidden"
          />
        </label>
        <div className="flex items-center gap-3">
          <Botao label={url ? "Substituir" : "Enviar imagem"} />
          {state?.erro ? <p className="text-sm text-red-600">{state.erro}</p> : null}
        </div>
      </form>
    </section>
  );
}
