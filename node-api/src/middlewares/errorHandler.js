import { config } from '../config.js';
import { ApiError } from '../utils/errors.js';

/**
 * Manejador central de errores.
 *
 * Unifica la forma de todas las respuestas de error del servicio:
 * `{ error: { code, message, details? } }`. Tener un unico punto de salida
 * evita que cada controlador arme su propio formato.
 */
// eslint-disable-next-line no-unused-vars -- Express identifica el handler de errores por su aridad de 4.
export const errorHandler = (err, _req, res, _next) => {
  // El body-parser de Express lanza un SyntaxError cuando el JSON recibido
  // esta mal formado. Se traduce a un 400 explicito en vez de un 500.
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'El body recibido no es JSON valido.' },
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  // Cualquier otro error es inesperado: se registra completo en el servidor y
  // se responde de forma generica para no filtrar detalles internos.
  console.error('[error] Error no controlado:', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrio un error interno en el servicio.',
      ...(config.nodeEnv !== 'production' && { details: { message: err.message } }),
    },
  });
};
