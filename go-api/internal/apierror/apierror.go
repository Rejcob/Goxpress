// Package apierror define el tipo de error de aplicacion y el formato unico
// de respuesta de error del servicio.
package apierror

import "net/http"

// APIError representa un error con codigo HTTP y codigo de error asociado.
//
// Permite que las capas de dominio (validacion, transformaciones, cliente HTTP)
// devuelvan errores semanticos sin conocer Fiber, y que el manejador central
// los traduzca a una respuesta coherente.
type APIError struct {
	StatusCode int    `json:"-"`
	Code       string `json:"code"`
	Message    string `json:"message"`
	Details    any    `json:"details,omitempty"`
}

// Error implementa la interfaz error.
func (e *APIError) Error() string { return e.Message }

// Response es el envoltorio que se serializa en el body de una respuesta de error.
type Response struct {
	Error *APIError `json:"error"`
}

// New construye un APIError con un status HTTP arbitrario.
func New(statusCode int, code, message string, details any) *APIError {
	return &APIError{StatusCode: statusCode, Code: code, Message: message, Details: details}
}

// BadRequest construye un error de validacion de entrada (HTTP 400).
func BadRequest(code, message string, details any) *APIError {
	return New(http.StatusBadRequest, code, message, details)
}

// BadGateway construye un error de dependencia aguas abajo (HTTP 502),
// usado cuando la API de estadisticas no responde o responde con error.
func BadGateway(code, message string, details any) *APIError {
	return New(http.StatusBadGateway, code, message, details)
}
