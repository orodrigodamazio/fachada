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
        <ul className="space-y-3">
          {emails.map((e) => (
            <li key={e.id} className={`border rounded-lg p-4 ${e.lido ? "border-zinc-200 bg-white" : "border-zinc-300 bg-zinc-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">{e.subject || "(sem assunto)"}</div>
                  <div className="text-xs text-zinc-500 truncate">de {e.fromAddr} · para {e.toAddr}</div>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">{e.createdAt.toLocaleString("pt-BR")}</span>
              </div>

              {e.codigo ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Código</span>
                  <span className="font-mono text-lg font-bold tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded">
                    {e.codigo}
                  </span>
                </div>
              ) : null}

              {e.texto ? (
                <p className="mt-3 text-sm text-zinc-600 whitespace-pre-wrap line-clamp-6">{e.texto}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
