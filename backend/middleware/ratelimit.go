package middleware

import (
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type clientRecord struct {
	timestamps []time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	clients map[string]*clientRecord
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		limit:   limit,
		window:  window,
		clients: make(map[string]*clientRecord),
	}

	// Periodic cleanup goroutine to prevent memory leak
	go rl.cleanupRoutine()
	return rl
}

func (rl *RateLimiter) cleanupRoutine() {
	ticker := time.NewTicker(rl.window * 2)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, record := range rl.clients {
			valid := record.timestamps[:0]
			for _, ts := range record.timestamps {
				if now.Sub(ts) <= rl.window {
					valid = append(valid, ts)
				}
			}
			if len(valid) == 0 {
				delete(rl.clients, ip)
			} else {
				record.timestamps = valid
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Allow(ip string) (bool, time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	record, exists := rl.clients[ip]
	if !exists {
		record = &clientRecord{timestamps: make([]time.Time, 0, rl.limit)}
		rl.clients[ip] = record
	}

	valid := record.timestamps[:0]
	for _, ts := range record.timestamps {
		if ts.After(cutoff) {
			valid = append(valid, ts)
		}
	}
	record.timestamps = valid

	if len(record.timestamps) >= rl.limit {
		oldest := record.timestamps[0]
		retryAfter := rl.window - now.Sub(oldest)
		if retryAfter < time.Second {
			retryAfter = time.Second
		}
		return false, retryAfter
	}

	record.timestamps = append(record.timestamps, now)
	return true, 0
}

func GetClientIP(r *http.Request) string {
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		parts := strings.Split(xff, ",")
		clientIP := strings.TrimSpace(parts[0])
		if clientIP != "" {
			return clientIP
		}
	}

	xri := strings.TrimSpace(r.Header.Get("X-Real-IP"))
	if xri != "" {
		return xri
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}

func RateLimit(limit int, window time.Duration) func(http.HandlerFunc) http.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			ip := GetClientIP(r)
			allowed, retryAfter := limiter.Allow(ip)
			if !allowed {
				retrySeconds := int(retryAfter.Seconds())
				if retrySeconds <= 0 {
					retrySeconds = 1
				}
				w.Header().Set("Retry-After", fmt.Sprintf("%d", retrySeconds))
				Error(w, http.StatusTooManyRequests, "Too many requests. Please try again later.")
				return
			}
			next(w, r)
		}
	}
}
