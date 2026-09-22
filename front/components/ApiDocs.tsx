import { ArrowRight, ExternalLink } from "lucide-react";

import { CodeBlock } from "@/components/CodeBlock";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { API_URL } from "@/lib/api";

const REPO_URL = "https://github.com/Rejcob/Goxpress";
const STATS_API_URL = "https://inter-express.rejcob.dev";

/** Códigos de error que devuelve la API de matrices (Go). */
const GO_ERRORS: { code: string; status: number; cause: string }[] = [
  { code: "INVALID_JSON", status: 400, cause: "El body no es JSON válido o no respeta el contrato." },
  { code: "INVALID_MODE", status: 400, cause: "mode no es rotate ni factqr." },
  { code: "INVALID_DEGREES", status: 400, cause: "degrees no es 90, 180 ni 270." },
  { code: "INVALID_MATRIX", status: 400, cause: "Matriz ausente, vacía o mal formada." },
  { code: "NON_RECTANGULAR_MATRIX", status: 400, cause: "Las filas no tienen todas la misma longitud." },
  { code: "INVALID_MATRIX_VALUE", status: 400, cause: "Hay un valor que no es un número finito." },
  { code: "UNSUPPORTED_MATRIX_SHAPE", status: 400, cause: "QR sobre una matriz con menos filas que columnas." },
  { code: "NOT_FOUND", status: 404, cause: "Ruta inexistente." },
  { code: "INTERNAL_ERROR", status: 500, cause: "Error no controlado." },
  { code: "STATS_API_UNREACHABLE", status: 502, cause: "La API de estadísticas no responde." },
  { code: "STATS_API_ERROR", status: 502, cause: "La API de estadísticas respondió con error." },
];

