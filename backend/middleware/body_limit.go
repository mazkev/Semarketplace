package middleware

import (
	"net/http"
)

const maxRequestBodyBytes = 1 << 20 // 1 MB

// BodyLimit limits the incoming HTTP request body to 1MB.
func BodyLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
		}
		next.ServeHTTP(w, r)
	})
}
