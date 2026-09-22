package matrix_test

import (
	"math"
	"testing"

	"github.com/rejcob/reto-tecnico/go-api/internal/matrix"
)

const tolerance = 1e-9

// multiply multiplica dos matrices, para verificar que Q*R reconstruye la entrada.
func multiply(a, b [][]float64) [][]float64 {
	rows, inner, columns := len(a), len(b), len(b[0])
	out := make([][]float64, rows)
	for i := range out {
		out[i] = make([]float64, columns)
		for j := 0; j < columns; j++ {
			sum := 0.0
			for k := 0; k < inner; k++ {
				sum += a[i][k] * b[k][j]
			}
			out[i][j] = sum
		}
	}
	return out
}

func assertClose(t *testing.T, got, want [][]float64) {
	t.Helper()
	for i := range want {
		for j := range want[i] {
			if math.Abs(got[i][j]-want[i][j]) > tolerance {
				t.Fatalf("elemento [%d][%d] = %v, se esperaba %v", i, j, got[i][j], want[i][j])
			}
		}
	}
}

func TestFactorizeQRReconstruyeLaMatriz(t *testing.T) {
	input := [][]float64{{12, -51, 4}, {6, 167, -68}, {-4, 24, -41}}

	result, err := matrix.FactorizeQR(input)
	if err != nil {
		t.Fatalf("FactorizeQR devolvio error: %v", err)
	}

	assertClose(t, multiply(result.Q, result.R), input)
}

func TestFactorizeQRMatrizRectangularAlta(t *testing.T) {
	// Mas filas que columnas (m > n): caso soportado por Gonum.
	input := [][]float64{{1, 2}, {3, 4}, {5, 6}}

	result, err := matrix.FactorizeQR(input)
	if err != nil {
		t.Fatalf("FactorizeQR devolvio error: %v", err)
	}

	if len(result.Q) != 3 || len(result.Q[0]) != 3 {
		t.Errorf("Q deberia ser de 3x3, es de %dx%d", len(result.Q), len(result.Q[0]))
	}
	if len(result.R) != 3 || len(result.R[0]) != 2 {
		t.Errorf("R deberia ser de 3x2, es de %dx%d", len(result.R), len(result.R[0]))
	}

	assertClose(t, multiply(result.Q, result.R), input)
}

func TestFactorizeQRRechazaMatrizAncha(t *testing.T) {
	// Menos filas que columnas (m < n): Gonum no lo soporta, debe devolver error.
	if _, err := matrix.FactorizeQR([][]float64{{1, 2, 3}, {4, 5, 6}}); err == nil {
		t.Error("FactorizeQR deberia devolver error para una matriz de 2x3")
	}
}

func TestFactorizeQREsTriangularSuperior(t *testing.T) {
	result, err := matrix.FactorizeQR([][]float64{{12, -51, 4}, {6, 167, -68}, {-4, 24, -41}})
	if err != nil {
		t.Fatalf("FactorizeQR devolvio error: %v", err)
	}

	for i := range result.R {
		for j := 0; j < i && j < len(result.R[i]); j++ {
			if math.Abs(result.R[i][j]) > tolerance {
				t.Errorf("R[%d][%d] = %v, se esperaba 0 (R debe ser triangular superior)", i, j, result.R[i][j])
			}
		}
	}
}
