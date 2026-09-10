package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	// Path routing: /api/products or /api/products/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/products")
	path = strings.TrimPrefix(path, "/")
	id := path

	if id != "" {
		handleSingleProduct(w, r, id)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getAllProducts(w, r)
	case http.MethodPost:
		middleware.RequireAdmin(createProduct)(w, r)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
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
			`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at 
			 FROM products WHERE category = ? ORDER BY id DESC`,
		)
		rows, err = database.DB.Query(query, category)
	} else {
		rows, err = database.DB.Query(
			`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at 
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
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Price, &p.OriginalPrice, &p.Category,
			&p.Image, &p.Stock, &p.Rating, &p.Sold, &p.Description,
			&flashSaleInt, &p.CreatedAt,
		); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to scan product: "+err.Error())
			return
		}
		p.IsFlashSale = flashSaleInt == 1
		p.IDAlias = p.ID
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
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at 
		 FROM products WHERE id = ?`),
		id,
	).Scan(
		&p.ID, &p.Name, &p.Price, &p.OriginalPrice, &p.Category,
		&p.Image, &p.Stock, &p.Rating, &p.Sold, &p.Description,
		&flashSaleInt, &p.CreatedAt,
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

	_, err := database.DB.Exec(
		database.Rebind(`INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
		p.ID, p.Name, p.Price, p.OriginalPrice, p.Category, p.Image, p.Stock, p.Rating, p.Sold, p.Description, flashSaleInt, p.CreatedAt,
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
	err := database.DB.QueryRow(
		`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at 
		 FROM products WHERE id = ?`,
		id,
	).Scan(
		&existing.ID, &existing.Name, &existing.Price, &existing.OriginalPrice, &existing.Category,
		&existing.Image, &existing.Stock, &existing.Rating, &existing.Sold, &existing.Description,
		&flashSaleInt, &existing.CreatedAt,
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

	newFlashSale := 0
	if existing.IsFlashSale {
		newFlashSale = 1
	}

	_, err = database.DB.Exec(
		database.Rebind(`UPDATE products SET name = ?, price = ?, original_price = ?, category = ?, image = ?, stock = ?, rating = ?, sold = ?, description = ?, is_flash_sale = ?
		 WHERE id = ?`),
		existing.Name, existing.Price, existing.OriginalPrice, existing.Category, existing.Image, existing.Stock, existing.Rating, existing.Sold, existing.Description, newFlashSale, id,
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
