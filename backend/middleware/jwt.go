package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"

	"semarket/backend/models"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserContextKey contextKey = "jwt_user"
	defaultSecret  string     = "semarketplace_super_secret_jwt_key_2026_x99"
)

type Claims struct {
	UserID  string `json:"userId"`
	Email   string `json:"email"`
	Role    string `json:"role"`
	IsAdmin bool   `json:"isAdmin"`
	jwt.RegisteredClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = defaultSecret
	}
	return []byte(secret)
}

// GenerateToken issues a signed JWT token valid for 7 days.
func GenerateToken(u models.User) (string, error) {
	claims := Claims{
		UserID:  u.ID,
		Email:   u.Email,
		Role:    u.Role,
		IsAdmin: u.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "semarketplace",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

// ValidateToken parses and validates a JWT token string.
func ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}

// ExtractToken retrieves the bearer token from the Authorization header.
func ExtractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return strings.TrimSpace(parts[1])
	}
	return ""
}

// GetClaims retrieves Claims from request context if authenticated.
func GetClaims(r *http.Request) *Claims {
	if val := r.Context().Value(UserContextKey); val != nil {
		if claims, ok := val.(*Claims); ok {
			return claims
		}
	}
	return nil
}

// RequireAuth enforces that a valid JWT is present.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := ExtractToken(r)
		if tokenStr == "" {
			Error(w, http.StatusUnauthorized, "Unauthorized: Authentication token required")
			return
		}

		claims, err := ValidateToken(tokenStr)
		if err != nil {
			Error(w, http.StatusUnauthorized, "Unauthorized: Invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// RequireAdmin enforces that a valid JWT with Admin role is present.
func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := ExtractToken(r)
		if tokenStr == "" {
			Error(w, http.StatusUnauthorized, "Unauthorized: Admin authentication token required")
			return
		}

		claims, err := ValidateToken(tokenStr)
		if err != nil {
			Error(w, http.StatusUnauthorized, "Unauthorized: Invalid or expired token")
			return
		}

		if !claims.IsAdmin {
			Error(w, http.StatusForbidden, "Forbidden: Admin privileges required")
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// OptionalAuth parses the token if provided, but does not block if missing.
func OptionalAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := ExtractToken(r)
		if tokenStr != "" {
			if claims, err := ValidateToken(tokenStr); err == nil {
				ctx := context.WithValue(r.Context(), UserContextKey, claims)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}
		next.ServeHTTP(w, r)
	}
}
