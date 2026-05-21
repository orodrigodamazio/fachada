"use client";

import { useState } from "react";

export type EmailItem = {
  id: string;
  fromAddr: string;
  toAddr: string;
  subject: string | null;
  texto: string;
  codigo: string | null;
  lido: boolean;
  data: string;
  dataLonga: string;
};

function inicialDe(addr: string) {
  return (addr.trim()[0] || "?").toUpperCase();
}

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function InboxClient({
  emails,
  primaria,
  secundaria,
}: {
  emails: EmailItem[];
  primaria: string;
  secundaria: string;
}) {
  const [selId, setSelId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [copiado, setCopiado] = useState(false);

  const termo = q.trim().toLowerCase();
  const visiveis = termo
    ? emails.filter(
        (e) => e.fromAddr.toLowerCase().includes(termo) || (e.subject || "").toLowerCase().includes(termo),
      )
    : emails;

  const sel = emails.find((e) => e.id === selId) ?? null;
  const avatarBg = { backgroundImage: `linear-gradient(135deg, ${primaria}, ${secundaria})` };

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex border border-zinc-200/80 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.03] h-[600px]">
      {/* Lista (minimizada à esquerda) */}
      <div className={`${sel ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 border-r border-zinc-200 flex-col`}>
        <div className="shrink-0 border-b border-zinc-100 p-2">
          <input
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            placeholder="Filtrar por remetente…"
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 transition-shadow focus:outline-none focus:ring-2 focus:bg-white"
            style={{ ["--tw-ring-color" as string]: alpha(primaria, 0.3) }}
          />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {visiveis.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400 text-center">Nenhum email desse remetente.</p>
          ) : (
            visiveis.map((e) => {
              const ativo = e.id === selId;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelId(e.id)}
                  style={{
                    borderLeft: `3px solid ${ativo ? primaria : "transparent"}`,
                    backgroundColor: ativo ? alpha(primaria, 0.08) : e.lido ? undefined : alpha(primaria, 0.04),
                  }}
                  className={`w-full text-left flex items-start gap-3 px-3 py-3 transition-colors ${ativo ? "" : "hover:bg-zinc-50"}`}
                >
                  <span
                    style={avatarBg}
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold shadow-sm"
                  >
                    {inicialDe(e.fromAddr)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${e.lido ? "text-zinc-700" : "font-semibold text-zinc-900"}`}>
                        {e.fromAddr}
                      </span>
                      <span className="text-[11px] text-zinc-400 shrink-0">{e.data}</span>
                    </div>
                    <div className={`truncate text-sm ${e.lido ? "text-zinc-600" : "font-medium text-zinc-900"}`}>
                      {e.subject || "(sem assunto)"}
                    </div>
                    {e.codigo ? (
                      <span
                        style={{ backgroundColor: alpha(primaria, 0.12), color: primaria }}
                        className="mt-1 inline-block font-mono text-xs font-bold tracking-widest px-1.5 py-0.5 rounded"
                      >
                        {e.codigo}
                      </span>
                    ) : (
                      <p className="truncate text-xs text-zinc-400">{e.texto}</p>
                    )}
                  </div>
                  {!e.lido ? (
                    <span style={{ backgroundColor: primaria }} className="mt-2 h-2 w-2 shrink-0 rounded-full" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Leitura (expande à direita) */}
      <div className={`${sel ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
        {sel ? (
          <>
            <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelId(null)}
                className="md:hidden text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                ← Voltar
              </button>
              <h2 className="text-base font-semibold text-zinc-900 truncate">{sel.subject || "(sem assunto)"}</h2>
            </div>
            <div key={sel.id} className="px-5 py-4 overflow-y-auto space-y-4 animate-inbox-in">
              <div className="flex items-start gap-3">
                <span
                  style={avatarBg}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-semibold shadow-sm"
                >
                  {inicialDe(sel.fromAddr)}
                </span>
                <div className="min-w-0 text-sm">
                  <div className="font-medium text-zinc-900 truncate">{sel.fromAddr}</div>
                  <div className="text-zinc-500 truncate">para {sel.toAddr}</div>
                  <div className="text-xs text-zinc-400">{sel.dataLonga}</div>
                </div>
              </div>

              {sel.codigo ? (
                <div
                  style={{ borderColor: alpha(primaria, 0.35), backgroundColor: alpha(primaria, 0.08) }}
                  className="animate-inbox-pop rounded-xl border px-4 py-3 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <div style={{ color: primaria }} className="text-[11px] uppercase tracking-wide">
                      Código de verificação
                    </div>
                    <div style={{ color: primaria }} className="font-mono text-2xl font-bold tracking-[0.3em] truncate">
                      {sel.codigo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copiarCodigo(sel.codigo!)}
                    style={{ backgroundColor: primaria }}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                  >
                    {copiado ? "Copiado!" : "Copiar código"}
                  </button>
                </div>
              ) : null}

              {sel.texto ? (
                <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{sel.texto}</p>
              ) : (
                <p className="text-sm text-zinc-400 italic">Sem conteúdo de texto.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-400 p-10 text-center">
            Selecione uma mensagem para ler.
          </div>
        )}
      </div>
    </div>
  );
}
