// Package handler contiene los handlers HTTP de Fiber y el manejador central
// de errores del servicio.
package handler

import (
	"errors"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"

	"github.com/rejcob/reto-tecnico/go-api/internal/apierror"
	"github.com/rejcob/reto-tecnico/go-api/internal/matrix"
	"github.com/rejcob/reto-tecnico/go-api/internal/model"
	"github.com/rejcob/reto-tecnico/go-api/internal/statsclient"
)

// Handler agrupa las dependencias que necesitan los endpoints.
type Handler struct {
	stats *statsclient.Client
}

// New construye el handler con el cliente de la API de estadisticas.
func New(stats *statsclient.Client) *Handler {
	return &Handler{stats: stats}
}

// Health responde a GET /health.
//
// Lo usan Docker y el reverse proxy para verificar que el servicio esta arriba.
func (h *Handler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok", "service": "go-matrix-api"})
}

// Process responde a POST /process.
//
// Flujo: valida la entrada, aplica la transformacion pedida (rotacion o
// factorizacion QR), envia el resultado a la API Node y responde al cliente
// combinando transformacion y estadisticas en un unico JSON.
func (h *Handler) Process(c *fiber.Ctx) error {
	var request model.ProcessRequest
	if err := c.BodyParser(&request); err != nil {
		return apierror.BadRequest("INVALID_JSON",
			"El body recibido no es JSON valido o no respeta el contrato esperado.", nil)
	}

	if err := matrix.Validate(request.Matrix); err != nil {
		return err
	}

	transformation, err := transform(request)
	if err != nil {
		return err
	}

	statistics, err := h.stats.FetchStatistics(c.UserContext(), model.StatsRequest{
		Mode:   transformation.Mode,
		Result: transformation.Result,
	})
	if err != nil {
		return err
	}

	return c.JSON(model.ProcessResponse{Transformation: transformation, Statistics: statistics})
}

// transform aplica la operacion indicada por el campo 'mode'.
func transform(request model.ProcessRequest) (model.Transformation, error) {
	switch request.Mode {
	case model.ModeRotate:
		// 'degrees' es opcional: si no se envia se aplica la rotacion por defecto.
		degrees := matrix.DefaultDegrees
		if request.Degrees != nil {
			degrees = *request.Degrees
		}

		rotated, err := matrix.Rotate(request.Matrix, degrees)
		if err != nil {
			return model.Transformation{}, err
		}

		return model.Transformation{Mode: request.Mode, Degrees: &degrees, Result: rotated}, nil

	case model.ModeFactQR:
		// 'degrees' no aplica en este modo y se ignora deliberadamente.
		factorization, err := matrix.FactorizeQR(request.Matrix)
		if err != nil {
			return model.Transformation{}, err
		}

		return model.Transformation{Mode: request.Mode, Result: factorization}, nil

	default:
		return model.Transformation{}, apierror.BadRequest("INVALID_MODE",
			"'mode' debe ser uno de: rotate, factqr.",
			map[string]any{"received": request.Mode})
	}
}

// ErrorHandler es el manejador central de errores de Fiber.
//
// Unifica la forma de todas las respuestas de error del servicio en
// {"error": {"code", "message", "details"}}, igual que la API Node, para que
// un cliente pueda tratar ambos servicios de la misma manera.
func ErrorHandler(c *fiber.Ctx, err error) error {
	var apiErr *apierror.APIError
	if errors.As(err, &apiErr) {
		return c.Status(apiErr.StatusCode).JSON(apierror.Response{Error: apiErr})
	}

	// Rutas no declaradas y demas errores propios de Fiber.
	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		code := "REQUEST_ERROR"
		if fiberErr.Code == fiber.StatusNotFound {
			code = "NOT_FOUND"
		}
		return c.Status(fiberErr.Code).JSON(apierror.Response{
			Error: apierror.New(fiberErr.Code, code, fiberErr.Message, nil),
		})
	}

	// Cualquier otro error es inesperado: se registra completo en el servidor y
	// se responde de forma generica para no filtrar detalles internos.
	log.Printf("[error] error no controlado: %v", err)

	return c.Status(http.StatusInternalServerError).JSON(apierror.Response{
		Error: apierror.New(http.StatusInternalServerError, "INTERNAL_ERROR",
			"Ocurrio un error interno en el servicio.", nil),
	})
}
