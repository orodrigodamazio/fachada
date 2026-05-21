"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Editor com painéis redimensionáveis: forms à esquerda, mockup à direita,
// divisória arrastável (largura persistida em localStorage). Empilha no mobile.
export function SplitEditor({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [pct, setPct] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const saved = Number(localStorage.getItem("vt-split-pct"));
    if (saved) setPct(Math.min(80, Math.max(35, saved)));
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const p = Math.min(80, Math.max(35, ((e.clientX - rect.left) / rect.width) * 100));
      setPct(p);
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      localStorage.setItem("vt-split-pct", String(Math.round(pct)));
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [pct]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row items-start"
      style={{ ["--lw" as string]: `${pct}%` } as React.CSSProperties}
    >
      <div className="w-full lg:w-[var(--lw)] min-w-0 space-y-6 lg:pr-2">{left}</div>

      <div
        onMouseDown={() => {
          dragging.current = true;
          document.body.style.userSelect = "none";
          document.body.style.cursor = "col-resize";
        }}
        className="hidden lg:flex w-3 shrink-0 self-stretch cursor-col-resize items-center justify-center group"
        title="Arraste para ajustar a largura"
        role="separator"
        aria-orientation="vertical"
      >
        <div className="w-1 h-20 rounded-full bg-zinc-300 group-hover:bg-zinc-500 transition-colors" />
      </div>

      <div className="w-full lg:flex-1 min-w-0 lg:pl-2 mt-6 lg:mt-0">
        <div className="lg:sticky lg:top-6">{right}</div>
      </div>
    </div>
  );
}
