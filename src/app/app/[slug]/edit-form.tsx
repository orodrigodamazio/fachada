"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { gerarTextoIA, salvarTextos, type EditState } from "./actions";

type Campo = "heroTitulo" | "heroSubtitulo" | "sobre" | "missao" | "visao" | "rodape" | "metaTitle" | "metaDescription";

type Defaults = Partial<Record<Campo, string | null>>;

function Save() {
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

export function EditForm({ slug, defaults }: { slug: string; defaults: Defaults }) {
  const acao = salvarTextos.bind(null, slug);
  const [state, action] = useActionState<EditState, FormData>(acao, undefined);

  const [valores, setValores] = useState<Record<string, string>>({
    heroTitulo: defaults.heroTitulo ?? "",
    heroSubtitulo: defaults.heroSubtitulo ?? "",
    sobre: defaults.sobre ?? "",
    missao: defaults.missao ?? "",
    visao: defaults.visao ?? "",
    rodape: defaults.rodape ?? "",
    metaTitle: defaults.metaTitle ?? "",
    metaDescription: defaults.metaDescription ?? "",
  });

  const [iaCarregando, setIaCarregando] = useState<Campo | null>(null);
  const [iaErro, setIaErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function chamarIA(campo: Campo) {
    setIaCarregando(campo);
    setIaErro(null);
    startTransition(async () => {
      const r = await gerarTextoIA(slug, campo);
      setIaCarregando(null);
      if (r.ok) {
        setValores((v) => ({ ...v, [campo]: r.texto }));
      } else {
        setIaErro(`${campo}: ${r.erro}`);
      }
    });
  }

  return (
    <form action={action} className="space-y-6">
      <Bloco titulo="Hero">
        <CampoTexto nome="heroTitulo" rotulo="Título do hero" valor={valores.heroTitulo} setValor={(v) => setValores((s) => ({ ...s, heroTitulo: v }))} iaCarregando={iaCarregando === "heroTitulo"} onIa={() => chamarIA("heroTitulo")} placeholder="Ex: Soluções de tecnologia com presença em todo o país" />
        <CampoArea nome="heroSubtitulo" rotulo="Subtítulo do hero" valor={valores.heroSubtitulo} setValor={(v) => setValores((s) => ({ ...s, heroSubtitulo: v }))} iaCarregando={iaCarregando === "heroSubtitulo"} onIa={() => chamarIA("heroSubtitulo")} rows={3} />
      </Bloco>

      <Bloco titulo="Sobre a empresa">
        <CampoArea nome="sobre" rotulo="Sobre" valor={valores.sobre} setValor={(v) => setValores((s) => ({ ...s, sobre: v }))} iaCarregando={iaCarregando === "sobre"} onIa={() => chamarIA("sobre")} rows={6} />
        <CampoArea nome="missao" rotulo="Missão" valor={valores.missao} setValor={(v) => setValores((s) => ({ ...s, missao: v }))} iaCarregando={iaCarregando === "missao"} onIa={() => chamarIA("missao")} rows={3} />
        <CampoArea nome="visao" rotulo="Visão" valor={valores.visao} setValor={(v) => setValores((s) => ({ ...s, visao: v }))} iaCarregando={iaCarregando === "visao"} onIa={() => chamarIA("visao")} rows={3} />
      </Bloco>

      <Bloco titulo="Rodapé">
        <CampoArea nome="rodape" rotulo="Texto do rodapé" valor={valores.rodape} setValor={(v) => setValores((s) => ({ ...s, rodape: v }))} iaCarregando={iaCarregando === "rodape"} onIa={() => chamarIA("rodape")} rows={3} />
      </Bloco>

      <Bloco titulo="SEO">
        <CampoTexto nome="metaTitle" rotulo="Title (aba do navegador)" valor={valores.metaTitle} setValor={(v) => setValores((s) => ({ ...s, metaTitle: v }))} iaCarregando={iaCarregando === "metaTitle"} onIa={() => chamarIA("metaTitle")} maxLength={70} />
        <CampoArea nome="metaDescription" rotulo="Meta description" valor={valores.metaDescription} setValor={(v) => setValores((s) => ({ ...s, metaDescription: v }))} iaCarregando={iaCarregando === "metaDescription"} onIa={() => chamarIA("metaDescription")} rows={2} maxLength={160} />
      </Bloco>

      <div className="flex items-center gap-4 flex-wrap">
        <Save />
        {state?.ok ? <span className="text-sm text-emerald-700">Salvo.</span> : null}
        {state?.erro ? <span className="text-sm text-red-600">{state.erro}</span> : null}
        {iaErro ? <span className="text-sm text-red-600">{iaErro}</span> : null}
      </div>
    </form>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{titulo}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BotaoIA({ carregando, onClick }: { carregando: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className="text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 underline underline-offset-4"
    >
      {carregando ? "Gerando..." : "Gerar com IA"}
    </button>
  );
}

type CampoProps = {
  nome: string;
  rotulo: string;
  valor: string;
  setValor: (v: string) => void;
  iaCarregando: boolean;
  onIa: () => void;
  placeholder?: string;
  maxLength?: number;
};

function CampoTexto(p: CampoProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={p.nome} className="text-sm font-medium">{p.rotulo}</label>
        <BotaoIA carregando={p.iaCarregando} onClick={p.onIa} />
      </div>
      <input
        id={p.nome}
        name={p.nome}
        value={p.valor}
        onChange={(e) => p.setValor(e.target.value)}
        placeholder={p.placeholder}
        maxLength={p.maxLength}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
    </div>
  );
}

function CampoArea(p: CampoProps & { rows?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={p.nome} className="text-sm font-medium">{p.rotulo}</label>
        <BotaoIA carregando={p.iaCarregando} onClick={p.onIa} />
      </div>
      <textarea
        id={p.nome}
        name={p.nome}
        rows={p.rows ?? 4}
        value={p.valor}
        onChange={(e) => p.setValor(e.target.value)}
        maxLength={p.maxLength}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
    </div>
  );
}
