import { carregarSitePorSlug, formatarEndereco, formatarTelefone, tituloEmpresa, type EnderecoJson } from "@/lib/site-loader";
import { FormContato } from "./form";

export default async function ContatoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const endereco = site.endereco as EnderecoJson;
  const tel = formatarTelefone(site.telefone);

  return (
    <article className="max-w-5xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-5">
      <section className="md:col-span-2 space-y-6">
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

        <aside className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Dados cadastrais</p>
          <p className="text-sm text-zinc-800">{site.razaoSocial}</p>
          <p className="text-xs text-zinc-500">
            CNPJ {site.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
          </p>
        </aside>
      </section>

      <section className="md:col-span-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 md:p-8 space-y-5">
          <header className="space-y-1">
            <p className="text-sm font-semibold">Envie uma mensagem</p>
            <p className="text-xs text-zinc-500">Respondemos em até um dia útil.</p>
          </header>
          <FormContato slug={slug} />
        </div>
      </section>
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
