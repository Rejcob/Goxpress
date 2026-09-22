import { ApiError } from '../utils/errors.js';

/**
 * Modos soportados en el contrato con la API Go.
 *
 * - `rotate`: el campo `result` es una unica matriz (array de arrays).
 * - `factqr`: el campo `result` es un objeto con las matrices `Q` y `R`.
 */
export const MODES = Object.freeze({
  ROTATE: 'rotate',
  FACTQR: 'factqr',
});

const SUPPORTED_MODES = Object.values(MODES);

/**
 * Valida que el valor recibido sea una matriz rectangular de numeros finitos.
 *
 * Se exige que todas las filas tengan la misma longitud: una matriz "irregular"
 * no representa una matriz valida y haria que las estadisticas fueran ambiguas.
 *
 * @param {unknown} value Valor a validar.
 * @param {string} label Nombre del campo, usado en los mensajes de error.
 * @returns {number[][]} La misma matriz, ya validada.
 */
export const assertMatrix = (value, label) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw ApiError.badRequest(
      'INVALID_MATRIX',
      `'${label}' debe ser un array de arrays de numeros y no puede estar vacio.`,
    );
  }

  const columns = Array.isArray(value[0]) ? value[0].length : -1;

  if (columns <= 0) {
    throw ApiError.badRequest(
      'INVALID_MATRIX',
      `'${label}' debe contener al menos una fila con al menos una columna.`,
    );
  }

  value.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      throw ApiError.badRequest(
        'INVALID_MATRIX',
        `'${label}[${rowIndex}]' debe ser un array de numeros.`,
      );
    }

    if (row.length !== columns) {
      throw ApiError.badRequest(
        'NON_RECTANGULAR_MATRIX',
        `'${label}' debe ser rectangular: la fila ${rowIndex} tiene ${row.length} columnas y se esperaban ${columns}.`,
      );
    }

    row.forEach((cell, columnIndex) => {
      // Se rechaza NaN e Infinity ademas de los tipos no numericos: ambos
      // contaminarian la suma y el promedio sin que el error sea evidente.
      if (typeof cell !== 'number' || !Number.isFinite(cell)) {
        throw ApiError.badRequest(
          'INVALID_MATRIX_VALUE',
          `'${label}[${rowIndex}][${columnIndex}]' debe ser un numero finito.`,
          { received: cell },
        );
      }
    });
  });

  return value;
};

/**
 * Valida el body recibido de la API Go y lo normaliza a una lista uniforme
 * de matrices con nombre.
 *
 * Normalizar aqui permite que el servicio de estadisticas trabaje siempre
 * sobre la misma estructura, sin ramificar por modo.
 *
 * @param {unknown} body Body de la peticion.
 * @returns {{ mode: string, matrices: { name: string, matrix: number[][] }[] }}
 */
export const parseStatsPayload = (body) => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest(
      'INVALID_BODY',
      'El body debe ser un objeto JSON con los campos "mode" y "result".',
    );
  }

  const { mode, result } = body;

  if (!SUPPORTED_MODES.includes(mode)) {
    throw ApiError.badRequest(
      'INVALID_MODE',
      `'mode' debe ser uno de: ${SUPPORTED_MODES.join(', ')}.`,
      { received: mode },
    );
  }

  if (mode === MODES.ROTATE) {
    return {
      mode,
      matrices: [{ name: 'result', matrix: assertMatrix(result, 'result') }],
    };
  }

  // mode === factqr: se esperan las dos matrices de la factorizacion.
  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    throw ApiError.badRequest(
      'INVALID_RESULT',
      "Para mode='factqr', 'result' debe ser un objeto con las matrices 'Q' y 'R'.",
    );
  }

  return {
    mode,
    matrices: [
      { name: 'Q', matrix: assertMatrix(result.Q, 'result.Q') },
      { name: 'R', matrix: assertMatrix(result.R, 'result.R') },
    ],
  };
};
