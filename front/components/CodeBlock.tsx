"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  /** Etiqueta opcional sobre el bloque, por ejemplo "Request" o "Response 200". */
  label?: string;
  className?: string;
}

/** Bloque de código con botón para copiarlo al portapapeles. */
export function CodeBlock({ code, label, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // El aviso vuelve a su estado inicial solo: no necesita confirmación.
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // El portapapeles puede estar bloqueado por permisos; no es crítico.
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}

      <div className="group relative">
        <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3.5 pr-12 font-mono text-xs leading-relaxed">
          <code>{code}</code>
        </pre>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copiar"
          onClick={handleCopy}
          className="absolute right-1.5 top-1.5 size-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}
