import Link from "next/link";
import Image from "next/image";
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
      <section className="relative border-b border-zinc-200 overflow-hidden">
        {site.heroImageUrl ? (
          <div className="absolute inset-0">
            <Image src={site.heroImageUrl} alt="" fill className="object-cover" unoptimized priority />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40" />
          </div>
        ) : (
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ background: `radial-gradient(circle at 15% 25%, var(--cor-primaria), transparent 55%)` }}
          />
        )}
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-zinc-900">
              {site.heroTitulo || titulo}
            </h1>
            <p className="text-lg text-zinc-700 leading-relaxed">{subtitulo}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`${base}/contato`}
                className="inline-flex items-center h-11 px-6 rounded-md bg-[var(--cor-primaria)] text-white text-sm font-medium hover:opacity-90"
              >
                Falar com a gente
              </Link>
              <Link
                href={`${base}/sobre`}
                className="inline-flex items-center h-11 px-6 rounded-md border border-zinc-300 bg-white text-sm font-medium hover:bg-zinc-50"
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
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Sobre</p>
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
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Nossa missão</p>
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
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Serviços</p>
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
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Contato</p>
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
                className="inline-flex items-center h-11 px-6 rounded-md bg-[var(--cor-primaria)] text-white text-sm font-medium hover:opacity-90"
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
