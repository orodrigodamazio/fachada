"use client";

import { useState } from "react";

export function CopyEmail({ endereco }: { endereco: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white pl-3 pr-1.5 py-1.5 max-w-full">
      <code className="text-sm text-zinc-700 truncate">{endereco}</code>
      <button
        type="button"
        onClick={copiar}
        className="shrink-0 inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
      >
        {copiado ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
