# ---------- Etapa de compilacion ----------
FROM golang:1.23-alpine AS builder

WORKDIR /src

# Se descargan las dependencias en una capa propia para que el cache se
# invalide solo cuando cambian go.mod o go.sum, no con cada cambio de codigo.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO_ENABLED=0 produce un binario estatico que corre en una imagen sin libc.
# -ldflags="-s -w" quita la tabla de simbolos y la informacion de debug.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server

# ---------- Imagen final ----------
# Alpine en lugar de scratch: pesa pocos MB y trae wget, necesario para el
# healthcheck del contenedor.
FROM alpine:3.20

# Certificados raiz, por si en algun despliegue la API de estadisticas se
# consume por HTTPS.
RUN apk add --no-cache ca-certificates && \
    adduser -D -u 10001 appuser

COPY --from=builder /bin/server /usr/local/bin/server

# El servicio corre con un usuario sin privilegios, no como root.
USER appuser

# EXPOSE es solo metadato: no publica el puerto. El puerto real lo define la
# variable PORT en tiempo de ejecucion.
EXPOSE 8080

# El healthcheck lee PORT en tiempo de ejecucion, para que siga funcionando si
# el puerto se cambia desde el .env.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:${PORT:-8080}/health || exit 1

ENTRYPOINT ["/usr/local/bin/server"]
