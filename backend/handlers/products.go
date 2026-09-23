package handlers

import (
	"database/sql"
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

var reviewCounter uint64

func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	// Path routing: /api/products, /api/products/{id}, /api/products/{id}/reviews, or /api/products/{id}/reviews/{reviewId}
	path := strings.TrimPrefix(r.URL.Path, "/api/products")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			getAllProducts(w, r)
		case http.MethodPost:
			middleware.RequireAdmin(createProduct)(w, r)
		default:
			middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	parts := strings.Split(path, "/")
	if len(parts) >= 2 && parts[1] == "reviews" {
		handleProductReviews(w, r, parts[0], parts)
		return
	}

	handleSingleProduct(w, r, parts[0])
}

func handleSingleProduct(w http.ResponseWriter, r *http.Request, id string) {
	switch r.Method {
	case http.MethodGet:
		getProductByID(w, r, id)
	case http.MethodPut:
		middleware.RequireAdmin(func(w http.ResponseWriter, r *http.Request) {
			updateProduct(w, r, id)
		})(w, r)
	case http.MethodDelete:
		middleware.RequireAdmin(func(w http.ResponseWriter, r *http.Request) {
			deleteProduct(w, r, id)
		})(w, r)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getAllProducts(w http.ResponseWriter, r *http.Request) {
	category := strings.TrimSpace(r.URL.Query().Get("category"))

	var rows *sql.Rows
	var err error

	if category != "" && strings.ToLower(category) != "all" {
		query := database.Rebind(
			`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, COALESCE(store_id, 'store-official'), COALESCE(store_name, 'SE-MARKET Official Store'), COALESCE(variants_json, '[]') 
			 FROM products WHERE category = ? ORDER BY id DESC`,
		)
		rows, err = database.DB.Query(query, category)
	} else {
		rows, err = database.DB.Query(
			`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, COALESCE(store_id, 'store-official'), COALESCE(store_name, 'SE-MARKET Official Store'), COALESCE(variants_json, '[]') 
			 FROM products ORDER BY id DESC`,
		)
	}
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query products: "+err.Error())
		return
	}
	defer rows.Close()

	products := make([]models.Product, 0)
	for rows.Next() {
		var p models.Product
		var flashSaleInt int
		var variantsJSON string
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.OriginalPrice, &p.Category,
			&p.Image, &p.Stock, &p.Rating, &p.Sold, &p.Description,
			&flashSaleInt, &p.CreatedAt, &p.StoreID, &p.StoreName, &variantsJSON,
		); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to scan product: "+err.Error())
			return
		}
		p.IsFlashSale = flashSaleInt == 1
		p.IDAlias = p.ID
		_ = json.Unmarshal([]byte(variantsJSON), &p.Variants)
		if p.Variants == nil {
			p.Variants = []string{}
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading products: "+err.Error())
		return
	}

	w.Header().Set("Cache-Control", "public, max-age=15, stale-while-revalidate=30")
	middleware.JSON(w, http.StatusOK, products)
}

func getProductByID(w http.ResponseWriter, _ *http.Request, id string) {
	var p models.Product
	var flashSaleInt int
	var variantsJSON string
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, COALESCE(store_id, 'store-official'), COALESCE(store_name, 'SE-MARKET Official Store'), COALESCE(variants_json, '[]') 
		 FROM products WHERE id = ?`),
		id,
	).Scan(
		&p.ID, &p.Name, &p.Price, &p.OriginalPrice, &p.Category,
		&p.Image, &p.Stock, &p.Rating, &p.Sold, &p.Description,
		&flashSaleInt, &p.CreatedAt, &p.StoreID, &p.StoreName, &variantsJSON,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Product not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to query product: "+err.Error())
		return
	}

	p.IsFlashSale = flashSaleInt == 1
	p.IDAlias = p.ID
	_ = json.Unmarshal([]byte(variantsJSON), &p.Variants)
	if p.Variants == nil {
		p.Variants = []string{}
	}
	w.Header().Set("Cache-Control", "public, max-age=15, stale-while-revalidate=30")
	middleware.JSON(w, http.StatusOK, p)
}

func createProduct(w http.ResponseWriter, r *http.Request) {
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if p.ID == "" {
		p.ID = fmt.Sprintf("P-%d", time.Now().UnixMilli())
	}
	p.IDAlias = p.ID
	p.CreatedAt = time.Now().UTC().Format(time.RFC3339)

	flashSaleInt := 0
	if p.IsFlashSale {
		flashSaleInt = 1
	}

	if p.StoreID == "" {
		p.StoreID = "store-official"
		p.StoreName = "SE-MARKET Official Store"
	}
	if p.Variants == nil {
		p.Variants = []string{}
	}
	vBytes, _ := json.Marshal(p.Variants)

	_, err := database.DB.Exec(
		database.Rebind(`INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, store_id, store_name, variants_json)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
		p.ID, p.Name, p.Price, p.OriginalPrice, p.Category, p.Image, p.Stock, p.Rating, p.Sold, p.Description, flashSaleInt, p.CreatedAt, p.StoreID, p.StoreName, string(vBytes),
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to create product: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusCreated, p)
}

