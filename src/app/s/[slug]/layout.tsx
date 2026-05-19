import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import { carregarSitePorSlug, formatarCnpj, formatarEndereco, tituloEmpresa, type EnderecoJson } from "@/lib/site-loader";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = site.metaTitle || tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const descricao =
    site.metaDescription ||
    `${tituloEmpresa(site.razaoSocial, site.nomeFantasia)}${site.cnaeDescricao ? `. ${site.cnaeDescricao}` : ". Site institucional"}.`;

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

  const temEnderecoCompleto = endereco.logradouro && endereco.municipio && endereco.uf;
  const tipo = temEnderecoCompleto ? "LocalBusiness" : "Organization";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": tipo,
    name: site.razaoSocial,
    alternateName: site.nomeFantasia ?? undefined,
    legalName: site.razaoSocial,
    description: site.metaDescription || site.sobre || undefined,
    telephone: site.telefone ?? undefined,
    email: site.emailContato ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: [endereco.logradouro, endereco.numero].filter(Boolean).join(", ") || undefined,
      addressLocality: endereco.municipio ?? undefined,
      addressRegion: endereco.uf ?? undefined,
      postalCode: endereco.cep ?? undefined,
      addressCountry: "BR",
    },
    taxID: site.cnpj,
    identifier: { "@type": "PropertyValue", propertyID: "CNPJ", value: site.cnpj },
    image: site.logoUrl ?? site.heroImageUrl ?? undefined,
    logo: site.logoUrl ?? undefined,
    foundingDate: site.dataAbertura?.toISOString().slice(0, 10) ?? undefined,
  };
  if (tipo === "LocalBusiness") {
    jsonLd.openingHoursSpecification = [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ];
    jsonLd.areaServed = { "@type": "Country", name: "BR" };
  }
  Object.keys(jsonLd).forEach((k) => jsonLd[k] === undefined && delete jsonLd[k]);

  return (
    <div className="min-h-dvh flex flex-col bg-white text-zinc-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {site.metaPixel ? (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${site.metaPixel}');fbq('track','PageView');`}
          </Script>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${site.metaPixel}&ev=PageView&noscript=1" />`,
            }}
          />
        </>
      ) : null}
      <header className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href={base} className="flex items-center gap-3 font-semibold tracking-tight text-lg">
            {site.logoUrl ? (
              <Image src={site.logoUrl} alt={titulo} width={36} height={36} className="object-contain" unoptimized />
            ) : null}
            <span>{titulo}</span>
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
