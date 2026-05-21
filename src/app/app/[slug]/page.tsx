import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarCnpj } from "@/lib/cnpj";
import { urlPublica } from "@/lib/site-loader";
import { siteParaUsuario } from "@/lib/auth";
import { paletaDoSite } from "@/lib/palette";
import { CoresForm } from "./cores-form";
import { ContatoForm } from "./contato-form";
import { PreviewFrame } from "./preview-frame";
import { SplitEditor } from "./split-editor";
import { EditForm } from "./edit-form";
import { UploadImagem } from "./upload-imagem";
import { DominioForm } from "./dominio-form";
import { TrackingForm } from "./tracking-form";
import { alternarAtivo, deletarSite } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditarSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { site, user } = await siteParaUsuario(slug);
  const ehAdmin = user.role === "ADMIN";
  const cores = paletaDoSite(site);
  const novosEmails = await prisma.emailMessage.count({ where: { siteId: site.id, lido: false } });

  const toggle = alternarAtivo.bind(null, slug);
  const remover = deletarSite.bind(null, slug);

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link href={ehAdmin ? "/admin" : "/app"} className="text-xs text-zinc-500 underline">
              {ehAdmin ? "← Admin" : "← Meus sites"}
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">
              {site.nomeFantasia || site.razaoSocial}
            </h1>
            <p className="text-sm text-zinc-500">
              {site.razaoSocial} · CNPJ {formatarCnpj(site.cnpj)} · slug <code>{site.slug}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-medium ${
                site.ativo ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {site.ativo ? "Ativo" : "Inativo"}
            </span>
            <Link
              href={`/app/${site.slug}/emails`}
              className="relative inline-flex items-center h-9 px-3 rounded-md border border-zinc-300 text-xs font-medium hover:bg-zinc-100"
            >
              Caixa de entrada
              {novosEmails > 0 ? (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {novosEmails}
                </span>
              ) : null}
            </Link>
            <a
              href={urlPublica(site)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-9 px-3 rounded-md border border-zinc-300 text-xs font-medium hover:bg-zinc-100"
            >
              Ver site
            </a>
          </div>
        </header>

        {!site.ativo ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-amber-900">Rascunho — ainda não publicado</p>
              <p className="text-sm text-amber-800">
                Revise as informações abaixo e publique quando estiver pronto. Enquanto rascunho, o site não fica público.
              </p>
            </div>
            <form action={toggle}>
              <button
                type="submit"
                className="inline-flex items-center h-10 px-5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                Publicar site
              </button>
            </form>
          </div>
        ) : null}

        <SplitEditor
          right={<PreviewFrame slug={site.slug} />}
          left={
            <>
        <div className="grid gap-6 sm:grid-cols-2">
          <UploadImagem slug={site.slug} tipo="logo" rotulo="Logo" urlAtual={site.logoUrl} aspectRatio="square" />
          <UploadImagem slug={site.slug} tipo="hero" rotulo="Imagem do hero" urlAtual={site.heroImageUrl} aspectRatio="wide" />
        </div>

        <CoresForm slug={site.slug} primaria={cores.primaria} secundaria={cores.secundaria} />

        <ContatoForm
          slug={site.slug}
          defaults={{
            whatsapp: site.whatsapp,
            email: site.emailContato,
            instagram: site.instagram,
            facebook: site.facebook,
            linkedin: site.linkedin,
            horarioAtend: site.horarioAtend,
          }}
        />

        <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-1.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Email profissional</h2>
          <p className="text-sm text-zinc-700">
            Já está ativo, de graça: <code className="bg-zinc-100 px-1.5 py-0.5 rounded">contato@{site.slug}.vertentebr.com.br</code>. Use em cadastros e para receber códigos de verificação.
          </p>
          <Link href={`/app/${site.slug}/emails`} className="inline-block text-sm font-medium underline underline-offset-2 text-zinc-900">
            Abrir caixa de entrada
          </Link>
        </section>

        <details className="rounded-lg">
          <summary className="cursor-pointer select-none text-sm font-semibold uppercase tracking-wider text-zinc-500 px-1 py-2 hover:text-zinc-700">
            Configurações avançadas · domínio próprio e rastreamento
          </summary>
          <div className="space-y-6 mt-3">
            <p className="text-sm text-zinc-500">
              Opcional. Seu site já funciona no subdomínio grátis. Configure um domínio próprio só se você já tem um domínio comprado.
            </p>
        <DominioForm
          slug={site.slug}
          dominioAtual={site.dominioProprio}
          status={site.dominioStatus}
          alvoCname={site.cnameAlvo}
          verificadoEm={site.dominioVerifEm}
        />

        <TrackingForm
          slug={site.slug}
          metaPixel={site.metaPixel}
          metaCapiToken={site.metaCapiToken}
          gaId={site.gaId}
        />
          </div>
        </details>

        <EditForm
          slug={site.slug}
          defaults={{
            heroTitulo: site.heroTitulo,
            heroSubtitulo: site.heroSubtitulo,
            sobre: site.sobre,
            missao: site.missao,
            visao: site.visao,
            rodape: site.rodape,
            metaTitle: site.metaTitle,
            metaDescription: site.metaDescription,
          }}
        />

        <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Leads ({site._count.leads})
            </h2>
          </header>
          {site.leads.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem leads ainda.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {site.leads.map((l) => (
                <li key={l.id} className="py-3 text-sm space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{l.nome}</span>
                    <span className="text-xs text-zinc-500">
                      {l.createdAt.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {[l.email, l.telefone].filter(Boolean).join(" · ")}
                  </div>
                  <p className="text-zinc-700 whitespace-pre-wrap">{l.mensagem}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-zinc-200 bg-white rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Operação</h2>
          <div className="flex flex-wrap gap-3">
            <form action={toggle}>
              <button
                type="submit"
                className="inline-flex items-center h-9 px-4 rounded-md border border-zinc-300 text-sm font-medium hover:bg-zinc-100"
              >
                {site.ativo ? "Desativar site" : "Ativar site"}
              </button>
            </form>
            <form action={remover}>
              <button
                type="submit"
                className="inline-flex items-center h-9 px-4 rounded-md border border-red-300 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Excluir permanentemente
              </button>
            </form>
          </div>
        </section>
            </>
          }
        />
      </div>
    </div>
  );
}
