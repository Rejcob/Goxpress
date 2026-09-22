# API de Matrices (Go + Fiber)

API que recibe una matriz, le aplica la transformación pedida (rotación o factorización QR),
envía el resultado a la API de node y responde al cliente combinando ambos bloques.

## Endpoints

### `POST /process`

Request — rotación (`degrees` es opcional, por defecto `90`):

```json
{
  "matrix": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  "mode": "rotate",
  "degrees": 90
}
```

Request — factorización QR (`degrees` se ignora en este modo):

```json
{
  "matrix": [[12, -51, 4], [6, 167, -68], [-4, 24, -41]],
  "mode": "factqr"
}
```

Response `200`:

```json
{
  "transformation": {
    "mode": "rotate",
    "degrees": 90,
    "result": [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
  },
  "statistics": {
    "max": 9,
    "min": 1,
    "average": 5,
    "sum": 45,
    "isDiagonal": false
  }
}
```

En `mode: "factqr"`, `transformation.result` es un objeto `{ "Q": [[...]], "R": [[...]] }`.

Response de error (mismo formato que la API Node):

```json
{
  "error": {
    "code": "INVALID_DEGREES",
    "message": "'degrees' debe ser uno de: [90 180 270].",
    "details": { "received": 45 }
  }
}
```

| Código | HTTP | Causa |
| --- | --- | --- |
| `INVALID_JSON` | 400 | El body no es JSON válido o no respeta el contrato. |
| `INVALID_MODE` | 400 | `mode` no es `rotate` ni `factqr`. |
| `INVALID_DEGREES` | 400 | `degrees` no es 90, 180 ni 270. |
| `INVALID_MATRIX` | 400 | Matriz ausente, vacía o mal formada. |
| `NON_RECTANGULAR_MATRIX` | 400 | Las filas no tienen todas la misma longitud. |
| `INVALID_MATRIX_VALUE` | 400 | Hay un valor que no es un número finito. |
| `UNSUPPORTED_MATRIX_SHAPE` | 400 | QR sobre una matriz con menos filas que columnas. |
| `NOT_FOUND` | 404 | Ruta inexistente. |
| `INTERNAL_ERROR` | 500 | Error no controlado. |
| `STATS_API_UNREACHABLE` | 502 | La API de estadísticas no responde. |
| `STATS_API_ERROR` | 502 | La API de estadísticas respondió con error (se adjunta su respuesta en `details.upstream`). |

### `GET /health`

Verificación de estado para Docker y el reverse proxy.

## CORS

La API responde con las cabeceras CORS necesarias para que un navegador pueda llamarla desde
otro origen, que es como la consume el frontend. No se habilita `AllowCredentials`: la API no
usa cookies ni sesiones, así que no hay nada que el navegador deba adjuntar.

## Variables de entorno

Todas tienen un default razonable: el servicio arranca sin configuración previa. La lista
completa está en `.env.example`.

| Variable | Default | Para qué |
| --- | --- | --- |
| `PORT` | `8080` | Puerto HTTP. Lo usan la aplicación, el mapeo de puertos de Docker y el healthcheck. |
| `STATS_API_URL` | `https://inter-express.rejcob.dev/stats` | Endpoint de la API de estadísticas. |
| `STATS_API_TIMEOUT` | `10s` | Timeout de esa llamada. Contempla DNS y handshake TLS. |
| `CORS_ORIGINS` | `*` | Orígenes permitidos, separados por coma. |

## Despliegue

Este servicio se despliega de forma **independiente**: tiene su propio `docker-compose.yml`
y su propia red de Docker, y no comparte red con la API Node. La alcanza por su dominio
público, por HTTPS, igual que cualquier otro cliente externo.

```bash
docker compose build
docker compose up -d
docker compose logs -f
```
Está publicado en `https://inter-go.rejcob.dev`.

## Ejecución local

También con Docker: no hace falta tener Go instalado.

```bash
echo "STATS_API_URL=http://host.docker.internal:3001/stats" > .env

docker compose build
docker compose up -d
docker compose logs -f
```

Queda en `http://localhost:8080`. El `.env` no se versiona: en el VPS no existe y el compose
cae al dominio público de la API Node.

`host.docker.internal` apunta a la máquina anfitriona desde dentro del contenedor. No se usa
`localhost` porque dentro de un contenedor se refiere al contenedor mismo.

Para detener: `docker compose down`.

## Tests

Sin Go instalado, en un contenedor descartable:

```bash
docker run --rm -v "$PWD:/app" -w /app golang:1.23 go test ./...
```

Con Go instalado en la máquina:

```bash
go mod tidy
go test ./...
```