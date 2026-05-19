import Link from "next/link";
import { carregarSitePorSlug, formatarTelefone, tituloEmpresa } from "@/lib/site-loader";

export default async function HomePublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const base = `/s/${slug}`;
  const tel = formatarTelefone(site.telefone);

  const subtitulo =
    site.heroSubtitulo ||
    site.cnaeDescricao ||
    "Atuação consolidada com compromisso, qualidade e relacionamento próximo.";

  return (
    <>
      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              {site.heroTitulo || titulo}
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed">{subtitulo}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`${base}/contato`}
                className="inline-flex items-center h-11 px-6 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
              >
                Falar com a gente
              </Link>
              <Link
                href={`${base}/sobre`}
                className="inline-flex items-center h-11 px-6 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
              >
                Conheça a empresa
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-2 items-start">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Sobre</p>
            <h2 className="text-3xl font-semibold tracking-tight">Quem somos</h2>
            <p className="text-zinc-600 leading-relaxed">
              {site.sobre ||
                `A ${site.razaoSocial} atua no mercado com foco em ${site.cnaeDescricao?.toLowerCase() || "sua área de atuação"}. ` +
                  (site.dataAbertura
                    ? `Em atividade desde ${site.dataAbertura.toISOString().slice(0, 10).split("-").reverse().join("/")}, `
                    : "") +
                  "construímos relações duradouras com clientes e parceiros, sustentadas por compromisso, transparência e qualidade no que entregamos."}
            </p>
            <Link href={`${base}/sobre`} className="inline-block text-sm font-medium underline underline-offset-4">
              Saiba mais
            </Link>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Nossa missão</p>
            <h2 className="text-3xl font-semibold tracking-tight">O que nos move</h2>
            <p className="text-zinc-600 leading-relaxed">
              {site.missao ||
                "Oferecer soluções consistentes e atendimento próximo, com responsabilidade e cuidado em cada etapa da relação com nossos clientes."}
            </p>
          </div>
        </div>
      </section>

      {site.cnaeDescricao ? (
        <section className="border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="max-w-3xl space-y-4 mb-10">
              <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Serviços</p>
              <h2 className="text-3xl font-semibold tracking-tight">O que fazemos</h2>
              <p className="text-zinc-600 leading-relaxed">
                Nossa atuação principal está em <strong className="text-zinc-900">{site.cnaeDescricao.toLowerCase()}</strong>.
              </p>
            </div>
            <div className="text-right">
              <Link href={`${base}/servicos`} className="inline-block text-sm font-medium underline underline-offset-4">
                Ver todos os serviços
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Contato</p>
            <h2 className="text-3xl font-semibold tracking-tight">Vamos conversar?</h2>
            <p className="text-zinc-600 leading-relaxed">
              Atendemos de segunda a sexta, das 9h às 18h. Retornamos cada mensagem com atenção.
            </p>
            <div className="pt-2 space-y-1 text-zinc-700">
              {tel ? <p>Telefone: {tel}</p> : null}
              {site.emailContato ? <p>Email: {site.emailContato}</p> : null}
            </div>
            <div className="pt-4">
              <Link
                href={`${base}/contato`}
                className="inline-flex items-center h-11 px-6 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
              >
                Ir para contato
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
