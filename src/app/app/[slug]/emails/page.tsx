import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { siteParaUsuario } from "@/lib/auth";
import { AutoRefresh } from "../auto-refresh";
import { CopyEmail } from "../copy-email";
import { InboxClient, type EmailItem } from "../inbox-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Caixa de entrada | Vertente" };

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAINS ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "vertentebr.com.br")
  .split(",")[0]
  .trim();

export default async function InboxPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { site } = await siteParaUsuario(slug);

  const emails = await prisma.emailMessage.findMany({
    where: { siteId: site.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  // marca os não-lidos como lidos ao abrir a caixa
  if (emails.some((e) => !e.lido)) {
    await prisma.emailMessage.updateMany({ where: { siteId: site.id, lido: false }, data: { lido: true } });
  }

  const endereco = `contato@${site.slug}.${ROOT}`;

  const itens: EmailItem[] = emails.map((e) => ({
    id: e.id,
    fromAddr: e.fromAddr,
    toAddr: e.toAddr,
    subject: e.subject,
    texto: e.texto ?? "",
    codigo: e.codigo,
    lido: e.lido,
    data: e.createdAt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    dataLonga: e.createdAt.toLocaleString("pt-BR"),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <Link href={`/app/${slug}`} className="text-xs text-zinc-500 underline">← Editar site</Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">Caixa de entrada</h1>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700" title="Atualiza sozinha">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ao vivo
          </span>
        </div>
        <CopyEmail endereco={endereco} />
      </header>

      <AutoRefresh />

      {emails.length === 0 ? (
        <div className="border border-dashed border-zinc-300 bg-white rounded-lg p-10 text-center text-sm text-zinc-500">
          Nenhum email recebido ainda. Use <strong>{endereco}</strong> em cadastros e verificações.
        </div>
      ) : (
        <InboxClient emails={itens} />
      )}
    </div>
  );
}
