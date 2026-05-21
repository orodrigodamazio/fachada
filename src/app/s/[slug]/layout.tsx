import Script from "next/script";
import Link from "next/link";
import { LogoMarca } from "@/components/logo-marca";
import { carregarSitePorSlug, formatarCnpj, formatarTelefone, formatarEndereco, tituloEmpresa, type EnderecoJson } from "@/lib/site-loader";
import { paletaDoSite } from "@/lib/palette";

const soDigitos = (v: string | null) => (v ? v.replace(/\D/g, "") : "");
const linkRede = (v: string | null | undefined, prefixo: string) =>
  !v ? null : /^https?:\/\//.test(v) ? v : `${prefixo}${v.replace(/^@/, "")}`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await carregarSitePorSlug(slug);
  const titulo = site.metaTitle || tituloEmpresa(site.razaoSocial, site.nomeFantasia);
  const descricao =
    site.metaDescription ||
    `${tituloEmpresa(site.razaoSocial, site.nomeFantasia)}${site.cnaeDescricao ? `. ${site.cnaeDescricao}` : ". Site institucional"}.`;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "vertentebr.com.br")
    .split(",")[0]
    .trim();
  const baseUrl =
    site.dominioProprio && site.dominioStatus === "VERIFICADO"
      ? `https://${site.dominioProprio}`
      : `https://${site.slug}.${rootDomain}`;

  return {
    metadataBase: new URL(baseUrl),
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
  const paleta = paletaDoSite(site);

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
    <div
      className="min-h-dvh flex flex-col bg-white text-zinc-900"
      style={{ ["--cor-primaria"]: paleta.primaria, ["--cor-secundaria"]: paleta.secundaria } as React.CSSProperties}
    >
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${paleta.primaria}, ${paleta.secundaria})` }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {site.metaPixel ? (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${site.metaPixel}');fbq('track','PageView');fetch('/api/meta/capi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'PageView',url:location.href,slug:'${slug}'})}).catch(()=>{});`}
          </Script>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${site.metaPixel}&ev=PageView&noscript=1" />`,
            }}
          />
        </>
      ) : null}
      {site.gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${site.gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.gaId}');`}
          </Script>
        </>
      ) : null}
      <header className="border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href={base} className="flex items-center gap-3 font-semibold tracking-tight text-lg">
            <LogoMarca logoUrl={site.logoUrl} nome={titulo} size={40} />
            <span>{titulo}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href={`${base}/sobre`} className="hover:text-zinc-900">Sobre</Link>
            <Link href={`${base}/servicos`} className="hover:text-zinc-900">Serviços</Link>
            <Link href={`${base}/contato`} className="hover:text-zinc-900">Contato</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 vt-site">{children}</main>

      <footer className="bg-zinc-50 mt-16">
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${paleta.primaria}, ${paleta.secundaria})` }} />
        <div className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
          <div>
            <p className="font-semibold mb-2 text-[var(--cor-primaria)]">{titulo}</p>
            <p className="text-zinc-600">{site.razaoSocial}</p>
            <p className="text-zinc-600">CNPJ {formatarCnpj(site.cnpj)}</p>
            {site.dataAbertura ? (
              <p className="text-zinc-500 mt-2">Empresa ativa desde {site.dataAbertura.getFullYear()}</p>
            ) : null}
          </div>

          <div>
            <p className="font-semibold mb-2">Contato</p>
            <ul className="space-y-1 text-zinc-600">
              {site.whatsapp || site.telefone ? (
                <li>
                  <a href={`https://wa.me/55${soDigitos(site.whatsapp || site.telefone)}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--cor-primaria)]">
                    Telefone / WhatsApp: {formatarTelefone(site.whatsapp || site.telefone)}
                  </a>
                </li>
              ) : null}
              {site.emailContato ? (
                <li>
                  E-mail:{" "}
                  <a href={`mailto:${site.emailContato}`} className="hover:text-[var(--cor-primaria)]">{site.emailContato}</a>
                </li>
              ) : null}
              {site.horarioAtend ? <li className="text-zinc-500">{site.horarioAtend}</li> : null}
            </ul>
            {(site.instagram || site.facebook || site.linkedin) ? (
              <div className="flex gap-3 mt-3">
                {linkRede(site.instagram, "https://instagram.com/") ? (
                  <a href={linkRede(site.instagram, "https://instagram.com/")!} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[var(--cor-primaria)] font-medium">Instagram</a>
                ) : null}
                {linkRede(site.facebook, "https://facebook.com/") ? (
                  <a href={linkRede(site.facebook, "https://facebook.com/")!} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[var(--cor-primaria)] font-medium">Facebook</a>
                ) : null}
                {linkRede(site.linkedin, "https://linkedin.com/") ? (
                  <a href={linkRede(site.linkedin, "https://linkedin.com/")!} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[var(--cor-primaria)] font-medium">LinkedIn</a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <p className="font-semibold mb-2">Endereço</p>
            <p className="text-zinc-600 leading-relaxed">{formatarEndereco(endereco)}</p>
          </div>

          <div>
            <p className="font-semibold mb-2">Institucional</p>
            <ul className="space-y-1 text-zinc-600">
              <li><Link href={`${base}/sobre`} className="hover:text-[var(--cor-primaria)]">Sobre</Link></li>
              <li><Link href={`${base}/servicos`} className="hover:text-[var(--cor-primaria)]">Serviços</Link></li>
              <li><Link href={`${base}/contato`} className="hover:text-[var(--cor-primaria)]">Contato</Link></li>
              <li><Link href={`${base}/privacidade`} className="hover:text-[var(--cor-primaria)]">Política de Privacidade</Link></li>
              <li><Link href={`${base}/termos`} className="hover:text-[var(--cor-primaria)]">Termos de Uso</Link></li>
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
