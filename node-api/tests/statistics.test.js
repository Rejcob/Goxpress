import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateStatistics, isDiagonalMatrix } from '../src/services/statistics.service.js';

describe('calculateStatistics', () => {
  it('calcula max, min, promedio y suma sobre una sola matriz', () => {
    const stats = calculateStatistics([
      { name: 'result', matrix: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] },
    ]);

    assert.deepEqual(stats, { max: 9, min: 1, average: 5, sum: 45, isDiagonal: false });
  });

  it('trata varias matrices como un unico conjunto de datos', () => {
    const stats = calculateStatistics([
      { name: 'Q', matrix: [[1, 0], [0, 1]] },
      { name: 'R', matrix: [[2, 3], [0, 4]] },
    ]);

    assert.equal(stats.sum, 11);
    assert.equal(stats.max, 4);
    assert.equal(stats.min, 0);
    assert.equal(stats.average, 1.375);
  });

  it('marca isDiagonal en true si al menos una de las matrices es diagonal', () => {
    const stats = calculateStatistics([
      { name: 'Q', matrix: [[1, 0], [0, 1]] },
      { name: 'R', matrix: [[2, 3], [0, 4]] },
    ]);

    assert.equal(stats.isDiagonal, true);
  });

  it('soporta valores negativos y decimales', () => {
    const stats = calculateStatistics([{ name: 'result', matrix: [[-2.5, 1.5], [0, 3]] }]);

    assert.equal(stats.min, -2.5);
    assert.equal(stats.max, 3);
    assert.equal(stats.sum, 2);
    assert.equal(stats.average, 0.5);
  });
});

describe('isDiagonalMatrix', () => {
  it('reconoce una matriz diagonal', () => {
    assert.equal(isDiagonalMatrix([[5, 0, 0], [0, 3, 0], [0, 0, 1]]), true);
  });

  it('rechaza una matriz con valores fuera de la diagonal principal', () => {
    assert.equal(isDiagonalMatrix([[5, 1], [0, 3]]), false);
  });

  it('considera diagonal una matriz de ceros', () => {
    assert.equal(isDiagonalMatrix([[0, 0], [0, 0]]), true);
  });

  it('tolera los ceros aproximados que produce la factorizacion QR', () => {
    assert.equal(isDiagonalMatrix([[4, 2.2e-16], [-1.1e-16, 7]]), true);
  });

  it('aplica la definicion tambien a matrices rectangulares', () => {
    assert.equal(isDiagonalMatrix([[1, 0, 0], [0, 2, 0]]), true);
    assert.equal(isDiagonalMatrix([[1, 0, 0], [0, 2, 3]]), false);
  });
});
