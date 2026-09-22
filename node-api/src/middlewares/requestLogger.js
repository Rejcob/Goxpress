import { config } from '../config.js';

/**
 * Normaliza la IP del cliente.
 *
 * Node representa las direcciones IPv4 sobre un socket IPv6 con el prefijo
 * '::ffff:', que no aporta nada al leer un log.
 */
const formatIp = (ip) => (ip ? ip.replace(/^::ffff:/, '') : '-');

/** Formatea la hora local como HH:MM:SS. */
const timestamp = () => new Date().toTimeString().slice(0, 8);

/**
 * Formatea una duración en milisegundos con una precisión legible.
 */
const formatDuration = (milliseconds) => `${milliseconds.toFixed(3)}ms`;

/**
 * Registra una línea por petición HTTP.
 *
 * El formato imita al del middleware `logger` de Fiber que usa la API Go, para
 * que los logs de ambos servicios se lean igual al depurar una llamada que
 * atraviesa los dos:
 *
 *   14:52:07 | 200 |     1.284ms | 172.20.0.1 | POST | /stats
 *
 * Se escribe al terminar la respuesta, no al recibirla, porque hasta entonces
 * no se conocen ni el código de estado ni la duración. `docker compose logs`
 * recoge stdout, así que no hace falta escribir a ningún archivo.
 */
export const requestLogger = (req, res, next) => {
  if (!config.logRequests) return next();

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    const line = [
      timestamp(),
      String(res.statusCode).padStart(3),
      formatDuration(durationMs).padStart(11),
      formatIp(req.ip),
      req.method,
      req.originalUrl,
    ].join(' | ');

    console.log(line);
  });

  next();
};
