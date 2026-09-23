package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"semarket/backend/handlers"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func TestProductsHandler_GetAllAndFilter(t *testing.T) {
	setupTestDB(t)

	// 1. Get all products without filter
	reqAll := httptest.NewRequest(http.MethodGet, "/api/products", nil)
	wAll := httptest.NewRecorder()
	handlers.ProductsHandler(wAll, reqAll)

	if wAll.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for all products, got %d: %s", wAll.Code, wAll.Body.String())
	}

	var allProducts []models.Product
	if err := json.Unmarshal(wAll.Body.Bytes(), &allProducts); err != nil {
		t.Fatalf("Failed to decode products: %v", err)
	}
	if len(allProducts) == 0 {
		t.Errorf("Expected seeded products, got 0")
	}

	// 2. Filter by category
	reqFilter := httptest.NewRequest(http.MethodGet, "/api/products?category=Electronics", nil)
	wFilter := httptest.NewRecorder()
	handlers.ProductsHandler(wFilter, reqFilter)

	if wFilter.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for filtered products, got %d", wFilter.Code)
	}

	var filtered []models.Product
	_ = json.Unmarshal(wFilter.Body.Bytes(), &filtered)
	for _, p := range filtered {
		if p.Category != "Electronics" {
			t.Errorf("Expected category 'Electronics', got '%s'", p.Category)
		}
	}
}

func TestProductsHandler_GetByID(t *testing.T) {
	setupTestDB(t)

	// 1. Existing product
	reqExisting := httptest.NewRequest(http.MethodGet, "/api/products/1", nil)
	wExisting := httptest.NewRecorder()
	handlers.ProductsHandler(wExisting, reqExisting)

	if wExisting.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for product 1, got %d: %s", wExisting.Code, wExisting.Body.String())
	}

	var prod models.Product
	_ = json.Unmarshal(wExisting.Body.Bytes(), &prod)
	if prod.ID != "1" {
		t.Errorf("Expected product ID '1', got '%s'", prod.ID)
	}

	// 2. Non-existent product -> 404
	reqNonExistent := httptest.NewRequest(http.MethodGet, "/api/products/NON_EXISTENT_PROD_999", nil)
	wNonExistent := httptest.NewRecorder()
	handlers.ProductsHandler(wNonExistent, reqNonExistent)

	if wNonExistent.Code != http.StatusNotFound {
		t.Errorf("Expected 404 Not Found, got %d", wNonExistent.Code)
	}
}

func TestProductsHandler_AdminCRUD(t *testing.T) {
	setupTestDB(t)

	cust := models.User{ID: "cust-p", Name: "Customer", Email: "custp@test.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "admin-p", Name: "Admin", Email: "adminp@test.com", Role: "Admin", IsAdmin: true}

	tokenCust, _ := middleware.GenerateToken(cust)
	tokenAdmin, _ := middleware.GenerateToken(admin)

	newProd := models.Product{
		Name:          "Mechanical Keyboard RGB",
		Price:         850000,
		OriginalPrice: 1200000,
		Category:      "Electronics",
		Image:         "https://example.com/keyboard.jpg",
		Stock:         20,
		Rating:        4.8,
		Sold:          0,
		Description:   "Hot-swappable mechanical keyboard",
		IsFlashSale:   true,
	}
	prodBytes, _ := json.Marshal(newProd)

	// 1. Customer attempts to create product -> 403 Forbidden
	reqCust := httptest.NewRequest(http.MethodPost, "/api/products", bytes.NewReader(prodBytes))
	reqCust.Header.Set("Authorization", "Bearer "+tokenCust)
	reqCust.Header.Set("Content-Type", "application/json")
	wCust := httptest.NewRecorder()
	handlers.ProductsHandler(wCust, reqCust)

	if wCust.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for non-admin product creation, got %d", wCust.Code)
	}

	// 2. Admin creates product -> 201 Created
	reqAdmin := httptest.NewRequest(http.MethodPost, "/api/products", bytes.NewReader(prodBytes))
	reqAdmin.Header.Set("Authorization", "Bearer "+tokenAdmin)
	reqAdmin.Header.Set("Content-Type", "application/json")
	wAdmin := httptest.NewRecorder()
	handlers.ProductsHandler(wAdmin, reqAdmin)

	if wAdmin.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for admin product creation, got %d: %s", wAdmin.Code, wAdmin.Body.String())
	}

	var created models.Product
	_ = json.Unmarshal(wAdmin.Body.Bytes(), &created)
	if created.ID == "" || created.Name != "Mechanical Keyboard RGB" {
		t.Errorf("Unexpected created product: %+v", created)
	}

	// 3. Admin updates product -> 200 OK
	updateBody, _ := json.Marshal(map[string]any{
		"price": 799000,
		"stock": 50,
	})
	reqUpdate := httptest.NewRequest(http.MethodPut, "/api/products/"+created.ID, bytes.NewReader(updateBody))
	reqUpdate.Header.Set("Authorization", "Bearer "+tokenAdmin)
	reqUpdate.Header.Set("Content-Type", "application/json")
	wUpdate := httptest.NewRecorder()
	handlers.ProductsHandler(wUpdate, reqUpdate)

	if wUpdate.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for product update, got %d: %s", wUpdate.Code, wUpdate.Body.String())
	}

	var updated models.Product
	_ = json.Unmarshal(wUpdate.Body.Bytes(), &updated)
	if updated.Price != 799000 || updated.Stock != 50 {
		t.Errorf("Expected updated price 799000 and stock 50, got price %.0f and stock %d", updated.Price, updated.Stock)
	}

	// 4. Admin deletes product -> 200 OK
	reqDelete := httptest.NewRequest(http.MethodDelete, "/api/products/"+created.ID, nil)
	reqDelete.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wDelete := httptest.NewRecorder()
	handlers.ProductsHandler(wDelete, reqDelete)

	if wDelete.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for product deletion, got %d: %s", wDelete.Code, wDelete.Body.String())
	}
}
