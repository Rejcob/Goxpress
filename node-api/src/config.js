/**
 * Config centralizada del servicio.
 *
 * Todos los valores se leen de variables de entorno y tienen un default
 * razonable para desarrollo local, asi el servicio puede arranca sin
 * necesidad de un .env.
 */

/** Leemos variable de entorno numerica, cae al default si es invlaida. */
const readNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  /** Puerto del servicio. */
  port: readNumber(process.env.PORT, 3001),

  /** Entorno: afecta el nivel de detalle de los errores. */
  nodeEnv: process.env.NODE_ENV ?? 'development',

  /**
   * Tolerancia usada para comparar contra cero al verificar si una matriz
   * es diagonal.
   *
   * Se usa una tolerancia en lugar de comparar contra 0 exacto porque la
   * factorizacion QR produce valores flotantes: un cero llega como
   * 2.22e-16 y una comparacion estricta lo consideraria no nulo.
   */
  zeroTolerance: readNumber(process.env.ZERO_TOLERANCE, 1e-9),

  /**
   * Numero de decimales al que se redondean las estadisticas de salida.
   *
   * Evita exponer ruido de punto flotante del tipo 4.999999999999999 en
   * la respuesta, sin perder precision util.
   */
  outputPrecision: readNumber(process.env.OUTPUT_PRECISION, 10),

  /** Tamano maximo del body JSON aceptado. */
  bodyLimit: process.env.BODY_LIMIT ?? '5mb',
};
