import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Stage = "idle" | "running" | "done";

const NODES = [
  { label: "Navegador", detail: "Next.js" },
  { label: "API Go", detail: "Fiber" },
  { label: "API Node", detail: "Express" },
];

/**
 * Representa el recorrido de la petición entre los tres servicios.
 *
 * Hace visible la arquitectura del reto: el navegador hace una sola llamada a
 * la API Go, y es esa API la que consulta a la API Node.
 */
export function Pipeline({ stage }: { stage: Stage }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
      {NODES.map((node, index) => (
        <div key={node.label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
              stage === "running" && "border-foreground/40 bg-muted",
              stage === "done" && "border-foreground/15 bg-card",
              stage === "idle" && "bg-card/50",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                stage === "running" ? "animate-pulse bg-foreground" : "bg-muted-foreground/50",
              )}
            />
            <span className="font-medium">{node.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{node.detail}</span>
          </div>

          {index < NODES.length - 1 && (
            <ArrowRight
              className={cn(
                "size-3.5 shrink-0 transition-colors",
                stage === "running" ? "text-foreground" : "text-muted-foreground/40",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
