package matrix

import (
	"fmt"

	"github.com/rejcob/reto-tecnico/go-api/internal/apierror"
)

// DefaultDegrees es la rotacion aplicada cuando el cliente no envia 'degrees'.
const DefaultDegrees = 90

// SupportedDegrees son los angulos de rotacion aceptados.
//
// No se incluye 360 porque es la identidad: no aporta informacion y solo
// duplicaria la matriz de entrada.
var SupportedDegrees = []int{90, 180, 270}

// Rotate rota la matriz el angulo indicado en sentido horario.
//
// Cada angulo se resuelve con su propio mapeo de indices en un unico recorrido,
// en lugar de aplicar la rotacion de 90 grados varias veces: el costo es O(n)
// sobre los elementos para cualquier angulo.
//
// Para 90 y 270 grados la matriz resultante tiene las dimensiones invertidas
// (una matriz de r x c se convierte en una de c x r).
func Rotate(m [][]float64, degrees int) ([][]float64, error) {
	rows, columns := Dimensions(m)

	switch degrees {
	case 90:
		// (i, j) -> (j, rows-1-i)
		out := newMatrix(columns, rows)
		for i := 0; i < rows; i++ {
			for j := 0; j < columns; j++ {
				out[j][rows-1-i] = m[i][j]
			}
		}
		return out, nil

	case 180:
		// (i, j) -> (rows-1-i, columns-1-j)
		out := newMatrix(rows, columns)
		for i := 0; i < rows; i++ {
			for j := 0; j < columns; j++ {
				out[rows-1-i][columns-1-j] = m[i][j]
			}
		}
		return out, nil

	case 270:
		// (i, j) -> (columns-1-j, i)
		out := newMatrix(columns, rows)
		for i := 0; i < rows; i++ {
			for j := 0; j < columns; j++ {
				out[columns-1-j][i] = m[i][j]
			}
		}
		return out, nil

	default:
		return nil, apierror.BadRequest(
			"INVALID_DEGREES",
			fmt.Sprintf("'degrees' debe ser uno de: %v.", SupportedDegrees),
			map[string]any{"received": degrees},
		)
	}
}
