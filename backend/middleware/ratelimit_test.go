package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"semarket/backend/middleware"
)

func TestRateLimit_PermittedRequests(t *testing.T) {
	limiter := middleware.RateLimit(3, time.Minute)

	testHandler := limiter(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	for i := 1; i <= 3; i++ {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.RemoteAddr = "192.168.1.100:12345"
		w := httptest.NewRecorder()

		testHandler(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("Request %d expected 200 OK, got %d", i, w.Code)
		}
	}
}

func TestRateLimit_ExceedLimit(t *testing.T) {
	limiter := middleware.RateLimit(2, 5*time.Second)

	testHandler := limiter(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// 1 & 2: Permitted
	for i := 1; i <= 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/test", nil)
		req.RemoteAddr = "192.168.1.101:12345"
		w := httptest.NewRecorder()
		testHandler(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("Request %d expected 200 OK, got %d", i, w.Code)
		}
	}

	// 3: Exceeded -> 429
	reqBlocked := httptest.NewRequest(http.MethodPost, "/test", nil)
	reqBlocked.RemoteAddr = "192.168.1.101:12345"
	wBlocked := httptest.NewRecorder()
	testHandler(wBlocked, reqBlocked)

	if wBlocked.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected 429 Too Many Requests, got %d: %s", wBlocked.Code, wBlocked.Body.String())
	}

	retryAfter := wBlocked.Header().Get("Retry-After")
	if retryAfter == "" {
		t.Errorf("Expected 'Retry-After' header on 429 response, got empty")
	}
}

func TestRateLimit_PerIPIsolation(t *testing.T) {
	limiter := middleware.RateLimit(2, time.Minute)

	testHandler := limiter(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// IP 1: Max out quota
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.RemoteAddr = "10.0.0.1:8080"
		w := httptest.NewRecorder()
		testHandler(w, req)
	}

	// IP 1: 3rd request blocked
	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req1.RemoteAddr = "10.0.0.1:8080"
	w1 := httptest.NewRecorder()
	testHandler(w1, req1)
	if w1.Code != http.StatusTooManyRequests {
		t.Errorf("Expected 10.0.0.1 to be blocked (429), got %d", w1.Code)
	}

	// IP 2: Should NOT be blocked
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.RemoteAddr = "10.0.0.2:8080"
	w2 := httptest.NewRecorder()
	testHandler(w2, req2)
	if w2.Code != http.StatusOK {
		t.Errorf("Expected 10.0.0.2 to be permitted (200), got %d", w2.Code)
	}
}

func TestRateLimit_ResetAfterWindow(t *testing.T) {
	window := 60 * time.Millisecond
	limiter := middleware.RateLimit(1, window)

	testHandler := limiter(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Request 1: OK
	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req1.RemoteAddr = "172.16.0.5:1234"
	w1 := httptest.NewRecorder()
	testHandler(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w1.Code)
	}

	// Request 2: Blocked
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.RemoteAddr = "172.16.0.5:1234"
	w2 := httptest.NewRecorder()
	testHandler(w2, req2)
	if w2.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected 429 Too Many Requests, got %d", w2.Code)
	}

	// Wait for window to expire
	time.Sleep(window + 20*time.Millisecond)

	// Request 3: OK after reset
	req3 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req3.RemoteAddr = "172.16.0.5:1234"
	w3 := httptest.NewRecorder()
	testHandler(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK after window reset, got %d", w3.Code)
	}
}

func TestGetClientIP(t *testing.T) {
	// 1. X-Forwarded-For
	reqXFF := httptest.NewRequest(http.MethodGet, "/", nil)
	reqXFF.Header.Set("X-Forwarded-For", "203.0.113.195, 70.41.3.18")
	if ip := middleware.GetClientIP(reqXFF); ip != "203.0.113.195" {
		t.Errorf("Expected 203.0.113.195 from XFF, got %s", ip)
	}

	// 2. X-Real-IP
	reqXRI := httptest.NewRequest(http.MethodGet, "/", nil)
	reqXRI.Header.Set("X-Real-IP", "198.51.100.1")
	if ip := middleware.GetClientIP(reqXRI); ip != "198.51.100.1" {
		t.Errorf("Expected 198.51.100.1 from XRI, got %s", ip)
	}

	// 3. RemoteAddr with Port
	reqRemote := httptest.NewRequest(http.MethodGet, "/", nil)
	reqRemote.RemoteAddr = "192.168.1.50:54321"
	if ip := middleware.GetClientIP(reqRemote); ip != "192.168.1.50" {
		t.Errorf("Expected 192.168.1.50 from RemoteAddr, got %s", ip)
	}
}
