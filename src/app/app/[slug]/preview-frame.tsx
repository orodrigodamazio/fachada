"use client";

import { useState } from "react";

export function PreviewFrame({ slug }: { slug: string }) {
  const [mobile, setMobile] = useState(false);
  const [key, setKey] = useState(0);

  const btn = (ativo: boolean) =>
    `inline-flex items-center h-8 px-3 rounded-md text-xs font-medium border ${
      ativo ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
    }`;

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-3">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Pré-visualização</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMobile(false)} className={btn(!mobile)}>Desktop</button>
          <button type="button" onClick={() => setMobile(true)} className={btn(mobile)}>Mobile</button>
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            className="inline-flex items-center h-8 px-3 rounded-md text-xs font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          >
            Atualizar
          </button>
        </div>
      </header>
      <div className="bg-zinc-100 rounded-md p-3 flex justify-center overflow-auto">
        <iframe
          key={key}
          src={`/s/${slug}`}
          title="Pré-visualização do site"
          className="bg-white border border-zinc-200 rounded shadow-sm shrink-0"
          style={{ width: mobile ? 360 : "100%", height: 520, maxWidth: "100%" }}
        />
      </div>
      <p className="text-xs text-zinc-500">Prévia ao vivo. Salve as alterações nos blocos abaixo e clique em Atualizar pra ver.</p>
    </section>
  );
}
