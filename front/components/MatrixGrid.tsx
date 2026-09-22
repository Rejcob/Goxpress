import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/matrix";
import type { Matrix } from "@/lib/types";

interface MatrixGridProps {
  matrix: Matrix;
  /** Etiqueta opcional sobre la matriz (por ejemplo "Q" o "R"). */
  label?: string;
  className?: string;
}

/**
 * Muestra una matriz en modo lectura, entre los corchetes que se usan
 * habitualmente en notación matemática.
 */
export function MatrixGrid({ matrix, label, className }: MatrixGridProps) {
  const rows = matrix.length;
  const columns = matrix[0]?.length ?? 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-base font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {rows}×{columns}
          </span>
        </div>
      )}

      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
        <div className="matrix-bracket rounded-l-sm border-l-2" />

        <div
          className="grid gap-1.5 py-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {matrix.map((row, i) =>
            row.map((value, j) => (
              <span
                key={`${i}-${j}`}
                title={String(value)}
                className={cn(
                  "flex min-w-[4.5rem] items-center justify-center rounded-md px-2.5 py-2",
                  "bg-muted font-mono text-sm tabular-nums",
                  // La diagonal principal se resalta: es la que determina si la
                  // matriz es diagonal, que es una de las estadísticas pedidas.
                  i === j && "bg-foreground text-background",
                )}
              >
                {formatNumber(value)}
              </span>
            )),
          )}
        </div>

        <div className="matrix-bracket rounded-r-sm border-r-2" />
      </div>
    </div>
  );
}
