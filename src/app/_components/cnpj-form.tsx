"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarSite, criarSitePorCartao, type CriarSiteState } from "../actions";

function Botao({ rotulo, pendente }: { rotulo: string; pendente: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? pendente : rotulo}
    </Button>
  );
}

function formatarCnpjVisual(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function CnpjForm() {
  const [modo, setModo] = useState<"cnpj" | "cartao">("cnpj");
  const [stateCnpj, actionCnpj] = useActionState<CriarSiteState, FormData>(criarSite, undefined);
  const [stateCartao, actionCartao] = useActionState<CriarSiteState, FormData>(criarSitePorCartao, undefined);
  const [arquivo, setArquivo] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setModo("cnpj")}
          className={`rounded-md py-1.5 font-medium transition-colors ${modo === "cnpj" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Buscar por CNPJ
        </button>
        <button
          type="button"
          onClick={() => setModo("cartao")}
          className={`rounded-md py-1.5 font-medium transition-colors ${modo === "cartao" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Importar cartão CNPJ
        </button>
      </div>

      {modo === "cnpj" ? (
        <form action={actionCnpj} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              name="cnpj"
              inputMode="numeric"
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              maxLength={18}
              required
              onInput={(e) => {
                const el = e.currentTarget;
                el.value = formatarCnpjVisual(el.value);
              }}
            />
            {stateCnpj?.erro ? (
              <p className="text-sm text-red-500" role="alert">
                {stateCnpj.erro}
              </p>
            ) : null}
          </div>
          <Botao rotulo="Gerar site" pendente="Consultando Receita..." />
        </form>
      ) : (
        <form action={actionCartao} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cartao">Cartão CNPJ (PDF)</Label>
            <label
              htmlFor="cartao"
              className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-100 transition-colors"
            >
              <svg className="h-6 w-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              <span className="text-sm text-zinc-700">{arquivo ?? "Clique para anexar o PDF"}</span>
              <span className="text-xs text-zinc-400">Dados oficiais e atualizados direto da Receita</span>
            </label>
            <input
              id="cartao"
              name="cartao"
              type="file"
              accept="application/pdf,.pdf"
              required
              className="sr-only"
              onChange={(e) => setArquivo(e.currentTarget.files?.[0]?.name ?? null)}
            />
            <p className="text-xs text-zinc-500">
              Baixe em{" "}
              <a
                href="https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                solucoes.receita.fazenda.gov.br
              </a>{" "}
              (Comprovante de Inscrição e de Situação Cadastral) e salve como PDF.
            </p>
            {stateCartao?.erro ? (
              <p className="text-sm text-red-500" role="alert">
                {stateCartao.erro}
              </p>
            ) : null}
          </div>
          <Botao rotulo="Importar e gerar site" pendente="Lendo cartão..." />
        </form>
      )}
    </div>
  );
}
