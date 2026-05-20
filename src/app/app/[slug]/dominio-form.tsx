"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { salvarDominioProprio, verificarDominioAcao, obterRecordsDominio, type DominioState } from "./actions";

type DnsRecord = { tipo: string; nome: string; valor: string; descricao: string };

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
    <button type="submit" disabled={pending}
      className="inline-flex items-center h-10 px-5 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

const COR: Record<string, string> = {
  NAO_CADASTRADO: "bg-zinc-200 text-zinc-700",
  PENDENTE_DNS: "bg-amber-100 text-amber-800",
  VERIFICADO: "bg-emerald-100 text-emerald-800",
  FALHA: "bg-red-100 text-red-800",
};
const LABEL: Record<string, string> = {
  NAO_CADASTRADO: "Não cadastrado",
  PENDENTE_DNS: "Aguardando DNS",
  VERIFICADO: "Ativo",
  FALHA: "Falha",
};

function Copiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}
      className="ml-2 text-xs text-zinc-500 hover:text-zinc-900 shrink-0">
      {copiado ? "copiado!" : "copiar"}
    </button>
  );
}

export function DominioForm({ slug, dominioAtual, status, verificadoEm }: Props) {
  const acao = salvarDominioProprio.bind(null, slug);
  const [state, action] = useActionState<DominioState, FormData>(acao, undefined);
  const [verificando, setVerificando] = useState(false);
  const [resultadoVerif, setResultadoVerif] = useState<DominioState>(undefined);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [ativo, setAtivo] = useState(status === "VERIFICADO");
  const [, startTransition] = useTransition();

  // busca os records do CF ao montar (se há domínio)
  useEffect(() => {
    if (!dominioAtual) return;
    startTransition(async () => {
      const r = await obterRecordsDominio(slug);
      setRecords(r.records);
      setAtivo(r.ativo);
    });
  }, [dominioAtual, slug]);

  function verificarAgora() {
    setVerificando(true);
    setResultadoVerif(undefined);
    startTransition(async () => {
      const r = await verificarDominioAcao(slug);
      const rec = await obterRecordsDominio(slug);
      setRecords(rec.records);
      setAtivo(rec.ativo);
      setVerificando(false);
      setResultadoVerif(r);
    });
  }

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Domínio próprio</h2>
        <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium ${COR[ativo ? "VERIFICADO" : status] ?? COR.NAO_CADASTRADO}`}>
          {LABEL[ativo ? "VERIFICADO" : status] ?? status}
        </span>
      </header>

      <form action={action} className="space-y-3">
        <label htmlFor="dominio" className="text-sm font-medium block">Seu domínio (sem https://)</label>
        <input id="dominio" name="dominio" defaultValue={dominioAtual ?? ""} placeholder="ex: minhaempresa.com.br"
          className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400" />
        <div className="flex items-center gap-3">
          <BotaoSalvar />
          {state?.ok ? <span className="text-sm text-emerald-700">Salvo. Configure os registros abaixo.</span> : null}
          {state && !state.ok ? <span className="text-sm text-red-600">{state.erro}</span> : null}
        </div>
      </form>

      {dominioAtual && !ativo && records.length > 0 ? (
        <div className="border-t border-zinc-200 pt-5 space-y-3">
          <div>
            <p className="text-sm font-medium">Adicione estes registros no DNS do seu domínio:</p>
            <p className="text-xs text-zinc-500 mt-1">No painel onde você gerencia o DNS (Registro.br, Cloudflare, etc). O SSL é emitido automaticamente após a verificação.</p>
          </div>
          <div className="space-y-2">
            {records.map((r, i) => (
              <div key={i} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-900 text-white font-medium">{r.tipo}</span>
                  <span className="text-zinc-500">{r.descricao}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-zinc-500 w-16 shrink-0">Nome:</span>
                  <code className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 break-all flex-1">{r.nome}</code>
                  <Copiar texto={r.nome} />
                </div>
                <div className="flex items-start">
                  <span className="text-zinc-500 w-16 shrink-0">Valor:</span>
                  <code className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 break-all flex-1">{r.valor}</code>
                  <Copiar texto={r.valor} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">Propagação: minutos a algumas horas. Depois clique em verificar.</p>
        </div>
      ) : null}

      {dominioAtual ? (
        <div className="border-t border-zinc-200 pt-5">
          <button type="button" onClick={verificarAgora} disabled={verificando}
            className="inline-flex items-center h-9 px-4 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50">
            {verificando ? "Verificando..." : "Verificar agora"}
          </button>
          {verificadoEm ? <p className="text-xs text-zinc-500 mt-2">Última verificação: {new Date(verificadoEm).toLocaleString("pt-BR")}</p> : null}
          {ativo ? (
            <p className="text-sm text-emerald-700 mt-3">Domínio ativo ✓ SSL emitido. Site no ar em <a href={`https://${dominioAtual}`} target="_blank" rel="noopener noreferrer" className="underline">{dominioAtual}</a></p>
          ) : null}
          {resultadoVerif && !resultadoVerif.ok && !ativo ? <p className="text-sm text-amber-700 mt-3">{resultadoVerif.erro}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
