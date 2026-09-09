package middleware

import (
	"log"
	"net/http"
	"time"
)

type statusLoggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *statusLoggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

// Logger logs each incoming HTTP request with method, path, status, and duration.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		lrw := &statusLoggingResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(lrw, r)

		duration := time.Since(start)
		log.Printf("[HTTP] %s %s -> %d (%v)", r.Method, r.URL.Path, lrw.statusCode, duration)
	})
}
