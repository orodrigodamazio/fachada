"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { salvarDominioProprio, verificarDominioAcao, type DominioState } from "./actions";

type Props = {
  slug: string;
  dominioAtual: string | null;
  status: string;
  alvoCname: string | null;
  verificadoEm: Date | null;
};

function BotaoSalvar() {
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

const COR_STATUS: Record<string, string> = {
  NAO_CADASTRADO: "bg-zinc-200 text-zinc-700",
  PENDENTE_DNS: "bg-amber-100 text-amber-800",
  VERIFICADO: "bg-emerald-100 text-emerald-800",
  FALHA: "bg-red-100 text-red-800",
};

const LABEL_STATUS: Record<string, string> = {
  NAO_CADASTRADO: "Não cadastrado",
  PENDENTE_DNS: "Aguardando DNS",
  VERIFICADO: "Verificado",
  FALHA: "Falha",
};

export function DominioForm({ slug, dominioAtual, status, alvoCname, verificadoEm }: Props) {
  const acao = salvarDominioProprio.bind(null, slug);
  const [state, action] = useActionState<DominioState, FormData>(acao, undefined);
  const [verificando, setVerificando] = useState(false);
  const [resultadoVerif, setResultadoVerif] = useState<DominioState>(undefined);
  const [, startTransition] = useTransition();

  function verificarAgora() {
    setVerificando(true);
    setResultadoVerif(undefined);
    startTransition(async () => {
      const r = await verificarDominioAcao(slug);
      setVerificando(false);
      setResultadoVerif(r);
    });
  }

  const cnameMostrar = alvoCname ?? "vertentebr.com.br";

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Domínio próprio</h2>
        <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium ${COR_STATUS[status] ?? COR_STATUS.NAO_CADASTRADO}`}>
          {LABEL_STATUS[status] ?? status}
        </span>
      </header>

      <form action={action} className="space-y-3">
        <label htmlFor="dominio" className="text-sm font-medium block">URL do domínio (sem https://)</label>
        <input
          id="dominio"
          name="dominio"
          defaultValue={dominioAtual ?? ""}
          placeholder="ex: empresa.com.br"
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <div className="flex items-center gap-3">
          <BotaoSalvar />
          {state?.ok ? <span className="text-sm text-emerald-700">Salvo. {state.status === "removido" ? "Domínio removido." : "Configure DNS abaixo."}</span> : null}
          {state && !state.ok ? <span className="text-sm text-red-600">{state.erro}</span> : null}
        </div>
      </form>

      {dominioAtual ? (
        <>
          <div className="border-t border-zinc-200 pt-5 space-y-3">
            <p className="text-sm font-medium">Configure este registro no DNS do seu domínio:</p>
            <div className="overflow-x-auto">
              <table className="text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="text-left pr-6 pb-2">Tipo</th>
                    <th className="text-left pr-6 pb-2">Nome</th>
                    <th className="text-left pb-2">Aponta para</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-6"><code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">CNAME</code></td>
                    <td className="pr-6"><code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">@</code> ou <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{dominioAtual.split(".")[0]}</code></td>
                    <td><code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{cnameMostrar}</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-zinc-500">Propagação geralmente leva de 5 minutos a 24h. Domínios .com.br via Registro.br costumam levar 30min.</p>
          </div>

          <div className="border-t border-zinc-200 pt-5">
            <button
              type="button"
              onClick={verificarAgora}
              disabled={verificando}
              className="inline-flex items-center h-9 px-4 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
            >
              {verificando ? "Verificando..." : "Verificar DNS agora"}
            </button>
            {verificadoEm ? (
              <p className="text-xs text-zinc-500 mt-2">Última verificação: {verificadoEm.toLocaleString("pt-BR")}</p>
            ) : null}
            {resultadoVerif?.ok ? (
              <p className="text-sm text-emerald-700 mt-3">
                DNS verificado ✓ {resultadoVerif.alvo ? `aponta para ${resultadoVerif.alvo}` : ""}
              </p>
            ) : null}
            {resultadoVerif && !resultadoVerif.ok ? (
              <p className="text-sm text-red-600 mt-3">{resultadoVerif.erro}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
