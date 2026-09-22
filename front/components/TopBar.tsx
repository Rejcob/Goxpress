"use client";

import { BookText, Grid2x2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type Tab = "playground" | "docs";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "playground", label: "Probar", icon: Grid2x2 },
  { id: "docs", label: "API", icon: BookText },
];

interface TopBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

/** Barra superior con el nombre del proyecto y el cambio entre pestañas. */
export function TopBar({ active, onChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold tracking-tight">Matrices</span>

        <nav className="flex items-center gap-1" aria-label="Secciones">
          {TABS.map((tab) => {
            const isActive = tab.id === active;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
