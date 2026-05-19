import { carregarSitePorSlug, tituloEmpresa, formatarEndereco, type EnderecoJson } from "@/lib/site-loader";

export default async function SobrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const endereco = site.endereco as EnderecoJson;

  const dataAbertura = site.dataAbertura?.toISOString().slice(0, 10).split("-").reverse().join("/");
  const tempo = site.dataAbertura
    ? Math.floor((Date.now() - site.dataAbertura.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  return (
    <article className="max-w-3xl mx-auto px-6 py-20 space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Institucional</p>
        <h1 className="text-4xl font-semibold tracking-tight">Sobre a {titulo}</h1>
      </header>

      <section className="space-y-4 text-zinc-700 leading-relaxed">
        <p>
          {site.sobre ||
            `A ${site.razaoSocial} é uma empresa ${site.cnaeDescricao ? `do segmento de ${site.cnaeDescricao.toLowerCase()}` : "de atuação consolidada em seu setor"}, ` +
              (dataAbertura ? `fundada em ${dataAbertura}` : "com presença no mercado") +
              `${tempo && tempo > 0 ? ` — são ${tempo} ${tempo === 1 ? "ano" : "anos"} de trajetória` : ""}.`}
        </p>
        <p>
          Acreditamos que cada cliente merece atenção genuína. Por isso, mantemos uma operação enxuta e
          relações de longo prazo, em vez de tratar atendimento como linha de produção.
        </p>
        <p>
          {site.missao ||
            "Nossa missão é entregar resultado sem complicar, com clareza no que combinamos e responsabilidade no que executamos."}
        </p>
      </section>

      <section className="space-y-4 border-t border-zinc-200 pt-10">
        <h2 className="text-xl font-semibold">Dados da empresa</h2>
        <dl className="grid gap-3 text-sm">
          <Linha rotulo="Razão social" valor={site.razaoSocial} />
          {site.nomeFantasia ? <Linha rotulo="Nome fantasia" valor={site.nomeFantasia} /> : null}
          {site.cnaeDescricao ? <Linha rotulo="Ramo de atuação" valor={site.cnaeDescricao} /> : null}
          {dataAbertura ? <Linha rotulo="Em atividade desde" valor={dataAbertura} /> : null}
          <Linha rotulo="Endereço" valor={formatarEndereco(endereco)} />
        </dl>
      </section>
    </article>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-zinc-100 pb-2">
      <dt className="text-zinc-500">{rotulo}</dt>
      <dd className="md:col-span-2 text-zinc-800">{valor}</dd>
    </div>
  );
}
