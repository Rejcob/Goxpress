/**
 * Contratos de la API de matrices (Go).
 *
 * Replican la forma de las respuestas documentadas en `go-api/README.md`, para
 * que el frontend trabaje con tipos y no con `any`.
 */

/** Modos de transformación soportados por la API. */
export type Mode = "rotate" | "factqr";

/** Ángulos de rotación aceptados. 360 no se soporta: es la identidad. */
export const DEGREES = [90, 180, 270] as const;
export type Degrees = (typeof DEGREES)[number];

export type Matrix = number[][];

/** Resultado de la factorización QR: dos matrices. */
export interface QRResult {
  Q: Matrix;
  R: Matrix;
}

/**
 * Bloque de transformación. `result` es polimórfico según el modo: una matriz
 * para "rotate", un objeto con Q y R para "factqr".
 */
export interface Transformation {
  mode: Mode;
  degrees?: number;
  result: Matrix | QRResult;
}

/** Estadísticas calculadas por la API Node. */
export interface Statistics {
  max: number;
  min: number;
  average: number;
  sum: number;
  isDiagonal: boolean;
}

/** Respuesta exitosa de POST /process. */
export interface ProcessResponse {
  transformation: Transformation;
  statistics: Statistics;
}

/** Cuerpo de error, con el mismo formato en ambas APIs. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Distingue el resultado de QR de una matriz simple en tiempo de ejecución. */
export function isQRResult(result: Matrix | QRResult): result is QRResult {
  return !Array.isArray(result);
}
