import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "../(auth)/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-zinc-50 flex flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/app" className="text-sm font-semibold tracking-tight text-zinc-900">
            Fachada
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user?.role === "ADMIN" ? (
              <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
                Admin
              </Link>
            ) : null}
            {user?.email ? <span className="text-zinc-500 hidden sm:inline">{user.email}</span> : null}
            <form action={logout}>
              <button type="submit" className="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
