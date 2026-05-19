"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { salvarEmailComercial, verificarEmailAcao, type EmailState } from "./actions";

type Props = {
  slug: string;
  dominioVerificado: boolean;
  emailHandle: string | null;
  emailForwardTo: string | null;
  status: string;
  verificadoEm: Date | null;
  dominio: string | null;
};

const MX = [
  { hostname: "route1.mx.cloudflare.net", priority: 10 },
  { hostname: "route2.mx.cloudflare.net", priority: 41 },
  { hostname: "route3.mx.cloudflare.net", priority: 92 },
];
const SPF = "v=spf1 include:_spf.mx.cloudflare.net ~all";

const COR_STATUS: Record<string, string> = {
  NAO_CONFIGURADO: "bg-zinc-200 text-zinc-700",
  PENDENTE_MX: "bg-amber-100 text-amber-800",
  VERIFICADO: "bg-emerald-100 text-emerald-800",
  FALHA: "bg-red-100 text-red-800",
};

const LABEL_STATUS: Record<string, string> = {
  NAO_CONFIGURADO: "Não configurado",
  PENDENTE_MX: "Aguardando DNS",
  VERIFICADO: "Recebendo email",
  FALHA: "Falha",
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

export function EmailForm({ slug, dominioVerificado, emailHandle, emailForwardTo, status, verificadoEm, dominio }: Props) {
  const acao = salvarEmailComercial.bind(null, slug);
  const [state, action] = useActionState<EmailState, FormData>(acao, undefined);
  const [verificando, setVerificando] = useState(false);
  const [resultadoVerif, setResultadoVerif] = useState<EmailState>(undefined);
  const [, startTransition] = useTransition();

  function verificarAgora() {
    setVerificando(true);
    setResultadoVerif(undefined);
    startTransition(async () => {
      const r = await verificarEmailAcao(slug);
      setVerificando(false);
      setResultadoVerif(r);
    });
  }

  if (!dominioVerificado) {
    return (
      <section className="border border-zinc-200 bg-zinc-50 rounded-lg p-5 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Email comercial</h2>
        <p className="text-sm text-zinc-600">
          Para configurar email <code>@dominio.com.br</code>, verifique o domínio próprio acima primeiro.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Email comercial</h2>
        <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium ${COR_STATUS[status] ?? COR_STATUS.NAO_CONFIGURADO}`}>
          {LABEL_STATUS[status] ?? status}
        </span>
      </header>

      <form action={action} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="emailHandle" className="text-sm font-medium">Endereço (sem @)</label>
            <input
              id="emailHandle"
              name="emailHandle"
              defaultValue={emailHandle ?? ""}
              placeholder="contato"
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <p className="text-xs text-zinc-500">Final: {emailHandle ?? "contato"}@{dominio}</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="emailForwardTo" className="text-sm font-medium">Encaminhar para</label>
            <input
              id="emailForwardTo"
              name="emailForwardTo"
              type="email"
              defaultValue={emailForwardTo ?? ""}
              placeholder="seu-email@gmail.com"
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BotaoSalvar />
          {state?.ok ? <span className="text-sm text-emerald-700">Salvo.</span> : null}
          {state && !state.ok ? <span className="text-sm text-red-600">{state.erro}</span> : null}
        </div>
      </form>

      {emailHandle ? (
        <>
          <div className="border-t border-zinc-200 pt-5 space-y-4">
            <p className="text-sm font-medium">Configure no DNS do seu domínio (Cloudflare Email Routing):</p>

            <div className="text-xs space-y-3">
              <p className="font-semibold text-zinc-700">1. MX records (3 registros):</p>
              <div className="overflow-x-auto">
                <table className="text-xs">
                  <thead className="text-zinc-500">
                    <tr><th className="text-left pr-4 pb-1">Tipo</th><th className="text-left pr-4 pb-1">Nome</th><th className="text-left pr-4 pb-1">Prioridade</th><th className="text-left pb-1">Aponta para</th></tr>
                  </thead>
                  <tbody>
                    {MX.map((r) => (
                      <tr key={r.hostname}>
                        <td className="pr-4"><code className="bg-zinc-100 px-1.5 py-0.5 rounded">MX</code></td>
                        <td className="pr-4"><code className="bg-zinc-100 px-1.5 py-0.5 rounded">@</code></td>
                        <td className="pr-4"><code className="bg-zinc-100 px-1.5 py-0.5 rounded">{r.priority}</code></td>
                        <td><code className="bg-zinc-100 px-1.5 py-0.5 rounded">{r.hostname}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="font-semibold text-zinc-700 pt-2">2. TXT (SPF):</p>
              <div className="flex flex-col gap-1">
                <div className="flex gap-3 text-xs">
                  <code className="bg-zinc-100 px-1.5 py-0.5 rounded">TXT</code>
                  <code className="bg-zinc-100 px-1.5 py-0.5 rounded">@</code>
                  <code className="bg-zinc-100 px-1.5 py-0.5 rounded break-all">{SPF}</code>
                </div>
              </div>

              <p className="font-semibold text-zinc-700 pt-2">3. No painel Cloudflare (do domínio):</p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-700">
                <li>Acessar Email → Email Routing → Get started</li>
                <li>Adicionar destination address: <code className="bg-zinc-100 px-1.5 py-0.5 rounded">{emailForwardTo}</code></li>
                <li>Confirmar via email recebido</li>
                <li>Criar rule: <code className="bg-zinc-100 px-1.5 py-0.5 rounded">{emailHandle}@{dominio}</code> → <code className="bg-zinc-100 px-1.5 py-0.5 rounded">{emailForwardTo}</code></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-5">
            <button
              type="button"
              onClick={verificarAgora}
              disabled={verificando}
              className="inline-flex items-center h-9 px-4 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
            >
              {verificando ? "Verificando..." : "Verificar MX agora"}
            </button>
            {verificadoEm ? (
              <p className="text-xs text-zinc-500 mt-2">Última verificação: {verificadoEm.toLocaleString("pt-BR")}</p>
            ) : null}
            {resultadoVerif?.ok ? (
              <div className="mt-3">
                <p className="text-sm text-emerald-700">MX verificado ✓ Email comercial recebendo.</p>
                {resultadoVerif.encontrados ? (
                  <ul className="text-xs text-zinc-600 mt-1">
                    {resultadoVerif.encontrados.map((e, i) => (
                      <li key={i}>{e.priority} {e.exchange}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {resultadoVerif && !resultadoVerif.ok ? (
              <div className="mt-3">
                <p className="text-sm text-red-600">{resultadoVerif.erro}</p>
                {resultadoVerif.encontrados && resultadoVerif.encontrados.length > 0 ? (
                  <p className="text-xs text-zinc-500 mt-1">
                    Encontrados: {resultadoVerif.encontrados.map((e) => `${e.priority} ${e.exchange}`).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
