package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

var wishlistCounter uint64

func WishlistHandler(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		tokenStr := middleware.ExtractToken(r)
		if tokenStr != "" {
			claims, _ = middleware.ValidateToken(tokenStr)
		}
	}
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required to access wishlist")
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/wishlist")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			getUserWishlist(w, claims.UserID)
		case http.MethodPost:
			addToWishlist(w, r, claims.UserID)
		default:
			middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	// /api/wishlist/{productId}
	productID := path
	if r.Method == http.MethodDelete {
		removeFromWishlist(w, claims.UserID, productID)
		return
	}

	middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func getUserWishlist(w http.ResponseWriter, userID string) {
	query := `
		SELECT p.id, p.name, p.price, p.original_price, p.category, p.image, p.stock, p.rating, p.sold, p.description, p.is_flash_sale, p.created_at
		FROM wishlist w
		JOIN products p ON w.product_id = p.id
		WHERE w.user_id = ?
		ORDER BY w.created_at DESC
	`
	rows, err := database.DB.Query(database.Rebind(query), userID)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to load wishlist: "+err.Error())
		return
	}
	defer rows.Close()

	products := make([]models.Product, 0)
	for rows.Next() {
		var p models.Product
		var isFlashSaleInt int
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.OriginalPrice, &p.Category,
			&p.Image, &p.Stock, &p.Rating, &p.Sold, &p.Description,
			&isFlashSaleInt, &p.CreatedAt,
		); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed scanning wishlist item: "+err.Error())
			return
		}
		p.IsFlashSale = isFlashSaleInt == 1
		p.IDAlias = p.ID
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading wishlist items: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusOK, products)
}

func addToWishlist(w http.ResponseWriter, r *http.Request, userID string) {
	var req struct {
		ProductID string `json:"productId"`
		ID        string `json:"_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	productID := strings.TrimSpace(req.ProductID)
	if productID == "" {
		productID = strings.TrimSpace(req.ID)
	}
	if productID == "" {
		middleware.Error(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	// Verify product exists in database
	var prodExists int
	err := database.DB.QueryRow(database.Rebind("SELECT COUNT(*) FROM products WHERE id = ?"), productID).Scan(&prodExists)
	if err != nil || prodExists == 0 {
		middleware.Error(w, http.StatusNotFound, "Product not found")
		return
	}

	// Check if already in wishlist
	var alreadyInWishlist int
	_ = database.DB.QueryRow(
		database.Rebind("SELECT COUNT(*) FROM wishlist WHERE user_id = ? AND product_id = ?"),
		userID, productID,
	).Scan(&alreadyInWishlist)

	if alreadyInWishlist == 0 {
		seq := atomic.AddUint64(&wishlistCounter, 1)
		newID := fmt.Sprintf("WISH-%d-%d", time.Now().UnixNano(), seq)
		createdAt := time.Now().UTC().Format(time.RFC3339)

		_, err = database.DB.Exec(
			database.Rebind("INSERT INTO wishlist (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)"),
			newID, userID, productID, createdAt,
		)
		if err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to save wishlist item: "+err.Error())
			return
		}
	}

	middleware.JSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"productId": productID,
	})
}

func removeFromWishlist(w http.ResponseWriter, userID string, productID string) {
	productID = strings.TrimSpace(productID)
	if productID == "" {
		middleware.Error(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	_, err := database.DB.Exec(
		database.Rebind("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?"),
		userID, productID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to remove from wishlist: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"productId": productID,
	})
}
