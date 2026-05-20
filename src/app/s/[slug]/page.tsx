import Link from "next/link";
import Image from "next/image";
import { carregarSitePorSlug, formatarTelefone, formatarCnpj, tituloEmpresa } from "@/lib/site-loader";

type ReceitaExtra = {
  cnaes_secundarios?: Array<{ codigo: number; descricao: string }>;
  descricao_porte?: string | null;
  natureza_juridica?: string | null;
};

function soDigitos(v: string | null) {
  return v ? v.replace(/\D/g, "") : "";
}

export default async function HomePublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const base = `/s/${slug}`;
  const tel = formatarTelefone(site.telefone);
  const receita = (site.receitaRaw ?? {}) as ReceitaExtra;

  const ano = site.dataAbertura ? site.dataAbertura.getFullYear() : null;
  const anos = ano ? new Date().getFullYear() - ano : null;
  const endereco = site.endereco as { municipio?: string; uf?: string };
  const cidadeUf = [endereco?.municipio, endereco?.uf].filter(Boolean).join(" / ");

  const secundarios = (receita.cnaes_secundarios ?? []).filter((c) => c.descricao).slice(0, 6);

  const subtitulo =
    site.heroSubtitulo ||
    site.cnaeDescricao ||
    "Atuação consolidada com compromisso, qualidade e relacionamento próximo.";

  const numeros = [
    anos !== null ? { valor: anos > 0 ? `${anos}+` : "Novo", rotulo: anos > 0 ? "anos de atuação" : "no mercado" } : null,
    receita.descricao_porte ? { valor: receita.descricao_porte.replace(/empresa de /i, ""), rotulo: "porte" } : null,
    cidadeUf ? { valor: endereco.uf ?? "", rotulo: cidadeUf } : null,
    { valor: "CNPJ", rotulo: "empresa registrada" },
  ].filter(Boolean) as { valor: string; rotulo: string }[];

  const diferenciais = [
    { titulo: "Compromisso", texto: "Cada cliente atendido com responsabilidade e foco no resultado combinado." },
    { titulo: "Transparência", texto: "Relação clara do começo ao fim, sem letras miúdas nem surpresas." },
    { titulo: "Atendimento próximo", texto: "Acompanhamento direto e canais abertos para falar com a gente." },
    { titulo: "Qualidade", texto: "Padrão consistente de entrega, sustentado pela experiência no segmento." },
  ];

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
            {(ano || cidadeUf) ? (
              <p className="text-sm text-zinc-500">
                {ano ? `Empresa ativa desde ${ano}` : null}
                {ano && cidadeUf ? " · " : null}
                {cidadeUf ? `${cidadeUf}` : null}
                {" · "}CNPJ {formatarCnpj(site.cnpj)}
              </p>
            ) : null}
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

      {numeros.length > 0 ? (
        <section style={{ background: "linear-gradient(120deg, var(--cor-primaria), var(--cor-secundaria))" }}>
          <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {numeros.map((n, i) => (
              <div key={i} className="text-center md:text-left text-white">
                <div className="text-2xl md:text-3xl font-bold">{n.valor}</div>
                <div className="text-xs uppercase tracking-wide mt-1 text-white/80">{n.rotulo}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
            {receita.natureza_juridica ? (
              <p className="text-sm text-zinc-500">Natureza jurídica: {receita.natureza_juridica}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl space-y-4 mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Por que confiar</p>
            <h2 className="text-3xl font-semibold tracking-tight">Nossos compromissos</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {diferenciais.map((d) => (
              <div key={d.titulo} className="border border-zinc-200 rounded-lg p-5">
                <div className="h-1 w-10 rounded-full mb-4" style={{ background: "var(--cor-primaria)" }} />
                <h3 className="font-semibold text-zinc-900 mb-1">{d.titulo}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{d.texto}</p>
              </div>
            ))}
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
            {secundarios.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {secundarios.map((c) => (
                  <li key={c.codigo} className="flex gap-3 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-md p-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--cor-primaria)" }} />
                    <span className="capitalize">{c.descricao.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="text-right">
              <Link href={`${base}/servicos`} className="inline-block text-sm font-medium underline underline-offset-4">
                Ver todos os serviços
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div
          className="rounded-2xl px-8 py-12 md:px-12 md:py-16 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(120deg, var(--cor-primaria), var(--cor-secundaria))" }}
        >
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/80">Contato</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Vamos conversar?</h2>
            <p className="text-white/90 leading-relaxed">
              {site.horarioAtend || "Atendemos de segunda a sexta, das 9h às 18h."} Retornamos cada mensagem com atenção.
            </p>
            <div className="pt-2 space-y-1 text-white/90 text-sm">
              {tel ? <p>Telefone: {tel}</p> : null}
              {site.whatsapp ? <p>WhatsApp: {formatarTelefone(site.whatsapp)}</p> : null}
              {site.emailContato ? <p>E-mail: {site.emailContato}</p> : null}
            </div>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href={`${base}/contato`}
                className="inline-flex items-center h-11 px-6 rounded-md bg-white text-zinc-900 text-sm font-semibold hover:bg-white/90"
              >
                Ir para contato
              </Link>
              {site.whatsapp ? (
                <a
                  href={`https://wa.me/55${soDigitos(site.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-11 px-6 rounded-md border border-white/40 text-white text-sm font-medium hover:bg-white/10"
                >
                  Chamar no WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
