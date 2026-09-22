// Package statsclient encapsula la comunicacion HTTP con la API de
// estadisticas escrita en Node.
package statsclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/rejcob/reto-tecnico/go-api/internal/apierror"
	"github.com/rejcob/reto-tecnico/go-api/internal/model"
)

// Client envia el resultado de la transformacion a la API Node y devuelve las
// estadisticas calculadas.
type Client struct {
	url  string
	http *http.Client
}

// New construye un cliente apuntando a la URL indicada.
//
// Se reutiliza un unico http.Client (y por lo tanto su pool de conexiones)
// durante toda la vida del servicio, en lugar de crear uno por request.
func New(url string, timeout time.Duration) *Client {
	return &Client{url: url, http: &http.Client{Timeout: timeout}}
}

// FetchStatistics hace POST /stats con el resultado de la transformacion.
//
// Los fallos de la dependencia se traducen a 502: el request del cliente era
// valido, lo que fallo fue el servicio aguas abajo. Si la API Node responde con
// un error de negocio, se propaga su codigo y mensaje para no perder el
// diagnostico real detras de un mensaje generico.
func (c *Client) FetchStatistics(ctx context.Context, payload model.StatsRequest) (model.Statistics, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return model.Statistics{}, apierror.New(http.StatusInternalServerError, "STATS_ENCODE_ERROR",
			"No se pudo serializar el resultado para la API de estadisticas.", nil)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url, bytes.NewReader(body))
	if err != nil {
		return model.Statistics{}, apierror.New(http.StatusInternalServerError, "STATS_REQUEST_ERROR",
			"No se pudo construir la peticion a la API de estadisticas.", nil)
	}
	request.Header.Set("Content-Type", "application/json")

	response, err := c.http.Do(request)
	if err != nil {
		return model.Statistics{}, apierror.BadGateway("STATS_API_UNREACHABLE",
			"No se pudo contactar la API de estadisticas.",
			map[string]any{"url": c.url, "cause": err.Error()})
	}
	defer response.Body.Close()

	raw, err := io.ReadAll(response.Body)
	if err != nil {
		return model.Statistics{}, apierror.BadGateway("STATS_API_READ_ERROR",
			"No se pudo leer la respuesta de la API de estadisticas.", nil)
	}

	if response.StatusCode != http.StatusOK {
		// El cuerpo del error de la API Node se adjunta tal cual si es JSON
		// valido; si no lo es, se adjunta como texto para no romper la
		// serializacion de esta respuesta.
		var upstream any = string(raw)
		if json.Valid(raw) {
			upstream = json.RawMessage(raw)
		}

		return model.Statistics{}, apierror.BadGateway("STATS_API_ERROR",
			fmt.Sprintf("La API de estadisticas respondio con estado %d.", response.StatusCode),
			map[string]any{"upstream": upstream})
	}

	var statistics model.Statistics
	if err := json.Unmarshal(raw, &statistics); err != nil {
		return model.Statistics{}, apierror.BadGateway("STATS_API_INVALID_RESPONSE",
			"La API de estadisticas devolvio una respuesta que no se pudo interpretar.", nil)
	}

	return statistics, nil
}
