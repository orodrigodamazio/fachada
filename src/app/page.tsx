import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fachada — o site institucional da sua empresa, pronto em minutos",
  description:
    "Crie o site institucional da sua empresa a partir do CNPJ. Hero, sobre, serviços, contato, privacidade e termos. SEO, domínio próprio e e-mail profissional inclusos.",
};

export default async function Home() {
  const [total, user] = await Promise.all([
    prisma.site.count({ where: { ativo: true } }).catch(() => 0),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-dvh bg-zinc-50 flex flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-zinc-900">Fachada</span>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <Link href="/app" className="text-zinc-900 font-medium hover:underline">
                Ir para o painel
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center h-9 px-4 rounded-md bg-zinc-900 text-white font-medium hover:bg-zinc-800"
                >
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Presença online profissional</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-zinc-900">
              O site institucional da sua empresa, pronto em minutos.
            </h1>
            <p className="text-lg text-zinc-700 leading-relaxed">
              Informe o CNPJ e montamos um site institucional completo: hero, sobre, serviços, contato,
              política de privacidade e termos. Com a identidade visual da sua empresa, domínio próprio
              e e-mail profissional.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={user ? "/app" : "/signup"}
                className="inline-flex items-center h-11 px-6 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
              >
                {user ? "Ir para o painel" : "Criar meu site"}
              </Link>
              {!user ? (
                <Link
                  href="/login"
                  className="inline-flex items-center h-11 px-6 rounded-md border border-zinc-300 bg-white text-sm font-medium hover:bg-zinc-50"
                >
                  Já tenho conta
                </Link>
              ) : null}
            </div>
            {total > 0 ? <p className="text-xs text-zinc-500">{total} site(s) no ar agora.</p> : null}
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 mt-14 text-sm text-zinc-700">
            <Item titulo="Dados oficiais">Preenchimento automático com os dados públicos da Receita Federal.</Item>
            <Item titulo="Identidade própria">Paleta de cores gerada pra sua empresa, ajustável quando quiser.</Item>
            <Item titulo="SEO pronto">sitemap.xml, robots.txt, Open Graph e JSON-LD Schema.org inclusos.</Item>
            <Item titulo="Domínio e e-mail">Domínio próprio com HTTPS automático e e-mail profissional.</Item>
          </ul>
        </section>
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

function Item({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <li className="border border-zinc-200 bg-white rounded-lg p-4">
      <p className="font-medium text-zinc-900 mb-1">{titulo}</p>
      <p className="text-zinc-600">{children}</p>
    </li>
  );
}
