package handler_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/rejcob/reto-tecnico/go-api/internal/handler"
	"github.com/rejcob/reto-tecnico/go-api/internal/model"
	"github.com/rejcob/reto-tecnico/go-api/internal/statsclient"
)

// newStubStatsAPI levanta una API de estadisticas falsa que devuelve siempre la
// misma respuesta y guarda el ultimo payload recibido, para poder verificar que
// esta API envia exactamente lo que dice el contrato.
func newStubStatsAPI(t *testing.T, received *model.StatsRequest) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		if received != nil {
			_ = json.Unmarshal(body, received)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"max":9,"min":1,"average":5,"sum":45,"isDiagonal":false}`))
	}))

	t.Cleanup(server.Close)
	return server
}

// doProcess ejecuta un POST /process contra la app con el body indicado.
func doProcess(t *testing.T, statsURL, body string) *http.Response {
	t.Helper()

	app := handler.NewApp(statsclient.New(statsURL, 5*time.Second), "*")

	request := httptest.NewRequest(http.MethodPost, "/process", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	response, err := app.Test(request, 5000)
	if err != nil {
		t.Fatalf("app.Test devolvio error: %v", err)
	}
	return response
}

// decodeError extrae el codigo de error de una respuesta de error.
func decodeError(t *testing.T, response *http.Response) string {
	t.Helper()

	var payload struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("no se pudo decodificar el error: %v", err)
	}
	return payload.Error.Code
}

func TestProcessRotateCombinaTransformacionYEstadisticas(t *testing.T) {
	var sent model.StatsRequest
	stats := newStubStatsAPI(t, &sent)

	response := doProcess(t, stats.URL, `{"matrix":[[1,2,3],[4,5,6],[7,8,9]],"mode":"rotate","degrees":90}`)

	if response.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, se esperaba 200", response.StatusCode)
	}

	var body model.ProcessResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("no se pudo decodificar la respuesta: %v", err)
	}

	if body.Transformation.Mode != model.ModeRotate {
		t.Errorf("mode = %q, se esperaba %q", body.Transformation.Mode, model.ModeRotate)
	}
	if body.Statistics.Sum != 45 || body.Statistics.Max != 9 {
		t.Errorf("estadisticas no propagadas correctamente: %+v", body.Statistics)
	}

	// El payload enviado a la API Node debe respetar el contrato acordado.
	if sent.Mode != model.ModeRotate {
		t.Errorf("payload enviado con mode = %q", sent.Mode)
	}
	if sent.Result == nil {
		t.Error("payload enviado sin campo 'result'")
	}
}

func TestProcessAplicaDegreesPorDefecto(t *testing.T) {
	stats := newStubStatsAPI(t, nil)

	response := doProcess(t, stats.URL, `{"matrix":[[1,2],[3,4]],"mode":"rotate"}`)

	var body model.ProcessResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("no se pudo decodificar la respuesta: %v", err)
	}

	if body.Transformation.Degrees == nil || *body.Transformation.Degrees != 90 {
		t.Errorf("degrees por defecto = %v, se esperaba 90", body.Transformation.Degrees)
	}
}

func TestProcessFactQR(t *testing.T) {
	var sent model.StatsRequest
	stats := newStubStatsAPI(t, &sent)

	response := doProcess(t, stats.URL, `{"matrix":[[12,-51,4],[6,167,-68],[-4,24,-41]],"mode":"factqr"}`)

	if response.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, se esperaba 200", response.StatusCode)
	}

	if sent.Mode != model.ModeFactQR {
		t.Errorf("payload enviado con mode = %q", sent.Mode)
	}

	result, ok := sent.Result.(map[string]any)
	if !ok {
		t.Fatalf("'result' enviado no es un objeto: %T", sent.Result)
	}
	if _, ok := result["Q"]; !ok {
		t.Error("'result' enviado no contiene la matriz Q")
	}
	if _, ok := result["R"]; !ok {
		t.Error("'result' enviado no contiene la matriz R")
	}
}

func TestProcessErroresDeValidacion(t *testing.T) {
	stats := newStubStatsAPI(t, nil)

	cases := []struct {
		name     string
		body     string
		wantCode string
	}{
		{"mode invalido", `{"matrix":[[1]],"mode":"transpose"}`, "INVALID_MODE"},
		{"matriz vacia", `{"matrix":[],"mode":"rotate"}`, "INVALID_MATRIX"},
		{"matriz no rectangular", `{"matrix":[[1,2],[3]],"mode":"rotate"}`, "NON_RECTANGULAR_MATRIX"},
		{"degrees invalido", `{"matrix":[[1,2],[3,4]],"mode":"rotate","degrees":45}`, "INVALID_DEGREES"},
		{"matriz ancha en factqr", `{"matrix":[[1,2,3],[4,5,6]],"mode":"factqr"}`, "UNSUPPORTED_MATRIX_SHAPE"},
		{"json mal formado", `{"matrix":[[1,2],`, "INVALID_JSON"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			response := doProcess(t, stats.URL, tc.body)

			if response.StatusCode != http.StatusBadRequest {
				t.Fatalf("status = %d, se esperaba 400", response.StatusCode)
			}
			if code := decodeError(t, response); code != tc.wantCode {
				t.Errorf("code = %q, se esperaba %q", code, tc.wantCode)
			}
		})
	}
}

func TestProcessDevuelve502SiLaAPIDeStatsNoResponde(t *testing.T) {
	// Puerto cerrado: simula la API Node caida.
	response := doProcess(t, "http://127.0.0.1:1/stats", `{"matrix":[[1,2],[3,4]],"mode":"rotate"}`)

	if response.StatusCode != http.StatusBadGateway {
		t.Fatalf("status = %d, se esperaba 502", response.StatusCode)
	}
	if code := decodeError(t, response); code != "STATS_API_UNREACHABLE" {
		t.Errorf("code = %q, se esperaba STATS_API_UNREACHABLE", code)
	}
}

func TestProcessPropagaErrorDeLaAPIDeStats(t *testing.T) {
	failing := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error":{"code":"INVALID_MODE","message":"..."}}`))
	}))
	t.Cleanup(failing.Close)

	response := doProcess(t, failing.URL, `{"matrix":[[1,2],[3,4]],"mode":"rotate"}`)

	if response.StatusCode != http.StatusBadGateway {
		t.Fatalf("status = %d, se esperaba 502", response.StatusCode)
	}
	if code := decodeError(t, response); code != "STATS_API_ERROR" {
		t.Errorf("code = %q, se esperaba STATS_API_ERROR", code)
	}
}

