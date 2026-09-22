# Imagen Alpine: base pequena y suficiente para un servicio Express sin
# dependencias nativas.
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Se copian primero los manifiestos para que la capa de dependencias quede
# cacheada y no se reinstale en cada cambio de codigo fuente.
COPY package.json package-lock.json ./

# npm ci instala exactamente las versiones del lockfile; --omit=dev descarta
# las dependencias de desarrollo.
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# El servicio corre con el usuario 'node' que trae la imagen, no como root.
USER node

# EXPOSE es solo metadato: no publica el puerto. El puerto real lo define la
# variable PORT en tiempo de ejecucion, y el healthcheck de abajo la lee.
EXPOSE 3001

# Healthcheck contra el propio endpoint /health: Compose espera a que el
# servicio este sano antes de levantar la API Go.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
