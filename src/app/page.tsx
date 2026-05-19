import { prisma } from "@/lib/prisma";
import { CnpjForm } from "./_components/cnpj-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fachada — gerador de site institucional por CNPJ",
  description: "Gere um site institucional pronto pra verificação Meta a partir do CNPJ. LGPD, termos, contato e SEO incluídos.",
};

export default async function Home() {
  const total = await prisma.site.count({ where: { ativo: true } }).catch(() => 0);

  return (
    <div className="min-h-dvh bg-zinc-50">
      <main className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-5 items-start">
          <section className="md:col-span-3 space-y-6">
            <header className="space-y-3">
              <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Fachada</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-zinc-900">
                Site institucional pronto<br />a partir do CNPJ.
              </h1>
              <p className="text-lg text-zinc-700 leading-relaxed">
                Digita o CNPJ. Em segundos, sai um site institucional completo, com hero, sobre, serviços,
                contato, política de privacidade e termos. Pronto pra verificação Meta.
              </p>
            </header>

            <ul className="space-y-3 text-sm text-zinc-700">
              <Item>Dados consultados na Receita Federal em tempo real</Item>
              <Item>Páginas LGPD + Termos geradas com CNPJ visível</Item>
              <Item>SEO: sitemap.xml, robots.txt, Open Graph, JSON-LD Schema.org</Item>
              <Item>Subdomínio próprio com HTTPS automático</Item>
              <Item>Painel pra editar textos, logo e hero. IA opcional pra preencher</Item>
            </ul>

            {total > 0 ? (
              <p className="text-xs text-zinc-500">{total} site(s) no ar agora.</p>
            ) : null}
          </section>

          <section className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Gerar agora</CardTitle>
                <CardDescription>Informe o CNPJ. Buscamos os dados na Receita.</CardDescription>
              </CardHeader>
              <CardContent>
                <CnpjForm />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>Fachada © {new Date().getFullYear()}</span>
          <nav className="flex gap-4">
            <a href="/status" className="hover:text-zinc-900">Status</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-zinc-900 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
