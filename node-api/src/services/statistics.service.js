import { config } from '../config.js';

/**
 * Redondea un numero a una cantidad fija de decimales.
 *
 * Se aplica solo a los valores de salida para evitar exponer ruido de punto
 * flotante (por ejemplo 4.999999999999999 en lugar de 5) en la respuesta.
 */
const round = (value, decimals = config.outputPrecision) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/**
 * Verifica si una matriz es diagonal.
 *
 * Definicion usada: una matriz es diagonal cuando todos los elementos fuera
 * de la diagonal principal (i !== j) son cero. No se exige que la matriz sea
 * cuadrada ni que la diagonal principal sea distinta de cero, por lo que una
 * matriz de ceros se considera diagonal.
 *
 * La comparacion contra cero usa una tolerancia porque las matrices que llegan
 * de una factorizacion QR contienen ceros teoricos representados como valores
 * del orden de 1e-16.
 *
 * @param {number[][]} matrix Matriz a verificar.
 * @param {number} [tolerance] Tolerancia absoluta para considerar un valor como cero.
 * @returns {boolean}
 */
export const isDiagonalMatrix = (matrix, tolerance = config.zeroTolerance) =>
  matrix.every((row, rowIndex) =>
    row.every(
      (value, columnIndex) => rowIndex === columnIndex || Math.abs(value) <= tolerance,
    ),
  );

/**
 * Calcula las estadisticas pedidas sobre una o varias matrices.
 *
 * Los valores de todas las matrices recibidas se tratan como un unico conjunto
 * de datos: maximo, minimo, promedio y suma son globales. Esto es relevante en
 * mode='factqr', donde el resultado son dos matrices (Q y R) y las estadisticas
 * se calculan sobre la union de sus valores.
 *
 * `isDiagonal` sigue la redaccion del enunciado ("verificar si alguna matriz es
 * diagonal") y por lo tanto es true si al menos una de las matrices lo es.
 *
 * Se recorre cada matriz una sola vez, acumulando los agregados en el mismo
 * paso, en lugar de aplanar los datos en un array intermedio.
 *
 * @param {{ name: string, matrix: number[][] }[]} matrices Matrices ya validadas.
 * @returns {{ max: number, min: number, average: number, sum: number, isDiagonal: boolean }}
 */
export const calculateStatistics = (matrices) => {
  let max = Number.NEGATIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  let sum = 0;
  let count = 0;
  let isDiagonal = false;

  for (const { matrix } of matrices) {
    for (const row of matrix) {
      for (const value of row) {
        if (value > max) max = value;
        if (value < min) min = value;
        sum += value;
        count += 1;
      }
    }

    if (!isDiagonal && isDiagonalMatrix(matrix)) {
      isDiagonal = true;
    }
  }

  return {
    max: round(max),
    min: round(min),
    average: round(sum / count),
    sum: round(sum),
    isDiagonal,
  };
};
