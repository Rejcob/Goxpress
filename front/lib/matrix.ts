import type { Matrix } from "./types";

/** Límites de tamaño de la matriz en la interfaz, para que el grid siga siendo usable. */
export const MIN_SIZE = 1;
export const MAX_SIZE = 8;

/** Crea una matriz de ceros con las dimensiones indicadas. */
export function emptyMatrix(rows: number, columns: number): Matrix {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => 0));
}

/**
 * Redimensiona una matriz conservando los valores que caben en las nuevas
 * dimensiones, para que cambiar el tamaño no borre lo ya escrito.
 */
export function resizeMatrix(matrix: Matrix, rows: number, columns: number): Matrix {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: columns }, (_, j) => matrix[i]?.[j] ?? 0),
  );
}

/** Devuelve una copia de la matriz con una celda cambiada. */
export function setCell(matrix: Matrix, row: number, column: number, value: number): Matrix {
  return matrix.map((currentRow, i) =>
    i === row ? currentRow.map((cell, j) => (j === column ? value : cell)) : currentRow,
  );
}

/**
 * Formatea un número para mostrarlo en pantalla.
 *
 * La factorización QR produce valores con muchos decimales; se recortan a 4
 * para que la tabla siga siendo legible, sin tocar el valor real recibido.
 */
export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(4).replace(/\.?0+$/, "");
}

/** Matrices de ejemplo, para probar la interfaz sin escribir valores a mano. */
export const PRESETS: { label: string; description: string; matrix: Matrix }[] = [
  {
    label: "Secuencial 3×3",
    description: "Caso clásico para ver la rotación",
    matrix: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
  },
  {
    label: "Identidad 3×3",
    description: "Matriz diagonal: isDiagonal debe dar true",
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
  {
    label: "Rectangular 2×3",
    description: "Al rotar 90° pasa a ser de 3×2",
    matrix: [
      [1, 2, 3],
      [4, 5, 6],
    ],
  },
  {
    label: "QR clásica 3×3",
    description: "Ejemplo habitual de factorización QR",
    matrix: [
      [12, -51, 4],
      [6, 167, -68],
      [-4, 24, -41],
    ],
  },
];
