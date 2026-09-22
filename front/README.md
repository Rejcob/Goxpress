# Frontend (Next.js)

Interfaz para introducir una matriz, elegir la operación y ver el resultado junto con las
estadísticas. Sin autenticación: es una demo del flujo completo.

```
navegador → go-api /process → node-api /stats → go-api → navegador
```

El frontend hace **una sola llamada**, a `POST /process` de la API Go. Esa API aplica la
transformación, le pide las estadísticas a la API Node y devuelve ambos bloques combinados.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 y componentes de
[shadcn/ui](https://ui.shadcn.com) (sobre Base UI). Iconos de `lucide-react`. Sin librerías de
estado ni de peticiones: `useState` y `fetch` bastan para una pantalla.

## Estructura

```
app/
├── layout.tsx          metadatos y fuentes
└── page.tsx            pantalla única: entrada, opciones y resultado
components/
├── TopBar.tsx          barra superior y cambio entre pestañas
├── Playground.tsx      pestaña "Probar": entrada, opciones y resultado
├── ApiDocs.tsx         pestaña "API": contrato, errores y ejemplos
├── MatrixInput.tsx     editor de la matriz de entrada
├── MatrixGrid.tsx      matriz en modo lectura
├── Pipeline.tsx        recorrido de la petición entre los tres servicios
├── ResultPanel.tsx     transformación + estadísticas
├── CodeBlock.tsx       bloque de código con botón de copiar
└── ui/                 componentes de shadcn/ui
lib/
├── types.ts            contratos de la API
├── api.ts              cliente de POST /process
└── matrix.ts           utilidades de matriz y matrices de ejemplo
```

## Ejecución local

Requiere la API Go corriendo en `http://localhost:8080`.

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev        # http://localhost:3000
```

## Despliegue

Se despliega en **Vercel**, no en Docker. Es una aplicación Next.js estática que solo consume
una API pública: containerizarla añadiría un servidor que mantener sin ganar nada.

1. Importar el repositorio en Vercel y seleccionar `front/` como directorio raíz del proyecto.
2. Definir `NEXT_PUBLIC_API_URL=https://inter-go.rejcob.dev` en *Project Settings →
   Environment Variables*.
3. Vercel ejecuta `next build` en cada push y publica el resultado.

`NEXT_PUBLIC_API_URL` se resuelve en tiempo de build: Next lo incrusta en el bundle que
descarga el navegador. Cambiar su valor exige un nuevo despliegue, no basta con reiniciar.

El dominio de Vercel debe estar permitido por el CORS de la API Go. Por defecto acepta
cualquier origen (`CORS_ORIGINS=*`); para restringirlo, se fija esa variable en el `.env` de
`go-api` con el dominio del frontend.