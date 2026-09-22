// Package model define los contratos de entrada y salida del servicio, y el
// contrato con la API de estadisticas en Node.
package model

// Modos de transformacion soportados por POST /process.
const (
	// ModeRotate rota la matriz recibida 90, 180 o 270 grados en sentido horario.
	ModeRotate = "rotate"
	// ModeFactQR calcula la factorizacion QR de la matriz recibida.
	ModeFactQR = "factqr"
)

// ProcessRequest es el body que recibe POST /process.
//
// Degrees es un puntero para poder distinguir "no enviado" (se aplica el
// default de 90) de un valor enviado explicitamente pero invalido.
type ProcessRequest struct {
	Matrix  [][]float64 `json:"matrix"`
	Mode    string      `json:"mode"`
	Degrees *int        `json:"degrees,omitempty"`
}

// QRResult son las matrices que produce la factorizacion QR.
type QRResult struct {
	Q [][]float64 `json:"Q"`
	R [][]float64 `json:"R"`
}

// Transformation describe la transformacion aplicada a la matriz de entrada.
//
// Result es polimorfico segun el modo: una matriz ([][]float64) para "rotate"
// y un QRResult para "factqr". Degrees solo se serializa en modo "rotate".
type Transformation struct {
	Mode    string `json:"mode"`
	Degrees *int   `json:"degrees,omitempty"`
	Result  any    `json:"result"`
}

// StatsRequest es el body que esta API envia a la API Node (POST /stats).
type StatsRequest struct {
	Mode   string `json:"mode"`
	Result any    `json:"result"`
}

// Statistics son las estadisticas devueltas por la API Node.
type Statistics struct {
	Max        float64 `json:"max"`
	Min        float64 `json:"min"`
	Average    float64 `json:"average"`
	Sum        float64 `json:"sum"`
	IsDiagonal bool    `json:"isDiagonal"`
}

// ProcessResponse es la respuesta final al cliente de POST /process:
// combina el resultado de la transformacion con las estadisticas calculadas
// por la API Node, en dos bloques claramente identificados.
type ProcessResponse struct {
	Transformation Transformation `json:"transformation"`
	Statistics     Statistics     `json:"statistics"`
}
