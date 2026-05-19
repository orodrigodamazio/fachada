import { carregarSitePorSlug, tituloEmpresa } from "@/lib/site-loader";

type ReceitaCnaeExtra = { codigo: number; descricao: string };

export default async function ServicosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);

  const receita = site.receitaRaw as { cnaes_secundarios?: ReceitaCnaeExtra[] } | null;
  const secundarios = (receita?.cnaes_secundarios ?? []).filter((c) => c.codigo > 0).slice(0, 6);

  return (
    <article className="max-w-4xl mx-auto px-6 py-20 space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Serviços</p>
        <h1 className="text-4xl font-semibold tracking-tight">O que a {titulo} oferece</h1>
      </header>

      {site.cnaeDescricao ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Atividade principal</h2>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-lg text-zinc-900">{site.cnaeDescricao}</p>
            {site.cnaeFiscal ? (
              <p className="text-sm text-zinc-500 mt-2">CNAE {site.cnaeFiscal}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {secundarios.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Outras frentes de atuação</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {secundarios.map((c) => (
              <div key={c.codigo} className="rounded-lg border border-zinc-200 p-5">
                <p className="text-zinc-800">{c.descricao}</p>
                <p className="text-xs text-zinc-500 mt-2">CNAE {c.codigo}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-zinc-200 pt-8">
        <p className="text-zinc-600 leading-relaxed">
          Quer entender se atendemos uma demanda específica? Mande uma mensagem na página de contato — respondemos em até um dia útil.
        </p>
      </section>
    </article>
  );
}
