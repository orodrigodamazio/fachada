import { carregarSitePorSlug, formatarCnpj, tituloEmpresa } from "@/lib/site-loader";

export default async function TermosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const cnpjFmt = formatarCnpj(site.cnpj);

  return (
    <article className="max-w-3xl mx-auto px-6 py-20 space-y-8 text-zinc-800 leading-relaxed">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Termos</p>
        <h1 className="text-4xl font-semibold tracking-tight">Termos de Uso</h1>
        <div className="h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--cor-primaria), var(--cor-secundaria))" }} />
        <p className="text-sm text-zinc-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </header>

      <Secao titulo="1. Aceite">
        <p>
          Ao acessar este site, você concorda com estes termos. Caso não concorde, recomendamos
          interromper a navegação.
        </p>
      </Secao>

      <Secao titulo="2. Identificação">
        <p>
          Este site pertence à {site.razaoSocial} ({titulo}), CNPJ {cnpjFmt}.
        </p>
      </Secao>

      <Secao titulo="3. Uso permitido">
        <p>
          O conteúdo é de uso informativo. Você se compromete a não utilizá-lo para finalidades
          ilícitas ou que violem direitos de terceiros.
        </p>
      </Secao>

      <Secao titulo="4. Propriedade intelectual">
        <p>
          Marcas, textos, imagens e demais elementos do site são protegidos por lei e pertencem à
          {site.razaoSocial} ou a terceiros que autorizaram sua exibição. É vedada a reprodução sem
          autorização escrita.
        </p>
      </Secao>

      <Secao titulo="5. Limitação de responsabilidade">
        <p>
          O site é fornecido no estado em que se encontra. Apesar do nosso esforço em manter as
          informações atualizadas, não nos responsabilizamos por eventuais imprecisões ou
          indisponibilidades momentâneas.
        </p>
      </Secao>

      <Secao titulo="6. Alterações">
        <p>
          Podemos atualizar estes termos a qualquer momento. A versão vigente é sempre a publicada
          nesta página.
        </p>
      </Secao>

      <Secao titulo="7. Foro">
        <p>
          Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer controvérsias
          decorrentes destes termos.
        </p>
      </Secao>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold border-l-4 border-[var(--cor-primaria)] pl-3">{titulo}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
