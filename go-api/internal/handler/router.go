package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/rejcob/reto-tecnico/go-api/internal/statsclient"
)

// NewApp construye la aplicacion Fiber con sus rutas y middlewares.
//
// Se expone como constructor (y no como instancia ya escuchando) para que los
// tests puedan levantar la app sin ocupar un puerto fijo.
//
// corsOrigins son los origenes permitidos para llamadas desde un navegador,
// separados por coma. Una cadena vacia equivale a "*".
func NewApp(stats *statsclient.Client, corsOrigins string) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "go-matrix-api",
		ErrorHandler: ErrorHandler,
	})

	// recover convierte un panico en un error manejado: Gonum entra en panico
	// ante formas de matriz que no soporta, y eso no debe tumbar el servicio.
	app.Use(recover.New())
	app.Use(logger.New())

	// CORS: el frontend corre en otro origen (otro dominio en produccion, otro
	// puerto en local), asi que el navegador exige estas cabeceras para permitir
	// la llamada. No se habilita AllowCredentials porque la API no usa cookies
	// ni sesiones: no hay nada que el navegador deba adjuntar.
	if corsOrigins == "" {
		corsOrigins = "*"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: corsOrigins,
		AllowMethods: "GET,POST,OPTIONS",
		AllowHeaders: "Content-Type",
	}))

	h := New(stats)

	app.Get("/health", h.Health)
	app.Post("/process", h.Process)

	return app
}
