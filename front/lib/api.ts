import type { ApiErrorBody, Degrees, Matrix, Mode, ProcessResponse } from "./types";

/**
 * URL base de la API de matrices.
 *
 * Es `NEXT_PUBLIC_*` porque la llamada la hace el navegador, no el servidor de
 * Next: el valor tiene que llegar al bundle del cliente.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Error de la API con su código estable, para poder mostrarlo tal cual en la
 * interfaz en lugar de un mensaje genérico.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ProcessInput {
  matrix: Matrix;
  mode: Mode;
  degrees?: Degrees;
}

/**
 * Llama a `POST /process` de la API Go.
 *
 * La API Go aplica la transformación, consulta las estadísticas a la API Node y
 * devuelve ambos bloques combinados: el frontend hace una sola llamada.
 */
export async function processMatrix({
  matrix,
  mode,
  degrees,
}: ProcessInput): Promise<ProcessResponse> {
  // 'degrees' solo aplica al modo rotación; en factqr la API lo ignora.
  const body = mode === "rotate" ? { matrix, mode, degrees } : { matrix, mode };

  let response: Response;
  try {
    response = await fetch(`${API_URL}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch solo rechaza ante fallos de red, CORS o DNS: nunca por un status
    // de error, que sí llega como respuesta.
    throw new ApiError(
      "NETWORK_ERROR",
      `No se pudo contactar la API en ${API_URL}. Verifica que esté levantada.`,
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = (payload as ApiErrorBody | null)?.error;
    throw new ApiError(
      apiError?.code ?? "UNKNOWN_ERROR",
      apiError?.message ?? `La API respondió con estado ${response.status}.`,
      apiError?.details,
    );
  }

  return payload as ProcessResponse;
}

export { API_URL };
