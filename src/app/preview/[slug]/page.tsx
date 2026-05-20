import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarCnpj } from "@/lib/cnpj";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type EnderecoJson = {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
};

type SocioJson = { nome_socio: string; qualificacao_socio: string };

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? "vertentebr.com.br").split(",")[0].trim();

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) notFound();

  const urlPublica = site.dominioProprio && site.dominioStatus === "VERIFICADO"
    ? `https://${site.dominioProprio}`
    : `https://${site.slug}.${ROOT}`;

  const e = site.endereco as EnderecoJson;
  const socios = (site.socios ?? []) as SocioJson[];
  const enderecoFmt = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.municipio, e.uf].filter(Boolean).join(" / "),
    e.cep,
  ].filter(Boolean).join(" · ");

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{site.razaoSocial}</h1>
            <p className="text-sm text-zinc-500">CNPJ {formatarCnpj(site.cnpj)}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Novo</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid gap-2">
            <Info rotulo="Razão social" valor={site.razaoSocial} />
            <Info rotulo="Nome fantasia" valor={site.nomeFantasia} />
            <Info rotulo="Slug do site" valor={site.slug} />
            <Info rotulo="CNAE" valor={[site.cnaeFiscal, site.cnaeDescricao].filter(Boolean).join(" · ")} />
            <Info rotulo="Capital social" valor={site.capitalSocial ? `R$ ${site.capitalSocial.toString()}` : null} />
            <Info rotulo="Abertura" valor={site.dataAbertura?.toISOString().slice(0, 10) ?? null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid gap-2">
            <Info rotulo="Endereço" valor={enderecoFmt || null} />
            <Info rotulo="Telefone" valor={site.telefone} />
            <Info rotulo="Email Receita" valor={site.emailContato} />
          </CardContent>
        </Card>

        {socios.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quadro societário</CardTitle>
            </CardHeader>
            <CardContent className="text-sm grid gap-2">
              {socios.map((s, i) => (
                <div key={i} className="flex justify-between gap-2 border-b last:border-0 pb-2 last:pb-0">
                  <span>{s.nome_socio}</span>
                  <span className="text-zinc-500 text-right">{s.qualificacao_socio}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-sm text-zinc-600 text-center">
            Site público no ar em:
          </p>
          <a
            href={urlPublica}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline underline-offset-4 break-all text-center"
          >
            {urlPublica}
          </a>
          <div className="flex gap-3 pt-1">
            <Button asChild>
              <a href={urlPublica} target="_blank" rel="noopener noreferrer">Ver site</a>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/${site.slug}`}>Editar no painel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{rotulo}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}
