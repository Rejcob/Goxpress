import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { createApp } from '../src/app.js';

let server;
let baseUrl;

/** Levanta la app en un puerto libre para no depender del puerto configurado. */
before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

/** Helper para hacer POST /stats con un body arbitrario. */
const postStats = (body) =>
  fetch(`${baseUrl}/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /stats', () => {
  it("devuelve las estadisticas para mode='rotate'", async () => {
    const response = await postStats({ mode: 'rotate', result: [[7, 4, 1], [8, 5, 2], [9, 6, 3]] });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      max: 9,
      min: 1,
      average: 5,
      sum: 45,
      isDiagonal: false,
    });
  });

  it("calcula las estadisticas sobre Q y R para mode='factqr'", async () => {
    const response = await postStats({
      mode: 'factqr',
      result: { Q: [[1, 0], [0, 1]], R: [[2, 3], [0, 4]] },
    });

    assert.equal(response.status, 200);
    const stats = await response.json();
    assert.equal(stats.sum, 11);
    assert.equal(stats.isDiagonal, true);
  });

  it('rechaza un mode invalido con 400', async () => {
    const response = await postStats({ mode: 'transpose', result: [[1]] });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_MODE');
  });

  it('rechaza una matriz vacia con 400', async () => {
    const response = await postStats({ mode: 'rotate', result: [] });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_MATRIX');
  });

  it('rechaza una matriz no rectangular con 400', async () => {
    const response = await postStats({ mode: 'rotate', result: [[1, 2], [3]] });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'NON_RECTANGULAR_MATRIX');
  });

  it('rechaza valores no numericos con 400', async () => {
    const response = await postStats({ mode: 'rotate', result: [[1, 'dos']] });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_MATRIX_VALUE');
  });

  it("rechaza un result sin Q y R cuando mode='factqr'", async () => {
    const response = await postStats({ mode: 'factqr', result: [[1, 2], [3, 4]] });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_RESULT');
  });

  it('rechaza un JSON mal formado con 400', async () => {
    const response = await fetch(`${baseUrl}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"mode": "rotate",',
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_JSON');
  });
});

describe('GET /health', () => {
  it('responde ok', async () => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'ok');
  });
});

describe('rutas desconocidas', () => {
  it('responden 404 con el formato de error del servicio', async () => {
    const response = await fetch(`${baseUrl}/no-existe`);

    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'NOT_FOUND');
  });
});
