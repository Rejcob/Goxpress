"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Play, RotateCw } from "lucide-react";

import { MatrixInput } from "@/components/MatrixInput";
import { Pipeline } from "@/components/Pipeline";
import { ResultPanel } from "@/components/ResultPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ApiError, API_URL, processMatrix } from "@/lib/api";
import { MAX_SIZE, MIN_SIZE, PRESETS, resizeMatrix } from "@/lib/matrix";
import { DEGREES, type Degrees, type Matrix, type Mode, type ProcessResponse } from "@/lib/types";

/** Pantalla principal: se introduce una matriz y se consulta la API. */
export function Playground() {
  const [matrix, setMatrix] = useState<Matrix>(PRESETS[0].matrix);
  const [mode, setMode] = useState<Mode>("rotate");
  const [degrees, setDegrees] = useState<Degrees>(90);

  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  /** Cambia las dimensiones conservando los valores que siguen cabiendo. */
  function handleResize(rows: number, columns: number) {
    const clamp = (value: number) => Math.min(Math.max(value, MIN_SIZE), MAX_SIZE);
    setMatrix(resizeMatrix(matrix, clamp(rows), clamp(columns)));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      setResult(await processMatrix({ matrix, mode, degrees }));
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught
          : new ApiError("UNEXPECTED_ERROR", "Ocurrió un error inesperado."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Transformación de matrices
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            Introduce una matriz y elige la operación. La API en Go la transforma, le pide las
            estadísticas a la API en Node y devuelve ambos resultados en una sola respuesta.
          </p>
        </div>

        <Pipeline stage={loading ? "running" : result ? "done" : "idle"} />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-6 p-5 sm:p-7">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Matriz de entrada
              </h2>
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                POST {API_URL}/process
              </code>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  title={preset.description}
                  disabled={loading}
                  onClick={() => setMatrix(preset.matrix)}
                  className="h-7 rounded-full px-3 text-xs font-normal"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <MatrixInput
            matrix={matrix}
            onChange={setMatrix}
            onResize={handleResize}
            disabled={loading}
          />

          <Separator />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Operación
              </span>
              {/* Base UI maneja el valor como array incluso en seleccion unica. */}
              <ToggleGroup
                value={[mode]}
                onValueChange={(value) => value[0] && setMode(value[0] as Mode)}
                disabled={loading}
                variant="outline"
                className="w-fit"
              >
                <ToggleGroupItem value="rotate" className="gap-1.5 px-4">
                  <RotateCw className="size-3.5" />
                  Rotación
                </ToggleGroupItem>
                <ToggleGroupItem value="factqr" className="px-4">
                  Factorización QR
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* El ángulo solo aplica a la rotación; en factqr la API lo ignora. */}
            {mode === "rotate" ? (
              <div className="flex flex-col gap-2.5 duration-300 animate-in fade-in">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ángulo
                </span>
                <ToggleGroup
                  value={[String(degrees)]}
                  onValueChange={(value) => value[0] && setDegrees(Number(value[0]) as Degrees)}
                  disabled={loading}
                  variant="outline"
                  className="w-fit"
                >
                  {DEGREES.map((value) => (
                    <ToggleGroupItem key={value} value={String(value)} className="w-16 font-mono">
                      {value}°
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground duration-300 animate-in fade-in">
                La factorización QR requiere al menos tantas filas como columnas.
              </p>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gap-2 sm:w-auto sm:self-start"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                <Play className="size-4" />
                Procesar matriz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="duration-300 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-4" />
          <AlertTitle className="font-mono text-xs tracking-wide">{error.code}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent className="p-5 sm:p-7">
            <ResultPanel data={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
