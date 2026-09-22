import { ApiError } from '../utils/errors.js';

/** Convierte cualquier ruta no declarada en un error 404 con el mismo formato. */
export const notFound = (req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};
