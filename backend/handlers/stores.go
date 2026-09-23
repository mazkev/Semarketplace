package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

var slugRegex = regexp.MustCompile(`[^a-z0-9]+`)

func generateSlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = slugRegex.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = fmt.Sprintf("store-%d", time.Now().Unix())
	}
	return slug
}

// StoresHandler manages /api/stores, /api/stores/my-store, /api/stores/{idOrSlug}, /api/stores/{idOrSlug}/products
func StoresHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/stores")
	path = strings.Trim(path, "/")

	if path == "my-store" {
		switch r.Method {
		case http.MethodGet:
			getMyStore(w, r)
		case http.MethodPut:
			updateMyStore(w, r)
		default:
			middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	if path == "" {
		switch r.Method {
		case http.MethodPost:
			createStore(w, r)
		case http.MethodGet:
			getAllStores(w, r)
		default:
			middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		}
		return
	}

	// Path with idOrSlug or idOrSlug/products
	parts := strings.Split(path, "/")
	idOrSlug := parts[0]

	if len(parts) >= 2 && parts[1] == "products" {
		if r.Method == http.MethodGet {
			getStoreProducts(w, r, idOrSlug)
			return
		}
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if r.Method == http.MethodGet {
		getStorePublic(w, r, idOrSlug)
		return
	}

	middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func getMyStore(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var s models.Store
	var verifiedInt int
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, user_id, name, slug, description, city, logo, banner, is_verified, created_at 
		 FROM stores WHERE user_id = ?`),
		claims.UserID,
	).Scan(
		&s.ID, &s.UserID, &s.Name, &s.Slug, &s.Description, &s.City, &s.Logo, &s.Banner, &verifiedInt, &s.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Store not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to query store: "+err.Error())
		return
	}

	s.IsVerified = verifiedInt == 1
	s.IDAlias = s.ID
	middleware.JSON(w, http.StatusOK, s)
}

func createStore(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required to open a store")
		return
	}

	// 1 account = 1 store check
	var existingCount int
	err := database.DB.QueryRow(database.Rebind("SELECT COUNT(*) FROM stores WHERE user_id = ?"), claims.UserID).Scan(&existingCount)
	if err == nil && existingCount > 0 {
		middleware.Error(w, http.StatusConflict, "Anda sudah memiliki toko terdaftar")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		City        string `json:"city"`
		Logo        string `json:"logo"`
		Banner      string `json:"banner"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	name := strings.TrimSpace(req.Name)
	if len(name) < 3 || len(name) > 60 {
		middleware.Error(w, http.StatusBadRequest, "Nama toko harus antara 3 hingga 60 karakter")
		return
	}

	city := strings.TrimSpace(req.City)
	if city == "" {
		city = "Indonesia"
	}

	desc := strings.TrimSpace(req.Description)
	if desc == "" {
		desc = "Selamat datang di " + name + "! Kami menyediakan produk berkualitas."
	}

	logo := strings.TrimSpace(req.Logo)
	if logo == "" {
		logo = "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=150&auto=format&fit=crop&q=80"
	}

	banner := strings.TrimSpace(req.Banner)
	if banner == "" {
		banner = "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=1200&auto=format&fit=crop&q=80"
	}

	baseSlug := generateSlug(name)
	slug := baseSlug

	// Ensure unique slug
	var slugCount int
	_ = database.DB.QueryRow(database.Rebind("SELECT COUNT(*) FROM stores WHERE slug = ?"), slug).Scan(&slugCount)
	if slugCount > 0 {
		slug = fmt.Sprintf("%s-%d", baseSlug, time.Now().Unix()%10000)
	}

	storeID := fmt.Sprintf("store-%d-%s", time.Now().UnixMilli(), randomHex(4))
	now := time.Now().UTC().Format(time.RFC3339)

	_, err = database.DB.Exec(
		database.Rebind(`INSERT INTO stores (id, user_id, name, slug, description, city, logo, banner, is_verified, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
		storeID, claims.UserID, name, slug, desc, city, logo, banner, 1, now,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal membuat toko: "+err.Error())
		return
	}

	store := models.Store{
		ID:          storeID,
		IDAlias:     storeID,
		UserID:      claims.UserID,
		Name:        name,
		Slug:        slug,
		Description: desc,
		City:        city,
		Logo:        logo,
		Banner:      banner,
		IsVerified:  true,
		CreatedAt:   now,
	}

	middleware.JSON(w, http.StatusCreated, store)
}

func updateMyStore(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Fetch current store
	var s models.Store
	var verifiedInt int
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, user_id, name, slug, description, city, logo, banner, is_verified, created_at 
		 FROM stores WHERE user_id = ?`),
		claims.UserID,
	).Scan(
		&s.ID, &s.UserID, &s.Name, &s.Slug, &s.Description, &s.City, &s.Logo, &s.Banner, &verifiedInt, &s.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Store not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	if val, ok := updates["name"].(string); ok && strings.TrimSpace(val) != "" {
		s.Name = strings.TrimSpace(val)
	}
	if val, ok := updates["description"].(string); ok {
		s.Description = strings.TrimSpace(val)
	}
	if val, ok := updates["city"].(string); ok && strings.TrimSpace(val) != "" {
		s.City = strings.TrimSpace(val)
	}
	if val, ok := updates["logo"].(string); ok && strings.TrimSpace(val) != "" {
		s.Logo = strings.TrimSpace(val)
	}
	if val, ok := updates["banner"].(string); ok && strings.TrimSpace(val) != "" {
		s.Banner = strings.TrimSpace(val)
	}

	_, err = database.DB.Exec(
		database.Rebind(`UPDATE stores SET name = ?, description = ?, city = ?, logo = ?, banner = ? WHERE id = ?`),
		s.Name, s.Description, s.City, s.Logo, s.Banner, s.ID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal memperbarui toko: "+err.Error())
		return
	}

	// Also update store_name in products for denormalization
	_, _ = database.DB.Exec(database.Rebind("UPDATE products SET store_name = ? WHERE store_id = ?"), s.Name, s.ID)

	s.IsVerified = verifiedInt == 1
	s.IDAlias = s.ID
	middleware.JSON(w, http.StatusOK, s)
}

func getAllStores(w http.ResponseWriter, _ *http.Request) {
	rows, err := database.DB.Query(database.Rebind("SELECT id, user_id, name, slug, description, city, logo, banner, is_verified, created_at FROM stores ORDER BY created_at DESC"))
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal mengambil daftar toko: "+err.Error())
		return
	}
	defer rows.Close()

	stores := make([]models.Store, 0)
	for rows.Next() {
		var s models.Store
		var verifiedInt int
		if err := rows.Scan(&s.ID, &s.UserID, &s.Name, &s.Slug, &s.Description, &s.City, &s.Logo, &s.Banner, &verifiedInt, &s.CreatedAt); err != nil {
			continue
		}
		s.IsVerified = verifiedInt == 1
		s.IDAlias = s.ID
		stores = append(stores, s)
	}

	w.Header().Set("Cache-Control", "public, max-age=15, stale-while-revalidate=30")
	middleware.JSON(w, http.StatusOK, stores)
}

func getStorePublic(w http.ResponseWriter, _ *http.Request, idOrSlug string) {
	var s models.Store
	var verifiedInt int
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, user_id, name, slug, description, city, logo, banner, is_verified, created_at 
		 FROM stores WHERE id = ? OR slug = ?`),
		idOrSlug, idOrSlug,
	).Scan(
		&s.ID, &s.UserID, &s.Name, &s.Slug, &s.Description, &s.City, &s.Logo, &s.Banner, &verifiedInt, &s.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Store not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to query store: "+err.Error())
		return
	}

	s.IsVerified = verifiedInt == 1
	s.IDAlias = s.ID

	w.Header().Set("Cache-Control", "public, max-age=15, stale-while-revalidate=30")
	middleware.JSON(w, http.StatusOK, s)
}

func getStoreProducts(w http.ResponseWriter, _ *http.Request, idOrSlug string) {
	// First resolve store ID
	var storeID string
	err := database.DB.QueryRow(
		database.Rebind("SELECT id FROM stores WHERE id = ? OR slug = ?"),
		idOrSlug, idOrSlug,
	).Scan(&storeID)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Store not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to resolve store: "+err.Error())
		return
	}

	rows, err := database.DB.Query(
		database.Rebind(`SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at, COALESCE(store_id, ''), COALESCE(store_name, '') 
		 FROM products WHERE store_id = ? ORDER BY id DESC`),
		storeID,
	)
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
			&flashSaleInt, &p.CreatedAt, &p.StoreID, &p.StoreName,
		); err != nil {
			continue
		}
		p.IsFlashSale = flashSaleInt == 1
		p.IDAlias = p.ID
		products = append(products, p)
	}

	w.Header().Set("Cache-Control", "public, max-age=15, stale-while-revalidate=30")
	middleware.JSON(w, http.StatusOK, products)
}
