"use client";

import { useState } from "react";

import { ApiDocs } from "@/components/ApiDocs";
import { Playground } from "@/components/Playground";
import { TopBar, type Tab } from "@/components/TopBar";

export default function Home() {
  // La documentación es una pestaña, no una ruta: son dos vistas de la misma
  // pantalla y no hay nada que enlazar por separado ni que indexar.
  const [tab, setTab] = useState<Tab>("playground");

  return (
    <>
      <TopBar active={tab} onChange={setTab} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {tab === "playground" ? (
          <Playground />
        ) : (
          <div className="flex flex-col gap-10 duration-300 animate-in fade-in">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Documentación de la API
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
                Todo lo necesario para consumir las APIs desde cualquier cliente, sin pasar por esta
                interfaz.
              </p>
            </div>

            <ApiDocs />
          </div>
        )}
      </main>
    </>
  );
}
