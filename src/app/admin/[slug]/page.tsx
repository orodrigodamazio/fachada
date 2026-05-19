import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatarCnpj } from "@/lib/cnpj";
import { EditForm } from "./edit-form";
import { UploadImagem } from "./upload-imagem";
import { alternarAtivo, deletarSite } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      leads: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { leads: true } },
    },
  });
  if (!site) notFound();

  const toggle = alternarAtivo.bind(null, slug);
  const remover = deletarSite.bind(null, slug);

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link href="/admin" className="text-xs text-zinc-500 underline">← Admin</Link>
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
              href={`/s/${site.slug}`}
              className="inline-flex items-center h-9 px-3 rounded-md border border-zinc-300 text-xs font-medium hover:bg-zinc-100"
            >
              Ver site
            </Link>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <UploadImagem slug={site.slug} tipo="logo" rotulo="Logo" urlAtual={site.logoUrl} aspectRatio="square" />
          <UploadImagem slug={site.slug} tipo="hero" rotulo="Imagem do hero" urlAtual={site.heroImageUrl} aspectRatio="wide" />
        </div>

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
      </div>
    </div>
  );
}
