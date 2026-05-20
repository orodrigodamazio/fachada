import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatarCnpj } from "@/lib/cnpj";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CnpjForm } from "../_components/cnpj-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Meus sites | Fachada" };

const STATUS_DOMINIO: Record<string, string> = {
  NAO_CADASTRADO: "subdomínio padrão",
  PENDENTE_DNS: "DNS pendente",
  VERIFICADO: "domínio ativo",
  FALHA: "falha no DNS",
};

export default async function AppDashboard() {
  const user = await requireUser();
  const sites = await prisma.site.findMany({
    where: { userId: user.id },
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
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid gap-8 md:grid-cols-5 items-start">
        <section className="md:col-span-3 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Meus sites</h1>
            <p className="text-sm text-zinc-500">
              {sites.length === 0
                ? "Você ainda não criou nenhum site."
                : `${sites.length} site(s) na sua conta.`}
            </p>
          </div>

          {sites.length === 0 ? (
            <div className="border border-dashed border-zinc-300 bg-white rounded-lg p-10 text-center text-sm text-zinc-500">
              Comece criando o site da sua empresa pelo CNPJ.
            </div>
          ) : (
            <ul className="space-y-3">
              {sites.map((s) => (
                <li
                  key={s.id}
                  className="border border-zinc-200 bg-white rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-zinc-900 truncate">
                      {s.nomeFantasia || s.razaoSocial}
                    </div>
                    <div className="text-xs text-zinc-500">
                      CNPJ {formatarCnpj(s.cnpj)} ·{" "}
                      {s.dominioProprio ?? `${s.slug}`} · {STATUS_DOMINIO[s.dominioStatus] ?? ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium ${
                        s.ativo ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {s.ativo ? "no ar" : "inativo"}
                    </span>
                    <Link
                      href={`/s/${s.slug}`}
                      className="text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/app/${s.slug}`}
                      className="inline-flex items-center h-8 px-3 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
                    >
                      Editar
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo site</CardTitle>
              <CardDescription>Informe o CNPJ. Buscamos os dados na Receita e montamos o site.</CardDescription>
            </CardHeader>
            <CardContent>
              <CnpjForm />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
