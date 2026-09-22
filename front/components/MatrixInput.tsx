"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SIZE, MIN_SIZE, setCell } from "@/lib/matrix";
import type { Matrix } from "@/lib/types";

interface MatrixInputProps {
  matrix: Matrix;
  onChange: (matrix: Matrix) => void;
  onResize: (rows: number, columns: number) => void;
  disabled?: boolean;
}

/** Control de dimensión con botones de incremento y decremento. */
function SizeControl({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-0.5 rounded-lg border bg-card p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`Quitar ${label.toLowerCase()}`}
          onClick={() => onChange(value - 1)}
          disabled={disabled || value <= MIN_SIZE}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-7 text-center font-mono text-sm font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={`Agregar ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
          disabled={disabled || value >= MAX_SIZE}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Editor de la matriz de entrada: controles de dimensión y una celda editable
 * por cada posición.
 */
export function MatrixInput({ matrix, onChange, onResize, disabled }: MatrixInputProps) {
  const rows = matrix.length;
  const columns = matrix[0]?.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <SizeControl
          label="Filas"
          value={rows}
          onChange={(value) => onResize(value, columns)}
          disabled={disabled}
        />
        <SizeControl
          label="Columnas"
          value={columns}
          onChange={(value) => onResize(rows, value)}
          disabled={disabled}
        />
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="grid w-fit gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {matrix.map((row, i) =>
            row.map((value, j) => (
              <Input
                key={`${i}-${j}`}
                type="number"
                step="any"
                value={value}
                disabled={disabled}
                aria-label={`Fila ${i + 1}, columna ${j + 1}`}
                onFocus={(event) => event.target.select()}
                onChange={(event) =>
                  // Un campo vacío se trata como 0: la API rechaza valores no
                  // numéricos, y dejar NaN rompería el envío.
                  onChange(setCell(matrix, i, j, Number(event.target.value) || 0))
                }
                className="h-11 w-[4.5rem] px-1 text-center font-mono text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}
