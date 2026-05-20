import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 flex flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
            Fachada
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
