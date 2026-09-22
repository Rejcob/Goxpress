// Command server levanta la API de matrices en Go.
//
// Recibe una matriz, le aplica la transformacion pedida (rotacion o
// factorizacion QR), envia el resultado a la API de estadisticas en Node y
// responde combinando ambos bloques.
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/rejcob/reto-tecnico/go-api/internal/config"
	"github.com/rejcob/reto-tecnico/go-api/internal/handler"
	"github.com/rejcob/reto-tecnico/go-api/internal/statsclient"
)

func main() {
	cfg := config.Load()

	app := handler.NewApp(statsclient.New(cfg.StatsAPIURL, cfg.StatsAPITimeout), cfg.CORSOrigins)

	// Cierre ordenado: Docker envia SIGTERM al detener el contenedor.
	go func() {
		signals := make(chan os.Signal, 1)
		signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)
		sig := <-signals
		log.Printf("[go-matrix-api] %v recibido, cerrando servidor...", sig)
		if err := app.Shutdown(); err != nil {
			log.Printf("[go-matrix-api] error al cerrar: %v", err)
		}
	}()

	log.Printf("[go-matrix-api] escuchando en :%s (stats: %s)", cfg.Port, cfg.StatsAPIURL)

	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("[go-matrix-api] error al iniciar: %v", err)
	}
}
