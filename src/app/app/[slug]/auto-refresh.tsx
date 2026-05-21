"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Atualiza a caixa de entrada sozinha (sem recarregar a mão) pra o código
// de verificação aparecer assim que chega.
export function AutoRefresh({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
