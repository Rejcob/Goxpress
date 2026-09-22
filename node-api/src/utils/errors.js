/**
 * Error de aplicacion con status HTTP y codigo de error asociado.
 *
 * Permite que la capa de dominio (validacion, servicios) lance errores
 * semanticos sin conocer Express, y que el manejador central de errores
 * los traduzca a una respuesta HTTP coherente.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode Codigo HTTP a devolver.
   * @param {string} code Codigo de error estable, pensado para consumo por clientes.
   * @param {string} message Mensaje legible que explica el problema.
   * @param {object} [details] Informacion adicional opcional sobre el error.
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /** Atajo para los errores de validacion de entrada (HTTP 400). */
  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }
}