func updateProduct(w http.ResponseWriter, r *http.Request, id string) {
	// First check if product exists
	var existing models.Product
	var flashSaleInt int
	var variantsJSON string
	err := database.DB.QueryRow(
		`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, COALESCE(store_id, 'store-official'), COALESCE(store_name, 'SE-MARKET Official Store'), COALESCE(variants_json, '[]') 
		 FROM products WHERE id = ?`,
		id,
	).Scan(
		&existing.ID, &existing.Name, &existing.Price, &existing.OriginalPrice, &existing.Category,
		&existing.Image, &existing.Stock, &existing.Rating, &existing.Sold, &existing.Description,
		&flashSaleInt, &existing.CreatedAt, &existing.StoreID, &existing.StoreName, &variantsJSON,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Product not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}
	existing.IsFlashSale = flashSaleInt == 1
	_ = json.Unmarshal([]byte(variantsJSON), &existing.Variants)
	if existing.Variants == nil {
		existing.Variants = []string{}
	}

	// Decode updates onto existing
	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if val, ok := updates["name"].(string); ok && val != "" {
		existing.Name = val
	}
	if val, ok := updates["price"].(float64); ok {
		existing.Price = val
	}
	if val, ok := updates["originalPrice"].(float64); ok {
		existing.OriginalPrice = val
	}
	if val, ok := updates["category"].(string); ok && val != "" {
		existing.Category = val
	}
	if val, ok := updates["image"].(string); ok && val != "" {
		existing.Image = val
	}
	if val, ok := updates["stock"].(float64); ok {
		existing.Stock = int(val)
	}
	if val, ok := updates["rating"].(float64); ok {
		existing.Rating = val
	}
	if val, ok := updates["sold"].(float64); ok {
		existing.Sold = int(val)
	}
	if val, ok := updates["description"].(string); ok {
		existing.Description = val
	}
	if val, ok := updates["isFlashSale"].(bool); ok {
		existing.IsFlashSale = val
	}
	if rawV, ok := updates["variants"]; ok {
		if vSlice, ok := rawV.([]any); ok {
			existing.Variants = make([]string, 0, len(vSlice))
			for _, item := range vSlice {
				if s, ok := item.(string); ok && strings.TrimSpace(s) != "" {
					existing.Variants = append(existing.Variants, strings.TrimSpace(s))
				}
			}
		}
	}

	newFlashSale := 0
	if existing.IsFlashSale {
		newFlashSale = 1
	}
	newVBytes, _ := json.Marshal(existing.Variants)

	_, err = database.DB.Exec(
		database.Rebind(`UPDATE products SET name = ?, price = ?, original_price = ?, category = ?, image = ?, stock = ?, rating = ?, sold = ?, description = ?, is_flash_sale = ?, variants_json = ?
		 WHERE id = ?`),
		existing.Name, existing.Price, existing.OriginalPrice, existing.Category, existing.Image, existing.Stock, existing.Rating, existing.Sold, existing.Description, newFlashSale, string(newVBytes), id,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to update product: "+err.Error())
		return
	}

	existing.IDAlias = existing.ID
	middleware.JSON(w, http.StatusOK, existing)
}

func deleteProduct(w http.ResponseWriter, _ *http.Request, id string) {
	result, err := database.DB.Exec(database.Rebind("DELETE FROM products WHERE id = ?"), id)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to delete product: "+err.Error())
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.Error(w, http.StatusNotFound, "Product not found")
		return
	}

	middleware.JSON(w, http.StatusOK, map[string]any{"success": true})
}

