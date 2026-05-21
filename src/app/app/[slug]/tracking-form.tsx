"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarTracking, type TrackingState } from "./actions";

type Props = {
  slug: string;
  metaPixel: string | null;
  metaCapiToken: string | null;
  gaId: string | null;
  fbDomainVerif: string | null;
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

export function TrackingForm({ slug, metaPixel, metaCapiToken, gaId, fbDomainVerif }: Props) {
  const acao = salvarTracking.bind(null, slug);
  const [state, action] = useActionState<TrackingState, FormData>(acao, undefined);

  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-4">
      <header className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Marketing & Tracking</h2>
        <p className="text-xs text-zinc-500">Opcional. Preencha apenas o que quiser ativar.</p>
      </header>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="fbDomainVerif" className="text-sm font-medium">Verificação de domínio (Meta / Facebook)</label>
          <input
            id="fbDomainVerif"
            name="fbDomainVerif"
            defaultValue={fbDomainVerif ?? ""}
            placeholder='Cole o token ou a metatag <meta name="facebook-domain-verification" ...>'
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono"
          />
          <p className="text-xs text-zinc-500">No Business Manager &gt; Segurança da marca &gt; Domínios, escolha &quot;Adicionar metatag&quot;. A tag entra sozinha no &lt;head&gt; do site.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="metaPixel" className="text-sm font-medium">Meta Pixel ID</label>
          <input
            id="metaPixel"
            name="metaPixel"
            defaultValue={metaPixel ?? ""}
            placeholder="123456789012345 (15-16 dígitos)"
            inputMode="numeric"
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="text-xs text-zinc-500">Aparece no Meta Business Manager &gt; Eventos &gt; Conjuntos de dados.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="metaCapiToken" className="text-sm font-medium">Meta CAPI Access Token (opcional)</label>
          <input
            id="metaCapiToken"
            name="metaCapiToken"
            type="password"
            defaultValue={metaCapiToken ?? ""}
            placeholder="EAA...token longo"
            autoComplete="off"
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono"
          />
          <p className="text-xs text-zinc-500">Conversions API server-side. Em Eventos &gt; Configurações &gt; Gerar token de acesso.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="gaId" className="text-sm font-medium">Google Analytics ID</label>
          <input
            id="gaId"
            name="gaId"
            defaultValue={gaId ?? ""}
            placeholder="G-XXXXXXXXXX, UA-XXXXX ou GTM-XXXXXX"
            className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <p className="text-xs text-zinc-500">Measurement ID (G-...), Universal Analytics (UA-...) ou Tag Manager (GTM-...).</p>
        </div>

        <div className="flex items-center gap-3">
          <BotaoSalvar />
          {state?.ok ? <span className="text-sm text-emerald-700">Salvo.</span> : null}
          {state?.erro ? <span className="text-sm text-red-600">{state.erro}</span> : null}
        </div>
      </form>
    </section>
  );
}
