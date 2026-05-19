import { CnpjForm } from "./_components/cnpj-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Fachada</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Gera site institucional a partir do CNPJ — pronto pra verificação Meta.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Novo site</CardTitle>
            <CardDescription>Informe o CNPJ. Buscamos os dados na Receita.</CardDescription>
          </CardHeader>
          <CardContent>
            <CnpjForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
