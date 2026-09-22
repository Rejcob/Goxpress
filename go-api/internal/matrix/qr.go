package matrix

import (
	"fmt"

	"gonum.org/v1/gonum/mat"

	"github.com/rejcob/reto-tecnico/go-api/internal/apierror"
	"github.com/rejcob/reto-tecnico/go-api/internal/model"
)

// FactorizeQR calcula la factorizacion QR de la matriz recibida usando Gonum.
//
// La factorizacion se delega en gonum/mat en lugar de implementar Householder
// a mano: es una rutina numericamente delicada y Gonum es la referencia del
// ecosistema Go para algebra lineal.
//
// Restriccion de forma: Gonum factoriza matrices rectangulares siempre que
// tengan al menos tantas filas como columnas (m >= n). Con m < n el sistema
// esta subdeterminado y Gonum entra en panico, por lo que ese caso se valida
// antes y se devuelve un error 400 explicito en lugar de dejar caer el request.
//
// Dimensiones del resultado: Q es m x m (ortogonal) y R es m x n (triangular
// superior).
func FactorizeQR(m [][]float64) (model.QRResult, error) {
	rows, columns := Dimensions(m)

	if rows < columns {
		return model.QRResult{}, apierror.BadRequest(
			"UNSUPPORTED_MATRIX_SHAPE",
			fmt.Sprintf("La factorizacion QR requiere una matriz con al menos tantas filas como columnas (m >= n); se recibio una de %dx%d.", rows, columns),
			map[string]any{"rows": rows, "columns": columns},
		)
	}

	dense := mat.NewDense(rows, columns, flatten(m))

	var qr mat.QR
	qr.Factorize(dense)

	var q, r mat.Dense
	qr.QTo(&q)
	qr.RTo(&r)

	return model.QRResult{Q: toSlices(&q), R: toSlices(&r)}, nil
}

// flatten convierte una matriz en el slice contiguo en orden por filas que
// espera mat.NewDense.
func flatten(m [][]float64) []float64 {
	rows, columns := Dimensions(m)
	out := make([]float64, 0, rows*columns)
	for _, row := range m {
		out = append(out, row...)
	}
	return out
}

// toSlices convierte una matriz densa de Gonum en el array de arrays que se
// serializa en la respuesta JSON.
func toSlices(d *mat.Dense) [][]float64 {
	rows, columns := d.Dims()
	out := newMatrix(rows, columns)
	for i := 0; i < rows; i++ {
		copy(out[i], d.RawRowView(i))
	}
	return out
}
