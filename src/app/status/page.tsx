export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; ms?: number; detail?: string };
type Health = { status: "ok" | "degraded"; uptime: number; version: string; checks: Check[] };

async function fetchHealth(host: string | null): Promise<Health | null> {
  const base = host ? `https://${host}` : "http://127.0.0.1:3000";
  try {
    const r = await fetch(`${base}/api/health?verbose=1`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return (await r.json()) as Health;
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("host");
  const data = await fetchHealth(host);

  return (
    <div className="min-h-dvh bg-zinc-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Status</h1>
          <p className="text-sm text-zinc-500">Verificação em tempo real dos componentes da plataforma.</p>
        </header>

        {!data ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900 text-sm">
            Não foi possível obter o estado do sistema.
          </div>
        ) : (
          <>
            <div
              className={`rounded-lg border p-5 ${
                data.status === "ok" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider">
                    {data.status === "ok" ? "Operacional" : "Degradado"}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">Uptime: {data.uptime}s · Versão: {data.version}</p>
                </div>
                <span
                  className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-medium ${
                    data.status === "ok" ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {data.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="border border-zinc-200 bg-white rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Componente</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Latência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.checks.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center h-6 px-2 rounded-full text-xs font-medium ${
                            c.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {c.ok ? "OK" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{c.ms ?? "—"}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