func handleProductReviews(w http.ResponseWriter, r *http.Request, productID string, parts []string) {
	if len(parts) == 2 {
		switch r.Method {
		case http.MethodGet:
			getProductReviews(w, r, productID)
		case http.MethodPost:
			createProductReview(w, r, productID)
		default:
			middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	if len(parts) == 3 && r.Method == http.MethodDelete {
		deleteProductReview(w, r, productID, parts[2])
		return
	}

	middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func getProductReviews(w http.ResponseWriter, _ *http.Request, productID string) {
	rows, err := database.DB.Query(
		database.Rebind("SELECT id, product_id, user_id, user_name, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC"),
		productID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query reviews: "+err.Error())
		return
	}
	defer rows.Close()

	reviews := make([]models.Review, 0)
	for rows.Next() {
		var rev models.Review
		if err := rows.Scan(&rev.ID, &rev.ProductID, &rev.UserID, &rev.UserName, &rev.Rating, &rev.Comment, &rev.CreatedAt); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to scan review: "+err.Error())
			return
		}
		rev.IDAlias = rev.ID
		reviews = append(reviews, rev)
	}
	if err := rows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading reviews: "+err.Error())
		return
	}

	w.Header().Set("Cache-Control", "public, max-age=15, stale-while-revalidate=30")
	middleware.JSON(w, http.StatusOK, reviews)
}

func createProductReview(w http.ResponseWriter, r *http.Request, productID string) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		tokenStr := middleware.ExtractToken(r)
		if tokenStr != "" {
			claims, _ = middleware.ValidateToken(tokenStr)
		}
	}
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required to submit review")
		return
	}

	// Verify product exists
	var prodExists int
	err := database.DB.QueryRow(database.Rebind("SELECT COUNT(*) FROM products WHERE id = ?"), productID).Scan(&prodExists)
	if err != nil || prodExists == 0 {
		middleware.Error(w, http.StatusNotFound, "Product not found")
		return
	}

	var req struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Rating < 1 || req.Rating > 5 {
		middleware.Error(w, http.StatusBadRequest, "Rating must be between 1 and 5")
		return
	}

	req.Comment = strings.TrimSpace(req.Comment)
	if req.Comment == "" {
		middleware.Error(w, http.StatusBadRequest, "Review comment cannot be empty")
		return
	}

	// Fetch author name from claims or database
	userName := claims.Email
	_ = database.DB.QueryRow(database.Rebind("SELECT name FROM users WHERE id = ?"), claims.UserID).Scan(&userName)
	if userName == "" {
		userName = claims.Email
	}

	seq := atomic.AddUint64(&reviewCounter, 1)
	newID := fmt.Sprintf("REV-%d-%d", time.Now().UnixNano(), seq)
	createdAt := time.Now().UTC().Format(time.RFC3339)

	_, err = database.DB.Exec(
		database.Rebind("INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"),
		newID, productID, claims.UserID, userName, req.Rating, req.Comment, createdAt,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to save review: "+err.Error())
		return
	}

	// Automatically recalculate product rating
	updateProductAverageRating(productID)

	review := models.Review{
		ID:        newID,
		IDAlias:   newID,
		ProductID: productID,
		UserID:    claims.UserID,
		UserName:  userName,
		Rating:    req.Rating,
		Comment:   req.Comment,
		CreatedAt: createdAt,
	}

	middleware.JSON(w, http.StatusCreated, review)
}

func deleteProductReview(w http.ResponseWriter, r *http.Request, productID string, reviewID string) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		tokenStr := middleware.ExtractToken(r)
		if tokenStr != "" {
			claims, _ = middleware.ValidateToken(tokenStr)
		}
	}
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required to delete review")
		return
	}

	var reviewUserID string
	err := database.DB.QueryRow(
		database.Rebind("SELECT user_id FROM reviews WHERE id = ? AND product_id = ?"),
		reviewID, productID,
	).Scan(&reviewUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Review not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	if !claims.IsAdmin && reviewUserID != claims.UserID {
		middleware.Error(w, http.StatusForbidden, "Forbidden: You cannot delete another user's review")
		return
	}

	result, err := database.DB.Exec(
		database.Rebind("DELETE FROM reviews WHERE id = ? AND product_id = ?"),
		reviewID, productID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to delete review: "+err.Error())
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.Error(w, http.StatusNotFound, "Review not found")
		return
	}

	// Recalculate product rating after deletion
	updateProductAverageRating(productID)

	middleware.JSON(w, http.StatusOK, map[string]any{"success": true})
}

func updateProductAverageRating(productID string) {
	var count int
	var avgRating float64
	err := database.DB.QueryRow(
		database.Rebind("SELECT COUNT(*), COALESCE(AVG(CAST(rating AS NUMERIC)), 5.0) FROM reviews WHERE product_id = ?"),
		productID,
	).Scan(&count, &avgRating)
	if err == nil {
		if count == 0 {
			avgRating = 5.0
		} else {
			avgRating = float64(int(avgRating*10+0.5)) / 10.0
		}
		_, _ = database.DB.Exec(
			database.Rebind("UPDATE products SET rating = ? WHERE id = ?"),
			avgRating, productID,
		)
	}
}

