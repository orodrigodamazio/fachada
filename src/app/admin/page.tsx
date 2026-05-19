import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarCnpj } from "@/lib/cnpj";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      cnpj: true,
      razaoSocial: true,
      nomeFantasia: true,
      ativo: true,
      dominioProprio: true,
      dominioStatus: true,
      createdAt: true,
      _count: { select: { leads: true } },
    },
  });

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="text-sm text-zinc-500">{sites.length} site(s) cadastrado(s)</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center h-9 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
          >
            Novo site
          </Link>
        </header>

        <div className="border border-zinc-200 bg-white rounded-lg overflow-hidden">
          {sites.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500">
              Nenhum site ainda. <Link className="underline" href="/">Criar o primeiro</Link>.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Empresa</th>
                  <th className="text-left px-4 py-2 font-medium">CNPJ</th>
                  <th className="text-left px-4 py-2 font-medium">Domínio</th>
                  <th className="text-left px-4 py-2 font-medium">Leads</th>
                  <th className="text-left px-4 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sites.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.nomeFantasia || s.razaoSocial}</div>
                      <div className="text-xs text-zinc-500">{s.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{formatarCnpj(s.cnpj)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {s.dominioProprio ? (
                        <span>
                          {s.dominioProprio}
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-zinc-500">
                            {s.dominioStatus}
                          </span>
                        </span>
                      ) : (
                        <span className="text-zinc-400">— subdomínio padrão</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{s._count.leads}</td>
                    <td className="px-4 py-3 flex gap-3">
                      <Link className="text-zinc-700 underline" href={`/admin/${s.slug}`}>Editar</Link>
                      <Link className="text-zinc-700 underline" href={`/preview/${s.slug}`}>Preview</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
