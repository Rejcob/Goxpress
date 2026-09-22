# API de Estadísticas (Node.js + Express)

Microservicio que recibe el resultado producido por la API Go (una matriz rotada o
las matrices `Q` y `R` de una factorización QR) y devuelve estadísticas sobre esos datos.

## Endpoints

### `POST /stats`

Request — `mode: "rotate"`:

```json
{
  "mode": "rotate",
  "result": [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
}
```

Request — `mode: "factqr"`:

```json
{
  "mode": "factqr",
  "result": {
    "Q": [[-0.1231, 0.9045], [-0.4924, 0.3015]],
    "R": [[-8.124, -9.601], [0, 0.9045]]
  }
}
```

Response `200`:

```json
{
  "max": 9,
  "min": 1,
  "average": 5,
  "sum": 45,
  "isDiagonal": false
}
```

Response de error (cualquier código `4xx` / `5xx`):

```json
{
  "error": {
    "code": "INVALID_MODE",
    "message": "'mode' debe ser uno de: rotate, factqr.",
    "details": { "received": "transpose" }
  }
}
```

| Código | HTTP | Causa |
| --- | --- | --- |
| `INVALID_JSON` | 400 | El body no es JSON válido. |
| `INVALID_BODY` | 400 | El body no es un objeto JSON. |
| `INVALID_MODE` | 400 | `mode` no es `rotate` ni `factqr`. |
| `INVALID_RESULT` | 400 | Con `mode: "factqr"`, `result` no es un objeto con `Q` y `R`. |
| `INVALID_MATRIX` | 400 | Matriz ausente, vacía o mal formada. |
| `NON_RECTANGULAR_MATRIX` | 400 | Las filas no tienen todas la misma longitud. |
| `INVALID_MATRIX_VALUE` | 400 | Hay un valor que no es un número finito. |
| `NOT_FOUND` | 404 | Ruta inexistente. |
| `INTERNAL_ERROR` | 500 | Error no controlado. |

### `GET /health`

Verificación de estado para Docker y el reverse proxy.

## Despliegue

Este servicio se despliega de forma **independiente**: tiene su propio `docker-compose.yml`
y su propia red de Docker, y no comparte red con la API Go. Esta lo consume desde afuera,
por HTTPS, igual que cualquier otro cliente.

```bash
docker compose build
docker compose up -d
docker compose logs -f
```
Está publicado en `https://inter-express.rejcob.dev`

## Ejecución local

También con Docker: no hace falta tener Node instalado.

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

Queda en `http://localhost:3001`.

Para detener: `docker compose down`.

## Variables de entorno

Todas tienen un default razonable: el servicio arranca sin configuración previa. La lista
completa está en `.env.example`.

| Variable | Default | Para qué |
| --- | --- | --- |
| `PORT` | `3001` | Puerto HTTP. Lo usan la aplicación, el mapeo de puertos de Docker y el healthcheck. |
| `NODE_ENV` | `production` | En `development` los errores 500 incluyen el mensaje interno. |
| `ZERO_TOLERANCE` | `1e-9` | Tolerancia al comparar contra cero en `isDiagonal`. |
| `OUTPUT_PRECISION` | `10` | Decimales a los que se redondean las estadísticas. |
| `BODY_LIMIT` | `5mb` | Tamaño máximo del body. Debe coincidir con el `client_max_body_size` de nginx. |
| `LOG_REQUESTS` | `true` | Registrar una línea por petición. `false` lo desactiva. |

## Logs

El servicio escribe una línea por petición en stdout, que es de donde los recoge
`docker compose logs -f`:

```
19:10:54 | 200 |     1.224ms | 172.19.0.1 | POST | /stats
19:10:42 | 400 |     1.807ms | 172.19.0.1 | POST | /stats
19:10:09 | 404 |     0.769ms | 172.19.0.1 | GET  | /no-existe
```

Hora, código de estado, duración, IP del cliente, método y ruta. El formato imita al del
middleware `logger` de Fiber que usa la API Go, para que los logs de ambos servicios se lean
igual al seguir una llamada que atraviesa los dos.

La línea se escribe al terminar la respuesta, no al recibir la petición: antes no se conocen
ni el estado ni la duración.

Detrás del reverse proxy la conexión llega desde el loopback, así que la aplicación usa
`trust proxy: 'loopback'` para registrar la IP real del cliente que nginx envía en
`X-Forwarded-For`. Se confía **solo** en el loopback: confiar en cualquier origen permitiría
falsificar esa cabecera.

Los errores no controlados se registran aparte, con su traza completa, desde el manejador
central de errores.

## Tests

Sin Node instalado, en un contenedor descartable:

```bash
docker run --rm -v "$PWD:/app" -w /app node:22-alpine sh -c "npm ci && npm test"
```

Con Node instalado en la máquina:

```bash
npm install
npm test         # suite de tests (node:test, sin dependencias extra)
npm run dev      # servidor con recarga automática, sin Docker
```
