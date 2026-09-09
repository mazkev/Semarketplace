package main

import (
	"log"
	"net/http"
	"os"

	"semarket/backend/database"
	"semarket/backend/handlers"
	"semarket/backend/middleware"
)

func main() {
	log.Println("Initializing SeMarketplace Backend Server...")

	// 1. Initialize SQLite Database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer db.Close()

	// 2. Setup Router
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "semarket-backend"})
	})

	// Auth routes
	mux.HandleFunc("/api/auth/login", handlers.LoginHandler)
	mux.HandleFunc("/api/auth/register", handlers.RegisterHandler)

	// Products routes
	mux.HandleFunc("/api/products", handlers.ProductsHandler)
	mux.HandleFunc("/api/products/", handlers.ProductsHandler)

	// Orders routes
	mux.HandleFunc("/api/orders", handlers.OrdersHandler)
	mux.HandleFunc("/api/orders/", handlers.OrdersHandler)

	// Coupons routes
	mux.HandleFunc("/api/coupons", handlers.CouponsHandler)
	mux.HandleFunc("/api/coupons/", handlers.CouponsHandler)

	// Users routes
	mux.HandleFunc("/api/users", handlers.UsersHandler)
	mux.HandleFunc("/api/users/", handlers.UsersHandler)

	// Analytics routes
	mux.HandleFunc("/api/analytics", handlers.AnalyticsHandler)
	mux.HandleFunc("/api/analytics/overview", handlers.AnalyticsHandler)

	// 3. Attach CORS middleware
	handler := middleware.CORS(mux)

	// 4. Determine Port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("SeMarketplace Backend is listening on http://localhost%s\n", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
