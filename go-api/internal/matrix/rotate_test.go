package matrix_test

import (
	"reflect"
	"testing"

	"github.com/rejcob/reto-tecnico/go-api/internal/matrix"
)

func TestRotateSquare(t *testing.T) {
	input := [][]float64{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}

	cases := []struct {
		degrees int
		want    [][]float64
	}{
		{90, [][]float64{{7, 4, 1}, {8, 5, 2}, {9, 6, 3}}},
		{180, [][]float64{{9, 8, 7}, {6, 5, 4}, {3, 2, 1}}},
		{270, [][]float64{{3, 6, 9}, {2, 5, 8}, {1, 4, 7}}},
	}

	for _, tc := range cases {
		got, err := matrix.Rotate(input, tc.degrees)
		if err != nil {
			t.Fatalf("Rotate(%d) devolvio error: %v", tc.degrees, err)
		}
		if !reflect.DeepEqual(got, tc.want) {
			t.Errorf("Rotate(%d) = %v, se esperaba %v", tc.degrees, got, tc.want)
		}
	}
}

func TestRotateRectangularInvierteDimensiones(t *testing.T) {
	// Matriz de 2x3: al rotar 90 grados debe quedar de 3x2.
	input := [][]float64{{1, 2, 3}, {4, 5, 6}}

	got, err := matrix.Rotate(input, 90)
	if err != nil {
		t.Fatalf("Rotate devolvio error: %v", err)
	}

	want := [][]float64{{4, 1}, {5, 2}, {6, 3}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("Rotate(90) = %v, se esperaba %v", got, want)
	}
}

func TestRotateRectangular270(t *testing.T) {
	input := [][]float64{{1, 2, 3}, {4, 5, 6}}

	got, err := matrix.Rotate(input, 270)
	if err != nil {
		t.Fatalf("Rotate devolvio error: %v", err)
	}

	want := [][]float64{{3, 6}, {2, 5}, {1, 4}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("Rotate(270) = %v, se esperaba %v", got, want)
	}
}

func TestRotateDegreesInvalidos(t *testing.T) {
	// 360 no esta soportado a proposito: es la identidad.
	for _, degrees := range []int{0, 45, 360, -90} {
		if _, err := matrix.Rotate([][]float64{{1}}, degrees); err == nil {
			t.Errorf("Rotate(%d) deberia devolver error", degrees)
		}
	}
}

func TestValidate(t *testing.T) {
	cases := []struct {
		name      string
		input     [][]float64
		wantError bool
	}{
		{"matriz valida", [][]float64{{1, 2}, {3, 4}}, false},
		{"matriz vacia", [][]float64{}, true},
		{"fila vacia", [][]float64{{}}, true},
		{"no rectangular", [][]float64{{1, 2}, {3}}, true},
	}

	for _, tc := range cases {
		err := matrix.Validate(tc.input)
		if (err != nil) != tc.wantError {
			t.Errorf("Validate(%s): error = %v, se esperaba error = %v", tc.name, err, tc.wantError)
		}
	}
}
