import Link from "next/link";
import { carregarSitePorSlug, formatarCnpj, formatarEndereco, tituloEmpresa, type EnderecoJson } from "@/lib/site-loader";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = site.metaTitle || tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const descricao =
    site.metaDescription ||
    `${tituloEmpresa(site.razaoSocial, site.nomeFantasia)}${site.cnaeDescricao ? ` — ${site.cnaeDescricao}` : " — site institucional"}.`;

  return {
    title: { default: titulo, template: `%s | ${titulo}` },
    description: descricao,
    applicationName: titulo,
    generator: undefined,
    robots: { index: true, follow: true },
    openGraph: {
      title: titulo,
      description: descricao,
      siteName: titulo,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: titulo,
      description: descricao,
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
    other: site.metaPixel ? { "fb:app_id": site.metaPixel } : undefined,
  };
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const base = `/s/${slug}`;
  const endereco = site.endereco as EnderecoJson;

  return (
    <div className="min-h-dvh flex flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href={base} className="font-semibold tracking-tight text-lg">
            {titulo}
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href={`${base}/sobre`} className="hover:text-zinc-900">Sobre</Link>
            <Link href={`${base}/servicos`} className="hover:text-zinc-900">Serviços</Link>
            <Link href={`${base}/contato`} className="hover:text-zinc-900">Contato</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 bg-zinc-50 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3 text-sm">
          <div>
            <p className="font-semibold mb-2">{titulo}</p>
            <p className="text-zinc-600">{site.razaoSocial}</p>
            <p className="text-zinc-600">CNPJ {formatarCnpj(site.cnpj)}</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Endereço</p>
            <p className="text-zinc-600 leading-relaxed">{formatarEndereco(endereco)}</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Institucional</p>
            <ul className="space-y-1 text-zinc-600">
              <li><Link href={`${base}/sobre`} className="hover:text-zinc-900">Sobre</Link></li>
              <li><Link href={`${base}/contato`} className="hover:text-zinc-900">Contato</Link></li>
              <li><Link href={`${base}/privacidade`} className="hover:text-zinc-900">Política de Privacidade</Link></li>
              <li><Link href={`${base}/termos`} className="hover:text-zinc-900">Termos de Uso</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-200">
          <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-zinc-500 flex flex-wrap justify-between gap-2">
            <span>© {new Date().getFullYear()} {site.razaoSocial}. Todos os direitos reservados.</span>
            <span>CNPJ {formatarCnpj(site.cnpj)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