/** Encabezado de sección, con el mismo tratamiento en toda la página. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Cabecera de un endpoint: método, ruta y descripción. */
function Endpoint({ method, path, children }: { method: string; path: string; children?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default" className="font-mono text-[11px]">
          {method}
        </Badge>
        <code className="font-mono text-sm font-medium">{path}</code>
      </div>
      {children && <p className="text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

export function ApiDocs() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Arquitectura"
        description="Son dos APIs desplegadas de forma independiente, sin red compartida, que se comunican
        entre sí por HTTPS. El cliente hace una sola llamada, a la API en Go; esa API aplica la
        transformación, le pide las estadísticas a la API en Node y devuelve ambos bloques combinados."
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border px-3 py-1.5 font-medium">Cliente</span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
          <span className="rounded-full border px-3 py-1.5">
            <span className="font-medium">API Go</span>
            <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">Fiber</span>
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground" />
          <span className="rounded-full border px-3 py-1.5">
            <span className="font-medium">API Node</span>
            <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">Express</span>
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="text-xs font-medium text-muted-foreground">API de matrices · Go</span>
              <code className="font-mono text-sm break-all">{API_URL}</code>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-1 px-4">
              <span className="text-xs font-medium text-muted-foreground">
                API de estadísticas · Node
              </span>
              <code className="font-mono text-sm break-all">{STATS_API_URL}</code>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Separator />

      <Section
        title="Transformar una matriz"
        description="Es el único endpoint que necesita un cliente. El parámetro mode elige la operación:
        rotate aplica una rotación en sentido horario, factqr calcula la factorización QR."
      >
        <Endpoint method="POST" path="/process" />

        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock
            label="Request · rotación (degrees es opcional, por defecto 90)"
            code={`{
  "matrix": [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  "mode": "rotate",
  "degrees": 90
}`}
          />
          <CodeBlock
            label="Response 200"
            code={`{
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
}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock
            label="Request · factorización QR (degrees se ignora)"
            code={`{
  "matrix": [[12, -51, 4], [6, 167, -68], [-4, 24, -41]],
  "mode": "factqr"
}`}
          />
          <CodeBlock
            label="Response 200 · result pasa a ser un objeto con Q y R"
            code={`{
  "transformation": {
    "mode": "factqr",
    "result": {
      "Q": [[-0.8571, 0.3943, 0.3314], ...],
      "R": [[-14, -21, 14], [0, -175, 70], [0, 0, -35]]
    }
  },
  "statistics": { "max": 70, "min": -175, ... }
}`}
          />
        </div>

        <CodeBlock
          label="Pruébalo desde la terminal"
          code={`curl -X POST ${API_URL}/process \\
  -H "Content-Type: application/json" \\
  -d '{"matrix":[[1,2,3],[4,5,6],[7,8,9]],"mode":"rotate","degrees":90}'`}
        />

        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4 text-sm">
          <span className="font-medium">Restricciones</span>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
            <li>
              <code className="font-mono text-xs">degrees</code> acepta 90, 180 y 270. No se
              soporta 360: es la identidad y no aportaría nada.
            </li>
            <li>
              Con <code className="font-mono text-xs">rotate</code>, 90 y 270 grados invierten las
              dimensiones: una matriz de <code className="font-mono text-xs">r×c</code> pasa a ser
              de <code className="font-mono text-xs">c×r</code>.
            </li>
            <li>
              Con <code className="font-mono text-xs">factqr</code>, la matriz debe tener al menos
              tantas filas como columnas. <code className="font-mono text-xs">Q</code> es{" "}
              <code className="font-mono text-xs">m×m</code> y <code className="font-mono text-xs">R</code>{" "}
              es <code className="font-mono text-xs">m×n</code>.
            </li>
            <li>La matriz debe ser rectangular y contener solo números finitos.</li>
          </ul>
        </div>
      </Section>

      <Separator />

      <Section
        title="Estadísticas"
        description="La API Go llama a este endpoint por HTTPS después de transformar la matriz. Está
        documentado porque es parte del contrato del sistema y es alcanzable por sí solo, pero un
        cliente normal no necesita invocarlo: /process ya devuelve estas estadísticas."
      >
        <Endpoint method="POST" path="/stats">
          Servidor a servidor, en el dominio de la API Node.
        </Endpoint>

        <div className="grid gap-4 lg:grid-cols-2">
          <CodeBlock
            label="Request"
            code={`{
  "mode": "rotate",
  "result": [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
}`}
          />
          <CodeBlock
            label="Response 200"
            code={`{
  "max": 9,
  "min": 1,
  "average": 5,
  "sum": 45,
  "isDiagonal": false
}`}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-4 text-sm">
          <span className="font-medium">Cómo se calculan</span>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
            <li>
              Con <code className="font-mono text-xs">mode: &quot;factqr&quot;</code> el resultado
              son dos matrices, así que máximo, mínimo, promedio y suma se calculan sobre la unión
              de los valores de <code className="font-mono text-xs">Q</code> y{" "}
              <code className="font-mono text-xs">R</code>, tratados como un único conjunto de datos.
            </li>
            <li>
              <code className="font-mono text-xs">isDiagonal</code> es true si <em>alguna</em> de
              las matrices es diagonal: todos los elementos fuera de la diagonal principal son cero.
              No se exige que sea cuadrada.
            </li>
            <li>
              La comparación contra cero usa una tolerancia de{" "}
              <code className="font-mono text-xs">1e-9</code>, porque la factorización QR produce
              ceros teóricos del orden de <code className="font-mono text-xs">1e-16</code>.
            </li>
          </ul>
        </div>
      </Section>

      <Separator />

      <Section
        title="Errores"
        description="Ambas APIs responden con el mismo formato, y el campo code es estable: está pensado
        para que un cliente reaccione programáticamente en lugar de parsear mensajes."
      >
        <CodeBlock
          code={`{
  "error": {
    "code": "INVALID_DEGREES",
    "message": "'degrees' debe ser uno de: [90 180 270].",
    "details": { "received": 45 }
  }
}`}
        />

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-medium">Código</th>
                <th className="px-4 py-2.5 font-medium">HTTP</th>
                <th className="px-4 py-2.5 font-medium">Causa</th>
              </tr>
            </thead>
            <tbody>
              {GO_ERRORS.map((error) => (
                <tr key={error.code} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{error.code}</td>
                  <td className="px-4 py-2.5 font-mono text-xs tabular-nums">{error.status}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{error.cause}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground">
          Los fallos de la API Node se traducen a 502 en la API Go, no a 500: el request del cliente
          era válido, lo que falló fue la dependencia. La respuesta original viaja en{" "}
          <code className="font-mono text-xs">details.upstream</code>.
        </p>
      </Section>

      <Separator />

      <Section title="Otros endpoints">
        <Endpoint method="GET" path="/health">
          Disponible en ambas APIs. Lo usan Docker y nginx para verificar que el servicio está
          arriba.
        </Endpoint>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-1.5 text-sm underline-offset-4 hover:underline"
        >
          Código fuente y decisiones de diseño en el repositorio
          <ExternalLink className="size-3.5" />
        </a>
      </Section>
    </div>
  );
}
