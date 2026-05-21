import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { siteParaUsuario } from "@/lib/auth";
import { AutoRefresh } from "../auto-refresh";

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <header className="space-y-2">
        <Link href={`/app/${slug}`} className="text-xs text-zinc-500 underline">← Editar site</Link>
        <h1 className="text-2xl font-semibold tracking-tight">Caixa de entrada</h1>
        <p className="text-sm text-zinc-500">
          Recebe em <code className="bg-zinc-100 px-1.5 py-0.5 rounded">{endereco}</code> (e qualquer endereço{" "}
          <code className="bg-zinc-100 px-1.5 py-0.5 rounded">@{site.slug}.{ROOT}</code>). Bom pra códigos de verificação.
        </p>
        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Atualiza sozinha. Os emails novos aparecem aqui em segundos, sem recarregar.
        </p>
      </header>

      <AutoRefresh />

      {emails.length === 0 ? (
        <div className="border border-dashed border-zinc-300 bg-white rounded-lg p-10 text-center text-sm text-zinc-500">
          Nenhum email recebido ainda. Use <strong>{endereco}</strong> em cadastros e verificações.
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white divide-y divide-zinc-100">
          {emails.map((e) => {
            const inicial = (e.fromAddr.trim()[0] || "?").toUpperCase();
            return (
              <div
                key={e.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors ${e.lido ? "" : "bg-emerald-50/50"}`}
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 text-sm font-semibold">
                  {inicial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={`truncate text-sm ${e.lido ? "text-zinc-700" : "font-semibold text-zinc-900"}`}>
                      {e.fromAddr}
                    </span>
                    <span className="text-xs text-zinc-400 shrink-0">
                      {e.createdAt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`truncate text-sm ${e.lido ? "text-zinc-600" : "font-medium text-zinc-900"}`}>
                    {e.subject || "(sem assunto)"}
                  </div>
                  {e.codigo ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500 uppercase tracking-wide">Código</span>
                      <span className="font-mono text-base font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
                        {e.codigo}
                      </span>
                    </div>
                  ) : null}
                  {e.texto ? <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{e.texto}</p> : null}
                </div>
                {!e.lido ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
