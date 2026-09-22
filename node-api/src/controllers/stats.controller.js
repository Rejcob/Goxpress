import { parseStatsPayload } from '../services/payload.validator.js';
import { calculateStatistics } from '../services/statistics.service.js';

/**
 * POST /stats
 *
 * Recibe el resultado producido por la API Go (una matriz rotada o las
 * matrices Q y R de la factorizacion) y responde con las estadisticas
 * calculadas sobre esos datos.
 *
 * La respuesta contiene exactamente los cinco campos definidos en el contrato:
 * max, min, average, sum e isDiagonal.
 */
export const postStats = (req, res) => {
  const { matrices } = parseStatsPayload(req.body);
  res.json(calculateStatistics(matrices));
};
