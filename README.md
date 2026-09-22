# APIs de Matrices y Estadísticas + interfaz web

Dos APIs RESTful **desplegadas de forma independiente**, que se comunican entre sí por HTTPS, y
una interfaz web que las consume:


| Servicio                 | Stack             | Dominio público                    |
| ------------------------ | ----------------- | ---------------------------------- |
| `[go-api](./go-api)`     | Go + Fiber        | `https://inter-go.rejcob.dev`      |
| `[node-api](./node-api)` | Node.js + Express | `https://inter-express.rejcob.dev` |
| `[front](./front)`       | Next.js + React   | `https://goxpres.rejcob.dev`       |


- `go-api` recibe una matriz, le aplica la transformación pedida (rotación o
factorización QR), envía el resultado a `node-api` y responde combinando transformación y
estadísticas.
- `node-api` es el microservicio de estadísticas: recibe el resultado de `go-api` y
devuelve máximo, mínimo, promedio, suma total y si alguna matriz es diagonal.
- `front` es la interfaz: se introduce la matriz, se elige la operación y se muestran la
transformación y las estadísticas. Hace una sola llamada, a `go-api`, porque es esa API la que
orquesta la consulta a `node-api`.



## Demo en producción


| Qué                                 | URL                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| Interfaz web                        | [https://goxpres.rejcob.dev/](https://goxpres.rejcob.dev/)                       |
| `POST /process` · API de matrices   | [https://inter-go.rejcob.dev/process](https://inter-go.rejcob.dev/process)       |
| `POST /stats` · API de estadísticas | [https://inter-express.rejcob.dev/stats](https://inter-express.rejcob.dev/stats) |


La interfaz es el punto de entrada: introduce una matriz, elige la operación y muestra el
resultado con sus estadísticas. También incluye una pestaña con la documentación de la API.

Desde la terminal:

```bash
curl -X POST https://inter-go.rejcob.dev/process \
  -H "Content-Type: application/json" \
  -d '{"matrix":[[1,2,3],[4,5,6],[7,8,9]],"mode":"rotate","degrees":90}'
```



## Arquitectura

```
   ┌────────────────────┐
   │  front             │
   │  Next.js · Vercel  │
   └─────────┬──────────┘
             │
             │  HTTPS
             │                     ┌──────────────────────────────┐
             └────────────────────>│  inter-go.rejcob.dev         │
                                   │  reverse proxy (TLS) → :8080 │
   curl / cualquier cliente ──────>│  go-api  [red propia]        │
                                   └──────────────┬───────────────┘
                                                  │
                                            HTTPS │  (sale del contenedor,
                                                  │   resuelve DNS público)
                                                  v
                                   ┌──────────────────────────────┐
                                   │  inter-express.rejcob.dev    │
                                   │  reverse proxy (TLS) → :3001 │
                                   │  node-api  [red propia]      │
                                   └──────────────────────────────┘
```

Cada API tiene su propio `Dockerfile`, su propio `docker-compose.yml` y su propia red de
Docker. **No comparten red**: `go-api` alcanza a `node-api` por su dominio público, tal y como
lo haría cualquier cliente externo.

El frontend no se containeriza: es una aplicación Next estática que solo consume una API
pública, así que se despliega en Vercel. Es un cliente más, al mismo nivel que un `curl`.

El reverse proxy (`[infra/](./infra)`) es nginx, corriendo nativo en el VPS. Es el único
proceso que escucha en los puertos 80 y 443 y el que termina el TLS. Las APIs publican su
puerto solo en `127.0.0.1`, de modo que ninguna queda accesible en HTTP plano desde fuera
del host.

## Despliegue

### Las dos APIs — VPS con Docker

Se levantan por separado, en el orden que se quiera: no hay dependencia de arranque entre
ellas.

```bash
cd node-api
docker compose build
docker compose up -d
docker compose logs -f

cd ../go-api
docker compose build
docker compose up -d
docker compose logs -f
```

Sin un `.env` local, cada servicio publica su puerto solo en `127.0.0.1`, que es lo correcto
en el VPS: únicamente el reverse proxy debe alcanzarlos.

El reverse proxy (nginx) corre nativo en el VPS, no en un contenedor.

Requisito previo: los registros DNS que vayan a usar, (en mi caso `inter-go.rejcob.dev` e `inter-express.rejcob.dev`) deben
apuntar a la IP pública del VPS, con los puertos 80 y 443 abiertos.

Para detener: `docker compose down` dentro de cada carpeta.

### El frontend — Vercel

No se containeriza: es una aplicación Next estática que solo consume una API pública, así que
meterla en un contenedor añadiría un servidor que mantener a cambio de nada.

1. Importar el repositorio en Vercel y poner `front` como *Root Directory*.
2. Definir `NEXT_PUBLIC_API_URL=https://inter-go.rejcob.dev` en *Environment Variables*.
3. Vercel ejecuta `next build` en cada push.

Esa variable se resuelve **en tiempo de build**: Next la incrusta en el bundle que descarga el
navegador. Cambiarla exige un nuevo despliegue, no basta con reiniciar.

El dominio del frontend debe estar permitido por el CORS de `go-api`. Por defecto acepta
cualquier origen (`CORS_ORIGINS=*`), que es razonable para una API pública sin sesiones.

## Ejecución local (sin dominios ni TLS)

Las dos APIs también se levantan con Docker en local: no hace falta tener Go ni Node
instalados. Lo único que cambia respecto a producción es a dónde apunta `go-api`, porque en
local no existen los registros DNS.

```bash
cd go-api && echo "STATS_API_URL=http://host.docker.internal:3001/stats" > .env
```

Ese archivo no se versiona, así que en el VPS no existe y el compose cae al dominio público.
Después, los mismos comandos:

```bash
cd node-api
docker compose build
docker compose up -d
docker compose logs -f

cd ../go-api
docker compose build
docker compose up -d
docker compose logs -f
```

`host.docker.internal` apunta a la máquina anfitriona desde dentro del contenedor. No se usa
`localhost` porque dentro de un contenedor se refiere al contenedor mismo, no al host.


El frontend no usa Docker, ni en local:

```bash
cd front
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev
```

| Servicio   | URL local                                      |
| ---------- | ---------------------------------------------- |
| `go-api`   | [http://localhost:8080](http://localhost:8080) |
| `node-api` | [http://localhost:3001](http://localhost:3001) |
| `front`    | [http://localhost:3000](http://localhost:3000) |




## Probar la solución

```bash
# Rotación (degrees es opcional, por defecto 90)
curl -X POST https://inter-go.rejcob.dev/process \
  -H "Content-Type: application/json" \
  -d '{"matrix":[[1,2,3],[4,5,6],[7,8,9]],"mode":"rotate","degrees":90}'

# Factorización QR
curl -X POST https://inter-go.rejcob.dev/process \
  -H "Content-Type: application/json" \
  -d '{"matrix":[[12,-51,4],[6,167,-68],[-4,24,-41]],"mode":"factqr"}'
```

Respuesta:

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

El detalle de cada endpoint, los códigos de error y las decisiones propias de cada servicio
están en su README: `[go-api/README.md](./go-api/README.md)`,
`[node-api/README.md](./node-api/README.md)` y `[front/README.md](./front/README.md)`.

## Tests

Si se tienen los runtimes instalados:

```bash
cd go-api   && go test ./...
cd node-api && npm test
```

Si no, ambas suites corren en un contenedor descartable, sin instalar nada:

```bash
docker run --rm -v "$PWD/go-api:/app"   -w /app golang:1.23  go test ./...
docker run --rm -v "$PWD/node-api:/app" -w /app node:22-alpine sh -c "npm ci && npm test"
```

Las imágenes de producción no incluyen los tests ni las dependencias de desarrollo: se
excluyen vía `.dockerignore` y `npm ci --omit=dev`.

## Decisiones de diseño



### 1. El enunciado pide dos operaciones distintas, podía ser algo ambiguo, incluí ambas

La sección de arquitectura habla de **rotar** la matriz, mientras que la de funcionalidad
requerida pide la **factorización QR**. Son operaciones diferentes y el enunciado no aclara
cuál es la que debería prevalecer. En lugar de elegir una y descartar la otra o asumir, agregué un parámetro `mode` con valores `"rotate"` y `"factqr"`.
El usuario decide explícitamente qué quiere, la API cumple ambos requisitos y la ambigüedad
queda resuelta.

### 2. Dos servicios independientes que se comunican por HTTPS

El enunciado pide "un mecanismo como HTTP" para la comunicación entre las APIs. Podría haber
puesto ambos contenedores en la misma red de Docker y dejar que se llamaran por nombre de
servicio, de manera interna; es más fácil, pero preferí tratarlos como lo que dice ser la arquitectura: **dos servicios separados**.

Cada uno tiene su propio `docker-compose.yml`, su propia red y su propio dominio. `go-api`
llama a `node-api` en `https://inter-express.rejcob.dev/stats`, saliendo del contenedor y
resolviendo DNS público, igual que cualquier otro cliente.

El costo de esta decisión es una latencia mayor que la de una llamada dentro de la misma red. Considero razonable a cambio de que los servicios sean desplegables de forma verdaderamente
independiente, que es justamente lo que justifica separarlos en dos APIs.

### 3. HTTPS en vez de HTTP plano

HTTPS es HTTP sobre TLS: cumple el requisito del enunciado y además no expone el tráfico en
claro. Como la comunicación entre servicios ahora sale a la red pública, cifrarla deja de ser
un detalle opcional y pasa a ser obligatorio: sin TLS, las matrices viajarían legibles.

Elegí nginx sobre alternativas porque ya lo uso en ese mismo VPS para otros proyectos.

### 4. Cada servicio valida su propia entrada

`node-api` no asume que lo que recibe viene de `go-api`: valida el payload igual que si
llegara de cualquier cliente. Con los servicios expuestos en dominios públicos, sin JWT, esto deja de ser una precaución teórica — el endpoint es alcanzable por cualquiera.

### 5. Formato de error idéntico en ambos servicios

Los dos responden `{"error": {"code", "message", "details"}}`, con un `code` estable pensado
para que un cliente pueda reaccionar programáticamente en lugar de parsear mensajes. Los
fallos de `node-api` se traducen a **502** en `go-api`, no a 500: el request del cliente era
válido, lo que falló fue la dependencia. Con la llamada saliendo a la red pública los modos
de fallo posibles aumentan (DNS, TLS, timeout), y todos se reportan de forma explícita en vez
de convertirse en un 500 genérico.

### 6. El frontend fuera de Docker, y CORS resuelto en la API

Las dos APIs se containerizan porque corren en un VPS propio y necesitan un entorno
reproducible. El frontend no: es una aplicación Next estática que solo consume una API
pública, así que va a Vercel. Containerizarla añadiría un servidor que mantener, un dominio
más que certificar y una pieza más en el despliegue, a cambio de nada.

Como el navegador llama a la API desde otro origen, habilité CORS en `go-api`. Los orígenes
permitidos se configuran con `CORS_ORIGINS` y por defecto acepta cualquiera, razonable para
una API pública sin autenticación ni cookies. No habilité `AllowCredentials` justamente por
eso: no hay sesión que el navegador deba adjuntar.

La alternativa era que el frontend hiciera de proxy con un route handler de Next, evitando
CORS por completo. La descarté porque escondería que el frontend es un cliente más de una API
pública, que es precisamente lo que el reto pide demostrar.