import {
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  Divide,
  Grid3x3,
  Minus,
  Sigma,
} from "lucide-react";

import { MatrixGrid } from "@/components/MatrixGrid";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatNumber } from "@/lib/matrix";
import { cn } from "@/lib/utils";
import { isQRResult, type ProcessResponse, type Statistics } from "@/lib/types";

/** Tarjeta para una estadística individual. */
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 transition-colors hover:border-foreground/25">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 font-mono text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function StatisticsPanel({ statistics }: { statistics: Statistics }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        icon={ArrowUpToLine}
        label="Máximo"
        value={formatNumber(statistics.max)}
      />
      <StatCard
        icon={ArrowDownToLine}
        label="Mínimo"
        value={formatNumber(statistics.min)}
      />
      <StatCard
        icon={Divide}
        label="Promedio"
        value={formatNumber(statistics.average)}
      />
      <StatCard
        icon={Sigma}
        label="Suma total"
        value={formatNumber(statistics.sum)}
      />
      <StatCard
        icon={Grid3x3}
        label="¿Diagonal?"
        value={statistics.isDiagonal ? "Sí" : "No"}
      />
    </div>
  );
}

/** Encabezado de sección con una línea de título consistente. */
function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}

/**
 * Muestra la respuesta de la API: primero la transformación y después las
 * estadísticas, que son los dos bloques que devuelve `POST /process`.
 */
export function ResultPanel({ data }: { data: ProcessResponse }) {
  const { transformation, statistics } = data;
  const { result } = transformation;
  const isQR = isQRResult(result);

  return (
    <div className="flex flex-col gap-7 duration-500 animate-in fade-in slide-in-from-bottom-2">
      <section className="flex flex-col gap-4">
        <SectionTitle
          right={
            <Badge variant="secondary" className="font-mono">
              {transformation.mode}
              {transformation.degrees !== undefined && ` · ${transformation.degrees}°`}
            </Badge>
          }
        >
          Transformación
        </SectionTitle>

        {isQR ? (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            <MatrixGrid matrix={result.Q} label="Q" />
            <MatrixGrid matrix={result.R} label="R" />
          </div>
        ) : (
          <MatrixGrid matrix={result} />
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <SectionTitle
          right={
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs",
                statistics.isDiagonal ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {statistics.isDiagonal ? (
                <>
                  <Check className="size-3.5" /> matriz diagonal
                </>
              ) : (
                <>
                  <Minus className="size-3.5" /> no diagonal
                </>
              )}
            </span>
          }
        >
          Estadísticas
        </SectionTitle>

        <StatisticsPanel statistics={statistics} />

        <p className="text-xs text-muted-foreground">
          {isQR
            ? "Calculadas por la API Node sobre los valores combinados de Q y R."
            : "Calculadas por la API Node sobre la matriz transformada."}
        </p>
      </section>
    </div>
  );
}
