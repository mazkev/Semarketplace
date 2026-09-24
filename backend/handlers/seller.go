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

// SellerHandler manages seller-specific operations: /api/seller/products and /api/seller/orders
func SellerHandler(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required to access Seller Center")
		return
	}

	// Verify that the user owns a store
	var store models.Store
	err := database.DB.QueryRow(
		database.Rebind("SELECT id, name FROM stores WHERE user_id = ?"),
		claims.UserID,
	).Scan(&store.ID, &store.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusForbidden, "Anda belum membuka toko. Silakan buka toko terlebih dahulu.")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/seller")
	path = strings.Trim(path, "/")

	if strings.HasPrefix(path, "products") {
		subPath := strings.TrimPrefix(path, "products")
		subPath = strings.Trim(subPath, "/")

		if subPath == "" {
			switch r.Method {
			case http.MethodGet:
				getSellerProducts(w, r, store)
			case http.MethodPost:
				createSellerProduct(w, r, store)
			default:
				middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
			}
			return
		}

		// subPath is product ID
		productID := subPath
		switch r.Method {
		case http.MethodPut:
			updateSellerProduct(w, r, store, productID)
		case http.MethodDelete:
			deleteSellerProduct(w, r, store, productID)
		default:
			middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	if path == "orders" {
		if r.Method == http.MethodGet {
			getSellerOrders(w, r, store)
			return
		}
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	middleware.Error(w, http.StatusNotFound, "Endpoint not found")
}

func getSellerProducts(w http.ResponseWriter, _ *http.Request, store models.Store) {
	rows, err := database.DB.Query(
		database.Rebind(`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, store_id, store_name, COALESCE(variants_json, '[]') 
		 FROM products WHERE store_id = ? ORDER BY id DESC`),
		store.ID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal mengambil produk toko: "+err.Error())
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
			continue
		}
		p.IsFlashSale = flashSaleInt == 1
		p.IDAlias = p.ID
		_ = json.Unmarshal([]byte(variantsJSON), &p.Variants)
		if p.Variants == nil {
			p.Variants = []string{}
		}
		products = append(products, p)
	}

	middleware.JSON(w, http.StatusOK, products)
}

func createSellerProduct(w http.ResponseWriter, r *http.Request, store models.Store) {
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	p.Name = strings.TrimSpace(p.Name)
	if p.Name == "" {
		middleware.Error(w, http.StatusBadRequest, "Nama produk tidak boleh kosong")
		return
	}
	if p.Price <= 0 {
		middleware.Error(w, http.StatusBadRequest, "Harga produk harus lebih besar dari 0")
		return
	}
	if p.Category == "" {
		p.Category = "General"
	}
	if p.Image == "" {
		p.Image = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"
	}

	p.ID = fmt.Sprintf("P-%d-%s", time.Now().UnixMilli(), randomHex(4))
	p.IDAlias = p.ID
	p.StoreID = store.ID
	p.StoreName = store.Name
	p.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	p.Rating = 5.0
	p.Sold = 0

	flashSaleInt := 0
	if p.IsFlashSale {
		flashSaleInt = 1
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
		middleware.Error(w, http.StatusInternalServerError, "Gagal membuat produk toko: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusCreated, p)
}

func updateSellerProduct(w http.ResponseWriter, r *http.Request, store models.Store, productID string) {
	// Anti-IDOR check: Verify product belongs to this store
	var existing models.Product
	var flashSaleInt int
	var variantsJSON string
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, store_id, store_name, COALESCE(variants_json, '[]') 
		 FROM products WHERE id = ?`),
		productID,
	).Scan(
		&existing.ID, &existing.Name, &existing.Price, &existing.OriginalPrice, &existing.Category,
		&existing.Image, &existing.Stock, &existing.Rating, &existing.Sold, &existing.Description,
		&flashSaleInt, &existing.CreatedAt, &existing.StoreID, &existing.StoreName, &variantsJSON,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Produk tidak ditemukan")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	if existing.StoreID != store.ID {
		middleware.Error(w, http.StatusForbidden, "Akses ditolak: Anda tidak memiliki izin untuk mengedit produk milik toko lain")
		return
	}

	existing.IsFlashSale = flashSaleInt == 1
	_ = json.Unmarshal([]byte(variantsJSON), &existing.Variants)
	if existing.Variants == nil {
		existing.Variants = []string{}
	}

	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if val, ok := updates["name"].(string); ok && strings.TrimSpace(val) != "" {
		existing.Name = strings.TrimSpace(val)
	}
	if val, ok := updates["price"].(float64); ok && val > 0 {
		existing.Price = val
	}
	if val, ok := updates["originalPrice"].(float64); ok {
		existing.OriginalPrice = val
	}
	if val, ok := updates["category"].(string); ok && strings.TrimSpace(val) != "" {
		existing.Category = strings.TrimSpace(val)
	}
	if val, ok := updates["image"].(string); ok && strings.TrimSpace(val) != "" {
		existing.Image = strings.TrimSpace(val)
	}
	if val, ok := updates["stock"].(float64); ok {
		existing.Stock = int(val)
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
		database.Rebind(`UPDATE products SET name = ?, price = ?, original_price = ?, category = ?, image = ?, stock = ?, description = ?, is_flash_sale = ?, variants_json = ?
		 WHERE id = ? AND store_id = ?`),
		existing.Name, existing.Price, existing.OriginalPrice, existing.Category, existing.Image, existing.Stock, existing.Description, newFlashSale, string(newVBytes), productID, store.ID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal memperbarui produk toko: "+err.Error())
		return
	}

	existing.IDAlias = existing.ID
	middleware.JSON(w, http.StatusOK, existing)
}

func deleteSellerProduct(w http.ResponseWriter, _ *http.Request, store models.Store, productID string) {
	// Anti-IDOR check
	var storeID string
	err := database.DB.QueryRow(database.Rebind("SELECT store_id FROM products WHERE id = ?"), productID).Scan(&storeID)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Produk tidak ditemukan")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	if storeID != store.ID {
		middleware.Error(w, http.StatusForbidden, "Akses ditolak: Anda tidak memiliki izin untuk menghapus produk milik toko lain")
		return
	}

	_, err = database.DB.Exec(database.Rebind("DELETE FROM products WHERE id = ? AND store_id = ?"), productID, store.ID)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal menghapus produk: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusOK, map[string]string{"message": "Produk berhasil dihapus"})
}

func getSellerOrders(w http.ResponseWriter, _ *http.Request, store models.Store) {
	// Query all orders and filter ones containing items with store_id == store.ID
	// In SQLite / Postgres, items are in items_json
	rows, err := database.DB.Query(database.Rebind("SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp, COALESCE(shipping_courier, ''), COALESCE(shipping_address, '') FROM orders ORDER BY timestamp DESC"))
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query orders: "+err.Error())
		return
	}
	defer rows.Close()

	type SellerOrder struct {
		ID              string             `json:"_id"`
		CustomerID      string             `json:"customerId"`
		CustomerName    string             `json:"customerName"`
		CustomerEmail   string             `json:"customerEmail"`
		Items           []models.OrderItem `json:"items"`
		StoreTotal      float64            `json:"storeTotal"`
		ShippingCourier string             `json:"shippingCourier,omitempty"`
		ShippingAddress string             `json:"shippingAddress,omitempty"`
		Status          string             `json:"status"`
		Timestamp       string             `json:"timestamp"`
	}

	sellerOrders := make([]SellerOrder, 0)

	for rows.Next() {
		var o models.Order
		var itemsJSON string
		if err := rows.Scan(&o.ID, &o.CustomerID, &o.CustomerName, &o.CustomerEmail, &itemsJSON, &o.Total, &o.Status, &o.Timestamp, &o.ShippingCourier, &o.ShippingAddress); err != nil {
			continue
		}
		var allItems []models.OrderItem
		_ = json.Unmarshal([]byte(itemsJSON), &allItems)

		var matchedItems []models.OrderItem
		var storeTotal float64
		for _, it := range allItems {
			// If item has storeId equal to seller's store OR if seller is official store and storeId is empty
			if it.StoreID == store.ID || (store.ID == "store-official" && (it.StoreID == "" || it.StoreID == "store-official")) {
				matchedItems = append(matchedItems, it)
				storeTotal += it.Price * float64(it.Qty)
			}
		}

		if len(matchedItems) > 0 {
			sellerOrders = append(sellerOrders, SellerOrder{
				ID:              o.ID,
				CustomerID:      o.CustomerID,
				CustomerName:    o.CustomerName,
				CustomerEmail:   o.CustomerEmail,
				Items:           matchedItems,
				StoreTotal:      storeTotal,
				ShippingCourier: o.ShippingCourier,
				ShippingAddress: o.ShippingAddress,
				Status:          o.Status,
				Timestamp:       o.Timestamp,
			})
		}
	}

	middleware.JSON(w, http.StatusOK, sellerOrders)
}