func TestHealth(t *testing.T) {
	app := handler.NewApp(statsclient.New("http://localhost:3001/stats", time.Second), "*")

	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/health", nil))
	if err != nil {
		t.Fatalf("app.Test devolvio error: %v", err)
	}
	if response.StatusCode != http.StatusOK {
		t.Errorf("status = %d, se esperaba 200", response.StatusCode)
	}
}

func TestRutaInexistente(t *testing.T) {
	app := handler.NewApp(statsclient.New("http://localhost:3001/stats", time.Second), "*")

	response, err := app.Test(httptest.NewRequest(http.MethodGet, "/no-existe", nil))
	if err != nil {
		t.Fatalf("app.Test devolvio error: %v", err)
	}
	if response.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, se esperaba 404", response.StatusCode)
	}
	if code := decodeError(t, response); code != "NOT_FOUND" {
		t.Errorf("code = %q, se esperaba NOT_FOUND", code)
	}
}

func TestCORSPermiteLlamadasDesdeElNavegador(t *testing.T) {
	// El frontend corre en otro origen, asi que el navegador envia primero una
	// peticion OPTIONS de preflight y exige las cabeceras CORS en la respuesta.
	app := handler.NewApp(statsclient.New("http://localhost:3001/stats", time.Second), "*")

	request := httptest.NewRequest(http.MethodOptions, "/process", nil)
	request.Header.Set("Origin", "http://localhost:3000")
	request.Header.Set("Access-Control-Request-Method", "POST")

	response, err := app.Test(request)
	if err != nil {
		t.Fatalf("app.Test devolvio error: %v", err)
	}

	if origin := response.Header.Get("Access-Control-Allow-Origin"); origin == "" {
		t.Error("falta la cabecera Access-Control-Allow-Origin en el preflight")
	}
	if methods := response.Header.Get("Access-Control-Allow-Methods"); !strings.Contains(methods, "POST") {
		t.Errorf("Access-Control-Allow-Methods = %q, deberia incluir POST", methods)
	}
}
