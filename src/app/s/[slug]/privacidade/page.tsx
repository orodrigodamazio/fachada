import { carregarSitePorSlug, formatarCnpj, tituloEmpresa } from "@/lib/site-loader";

export default async function PrivacidadePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const cnpjFmt = formatarCnpj(site.cnpj);

  return (
    <article className="max-w-3xl mx-auto px-6 py-20 space-y-8 text-zinc-800 leading-relaxed">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--cor-primaria)]">Política</p>
        <h1 className="text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
        <div className="h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--cor-primaria), var(--cor-secundaria))" }} />
        <p className="text-sm text-zinc-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>
      </header>

      <Secao titulo="1. Quem somos">
        <p>
          A {site.razaoSocial} (&quot;{titulo}&quot;, &quot;nós&quot;), inscrita no CNPJ {cnpjFmt},
          é responsável pelo tratamento de dados pessoais coletados por meio deste site, na qualidade
          de controladora, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </Secao>

      <Secao titulo="2. Dados que coletamos">
        <p>Podemos coletar:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados que você fornece voluntariamente em formulários (nome, email, telefone, mensagem);</li>
          <li>Dados técnicos de navegação (endereço IP, tipo de dispositivo, páginas visitadas);</li>
          <li>Cookies estritamente necessários ao funcionamento do site.</li>
        </ul>
      </Secao>

      <Secao titulo="3. Finalidades">
        <p>Usamos seus dados para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Responder a contatos e propostas;</li>
          <li>Aprimorar a experiência de navegação;</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>
      </Secao>

      <Secao titulo="4. Compartilhamento">
        <p>
          Não vendemos seus dados. Eles podem ser compartilhados com provedores de tecnologia que
          atuam em nosso nome (hospedagem, email, analytics), sempre sob obrigação contratual de
          confidencialidade.
        </p>
      </Secao>

      <Secao titulo="5. Seus direitos">
        <p>
          Você pode solicitar acesso, correção, anonimização, portabilidade ou eliminação dos seus
          dados, bem como revogar consentimentos, entrando em contato pelos canais informados na
          página de contato.
        </p>
      </Secao>

      <Secao titulo="6. Retenção">
        <p>
          Mantemos os dados pelo tempo necessário ao cumprimento das finalidades acima e às obrigações
          legais aplicáveis. Após esse período, são eliminados ou anonimizados.
        </p>
      </Secao>

      <Secao titulo="7. Contato do encarregado">
        <p>
          Dúvidas sobre privacidade podem ser direcionadas ao nosso encarregado pelos dados,
          {site.emailContato ? (
            <> pelo email <a href={`mailto:${site.emailContato}`} className="underline">{site.emailContato}</a>.</>
          ) : (
            " pela página de contato."
          )}
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
