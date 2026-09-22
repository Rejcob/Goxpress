// Package matrix contiene la validacion de matrices y las transformaciones
// que ofrece el servicio: rotacion y factorizacion QR.
package matrix

import (
	"fmt"
	"math"

	"github.com/rejcob/reto-tecnico/go-api/internal/apierror"
)

// Validate verifica que la matriz recibida sea rectangular y contenga solo
// numeros finitos.
//
// Se exige que todas las filas tengan la misma longitud porque una matriz
// "irregular" no es una matriz valida y haria ambiguo tanto el resultado de la
// rotacion como el de la factorizacion. NaN e Infinity se rechazan de forma
// explicita: el encoding/json de Go no puede serializarlos y ademas
// contaminarian silenciosamente las estadisticas.
func Validate(m [][]float64) error {
	if len(m) == 0 {
		return apierror.BadRequest(
			"INVALID_MATRIX",
			"'matrix' debe ser un array de arrays de numeros y no puede estar vacio.",
			nil,
		)
	}

	columns := len(m[0])
	if columns == 0 {
		return apierror.BadRequest(
			"INVALID_MATRIX",
			"'matrix' debe contener al menos una fila con al menos una columna.",
			nil,
		)
	}

	for i, row := range m {
		if len(row) != columns {
			return apierror.BadRequest(
				"NON_RECTANGULAR_MATRIX",
				fmt.Sprintf("'matrix' debe ser rectangular: la fila %d tiene %d columnas y se esperaban %d.", i, len(row), columns),
				nil,
			)
		}

		for j, value := range row {
			if math.IsNaN(value) || math.IsInf(value, 0) {
				return apierror.BadRequest(
					"INVALID_MATRIX_VALUE",
					fmt.Sprintf("'matrix[%d][%d]' debe ser un numero finito.", i, j),
					nil,
				)
			}
		}
	}

	return nil
}

// Dimensions devuelve la cantidad de filas y columnas de una matriz ya validada.
func Dimensions(m [][]float64) (rows, columns int) {
	return len(m), len(m[0])
}

// newMatrix reserva una matriz de rows x columns.
//
// Se reserva el respaldo en un unico bloque contiguo y luego se reparte en
// filas: esto hace una sola asignacion en lugar de una por fila.
func newMatrix(rows, columns int) [][]float64 {
	backing := make([]float64, rows*columns)
	out := make([][]float64, rows)
	for i := range out {
		out[i] = backing[i*columns : (i+1)*columns : (i+1)*columns]
	}
	return out
}
