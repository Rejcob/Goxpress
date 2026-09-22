// Package config centraliza la configuracion del servicio.
package config

import (
	"os"
	"strconv"
	"time"
)

// Config agrupa los parametros de ejecucion del servicio.
//
// Todos se leen de variables de entorno y tienen un default razonable para
// desarrollo local, de modo que el servicio arranca sin configuracion previa.
type Config struct {
	// Port es el puerto HTTP en el que escucha esta API.
	Port string
	// StatsAPIURL es el endpoint de la API Node al que se envia el resultado.
	StatsAPIURL string
	// StatsAPITimeout limita cuanto se espera la respuesta de la API Node.
	StatsAPITimeout time.Duration
	// CORSOrigins son los origenes permitidos para llamadas desde un navegador,
	// separados por coma. "*" permite cualquiera.
	CORSOrigins string
}

// Load construye la configuracion a partir del entorno.
func Load() Config {
	return Config{
		Port:            getEnv("PORT", "8080"),
		StatsAPIURL:     getEnv("STATS_API_URL", "http://localhost:3001/stats"),
		StatsAPITimeout: getEnvDuration("STATS_API_TIMEOUT", 10*time.Second),
		CORSOrigins:     getEnv("CORS_ORIGINS", "*"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	// Se acepta tanto una duracion de Go ("10s") como un numero de segundos.
	if parsed, err := time.ParseDuration(raw); err == nil {
		return parsed
	}
	if seconds, err := strconv.Atoi(raw); err == nil {
		return time.Duration(seconds) * time.Second
	}
	return fallback
}
