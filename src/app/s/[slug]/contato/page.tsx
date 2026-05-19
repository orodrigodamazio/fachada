import { carregarSitePorSlug, formatarEndereco, formatarTelefone, tituloEmpresa, type EnderecoJson } from "@/lib/site-loader";

export default async function ContatoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const endereco = site.endereco as EnderecoJson;
  const tel = formatarTelefone(site.telefone);

  return (
    <article className="max-w-4xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-2">
      <section className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Contato</p>
          <h1 className="text-4xl font-semibold tracking-tight">Fale com a {titulo}</h1>
        </header>
        <p className="text-zinc-600 leading-relaxed">
          Atendemos de segunda a sexta, das 9h às 18h. Para propostas, dúvidas comerciais e suporte,
          os canais abaixo são os melhores.
        </p>

        <dl className="space-y-4 text-sm">
          {tel ? (
            <Bloco rotulo="Telefone" valor={tel} href={`tel:+55${(site.telefone ?? "").replace(/\D/g, "")}`} />
          ) : null}
          {site.emailContato ? (
            <Bloco rotulo="Email" valor={site.emailContato} href={`mailto:${site.emailContato}`} />
          ) : null}
          <Bloco rotulo="Endereço" valor={formatarEndereco(endereco)} />
        </dl>
      </section>

      <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 space-y-3 self-start">
        <p className="text-sm font-semibold">Dados cadastrais</p>
        <dl className="text-sm space-y-2">
          <div>
            <dt className="text-zinc-500">Razão social</dt>
            <dd>{site.razaoSocial}</dd>
          </div>
          {site.nomeFantasia ? (
            <div>
              <dt className="text-zinc-500">Nome fantasia</dt>
              <dd>{site.nomeFantasia}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-zinc-500">CNPJ</dt>
            <dd>{site.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</dd>
          </div>
        </dl>
      </aside>
    </article>
  );
}

function Bloco({ rotulo, valor, href }: { rotulo: string; valor: string; href?: string }) {
  return (
    <div className="border-l-2 border-zinc-300 pl-4">
      <dt className="text-zinc-500 text-xs uppercase tracking-wider">{rotulo}</dt>
      <dd className="text-zinc-800">
        {href ? (
          <a href={href} className="underline underline-offset-4 hover:text-zinc-950">
            {valor}
          </a>
        ) : (
          valor
        )}
      </dd>
    </div>
  );
}
