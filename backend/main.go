package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"semarket/backend/database"
	"semarket/backend/handlers"
	"semarket/backend/middleware"
)

func main() {
	log.Println("Initializing SeMarketplace Backend Server...")

	// 1. Initialize Database
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

	// Users routes (Admin Protected)
	mux.HandleFunc("/api/users", middleware.RequireAdmin(handlers.UsersHandler))
	mux.HandleFunc("/api/users/", middleware.RequireAdmin(handlers.UsersHandler))

	// Analytics routes (Admin Protected)
	mux.HandleFunc("/api/analytics", middleware.RequireAdmin(handlers.AnalyticsHandler))
	mux.HandleFunc("/api/analytics/overview", middleware.RequireAdmin(handlers.AnalyticsHandler))

	// 3. Attach CORS, BodyLimit, Gzip, and Logger middleware
	handler := middleware.Logger(middleware.CORS(middleware.BodyLimit(middleware.Gzip(mux))))

	// 4. Determine Port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port

	// 5. Hardened HTTP Server with strict timeouts against Slowloris & leaks
	server := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		ReadHeaderTimeout: 3 * time.Second,
	}

	// 6. Non-blocking server start with Graceful Shutdown
	go func() {
		log.Printf("⚡ SeMarketplace Backend listening on http://localhost%s\n", addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for OS interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down SeMarketplace Backend gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced shutdown with error: %v", err)
	}

	log.Println("Server exiting. Goodbye!")
}

