package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"semarket/backend/database"
	"semarket/backend/handlers"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func TestReviewsHandler_CreateAndAutoUpdateProductRating(t *testing.T) {
	setupTestDB(t)

	// Create test product
	productID := "prod-rev-1"
	_, err := database.DB.Exec(
		database.Rebind("INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"),
		productID, "Test Headphones", 500000, 600000, "Electronics", "https://example.com/img.jpg", 10, 5.0, 0, "High quality", 0, "2026-01-01T00:00:00Z",
	)
	if err != nil {
		t.Fatalf("Failed to create test product: %v", err)
	}

	user1 := models.User{ID: "usr-1", Name: "Alice", Email: "alice@example.com", Role: "Customer", IsAdmin: false}
	tokenUser1, _ := middleware.GenerateToken(user1)

	user2 := models.User{ID: "usr-2", Name: "Bob", Email: "bob@example.com", Role: "Customer", IsAdmin: false}
	tokenUser2, _ := middleware.GenerateToken(user2)

	// 1. User 1 submits 4-star review
	revBody1 := map[string]any{
		"rating":  4,
		"comment": "Good sound quality, comfortable cushions.",
	}
	b1, _ := json.Marshal(revBody1)
	req1 := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader(b1))
	req1.Header.Set("Authorization", "Bearer "+tokenUser1)
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	handlers.ProductsHandler(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for review 1, got %d: %s", w1.Code, w1.Body.String())
	}

	var createdRev1 models.Review
	if err := json.Unmarshal(w1.Body.Bytes(), &createdRev1); err != nil {
		t.Fatalf("Failed to parse review 1 response: %v", err)
	}
	if createdRev1.Rating != 4 || createdRev1.ProductID != productID {
		t.Errorf("Unexpected review 1 data: %+v", createdRev1)
	}

	// Verify product rating is now 4.0
	var rating1 float64
	_ = database.DB.QueryRow(database.Rebind("SELECT rating FROM products WHERE id = ?"), productID).Scan(&rating1)
	if rating1 != 4.0 {
		t.Errorf("Expected product rating 4.0, got %f", rating1)
	}

	// 2. User 2 submits 5-star review
	revBody2 := map[string]any{
		"rating":  5,
		"comment": "Incredible bass and battery life! Highly recommended.",
	}
	b2, _ := json.Marshal(revBody2)
	req2 := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader(b2))
	req2.Header.Set("Authorization", "Bearer "+tokenUser2)
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	handlers.ProductsHandler(w2, req2)

	if w2.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for review 2, got %d: %s", w2.Code, w2.Body.String())
	}

	// Verify product average rating is now (4 + 5) / 2 = 4.5
	var rating2 float64
	_ = database.DB.QueryRow(database.Rebind("SELECT rating FROM products WHERE id = ?"), productID).Scan(&rating2)
	if rating2 != 4.5 {
		t.Errorf("Expected product rating 4.5, got %f", rating2)
	}

	// 3. GET /api/products/{id}/reviews
	reqGet := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/products/%s/reviews", productID), nil)
	wGet := httptest.NewRecorder()
	handlers.ProductsHandler(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for get reviews, got %d: %s", wGet.Code, wGet.Body.String())
	}

	var revList []models.Review
	if err := json.Unmarshal(wGet.Body.Bytes(), &revList); err != nil {
		t.Fatalf("Failed to parse reviews list: %v", err)
	}
	if len(revList) != 2 {
		t.Errorf("Expected 2 reviews in list, got %d", len(revList))
	}
}

func TestReviewsHandler_Validation(t *testing.T) {
	setupTestDB(t)

	productID := "prod-rev-val"
	_, _ = database.DB.Exec(
		database.Rebind("INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"),
		productID, "Test Monitor", 1500000, 2000000, "Electronics", "https://example.com/img.jpg", 5, 5.0, 0, "Gaming monitor", 0, "2026-01-01T00:00:00Z",
	)

	user := models.User{ID: "usr-val", Name: "Tester", Email: "tester@example.com", Role: "Customer", IsAdmin: false}
	tokenUser, _ := middleware.GenerateToken(user)

	// Case 1: Unauthenticated
	reqNoAuth := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader([]byte(`{"rating":5,"comment":"Nice"}`)))
	reqNoAuth.Header.Set("Content-Type", "application/json")
	wNoAuth := httptest.NewRecorder()
	handlers.ProductsHandler(wNoAuth, reqNoAuth)
	if wNoAuth.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for review without token, got %d", wNoAuth.Code)
	}

	// Case 2: Rating out of bounds (< 1)
	reqLow := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader([]byte(`{"rating":0,"comment":"Bad"}`)))
	reqLow.Header.Set("Authorization", "Bearer "+tokenUser)
	reqLow.Header.Set("Content-Type", "application/json")
	wLow := httptest.NewRecorder()
	handlers.ProductsHandler(wLow, reqLow)
	if wLow.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for rating < 1, got %d", wLow.Code)
	}

	// Case 3: Rating out of bounds (> 5)
	reqHigh := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader([]byte(`{"rating":6,"comment":"Great"}`)))
	reqHigh.Header.Set("Authorization", "Bearer "+tokenUser)
	reqHigh.Header.Set("Content-Type", "application/json")
	wHigh := httptest.NewRecorder()
	handlers.ProductsHandler(wHigh, reqHigh)
	if wHigh.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for rating > 5, got %d", wHigh.Code)
	}

	// Case 4: Empty comment
	reqEmpty := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader([]byte(`{"rating":5,"comment":"   "}`)))
	reqEmpty.Header.Set("Authorization", "Bearer "+tokenUser)
	reqEmpty.Header.Set("Content-Type", "application/json")
	wEmpty := httptest.NewRecorder()
	handlers.ProductsHandler(wEmpty, reqEmpty)
	if wEmpty.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty comment, got %d", wEmpty.Code)
	}

	// Case 5: Non-existent product
	reqNonExistent := httptest.NewRequest(http.MethodPost, "/api/products/NON_EXISTENT_PROD/reviews", bytes.NewReader([]byte(`{"rating":5,"comment":"Great"}`)))
	reqNonExistent.Header.Set("Authorization", "Bearer "+tokenUser)
	reqNonExistent.Header.Set("Content-Type", "application/json")
	wNonExistent := httptest.NewRecorder()
	handlers.ProductsHandler(wNonExistent, reqNonExistent)
	if wNonExistent.Code != http.StatusNotFound {
		t.Errorf("Expected 404 Not Found for non-existent product, got %d", wNonExistent.Code)
	}
}

func TestReviewsHandler_DeleteAndPermissions(t *testing.T) {
	setupTestDB(t)

	productID := "prod-rev-del"
	_, _ = database.DB.Exec(
		database.Rebind("INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"),
		productID, "Test Smart Watch", 750000, 1000000, "Electronics", "https://example.com/img.jpg", 8, 5.0, 0, "Fitness tracker", 0, "2026-01-01T00:00:00Z",
	)

	userOwner := models.User{ID: "usr-owner", Name: "Owner", Email: "owner@example.com", Role: "Customer", IsAdmin: false}
	tokenOwner, _ := middleware.GenerateToken(userOwner)

	userAttacker := models.User{ID: "usr-attacker", Name: "Attacker", Email: "attacker@example.com", Role: "Customer", IsAdmin: false}
	tokenAttacker, _ := middleware.GenerateToken(userAttacker)

	admin := models.User{ID: "admin-del", Name: "Admin", Email: "admin@semarket.com", Role: "Admin", IsAdmin: true}
	tokenAdmin, _ := middleware.GenerateToken(admin)

	// 1. Owner posts review with rating 1
	revBody := map[string]any{"rating": 1, "comment": "Broke after 2 days"}
	b, _ := json.Marshal(revBody)
	reqCreate := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/products/%s/reviews", productID), bytes.NewReader(b))
	reqCreate.Header.Set("Authorization", "Bearer "+tokenOwner)
	reqCreate.Header.Set("Content-Type", "application/json")
	wCreate := httptest.NewRecorder()
	handlers.ProductsHandler(wCreate, reqCreate)

	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", wCreate.Code, wCreate.Body.String())
	}
	var createdRev models.Review
	_ = json.Unmarshal(wCreate.Body.Bytes(), &createdRev)

	// Rating should now be 1.0
	var ratingAfterCreate float64
	_ = database.DB.QueryRow(database.Rebind("SELECT rating FROM products WHERE id = ?"), productID).Scan(&ratingAfterCreate)
	if ratingAfterCreate != 1.0 {
		t.Errorf("Expected rating 1.0, got %f", ratingAfterCreate)
	}

	// 2. Attacker attempts to delete Owner's review -> 403 Forbidden
	reqAttacker := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/products/%s/reviews/%s", productID, createdRev.ID), nil)
	reqAttacker.Header.Set("Authorization", "Bearer "+tokenAttacker)
	wAttacker := httptest.NewRecorder()
	handlers.ProductsHandler(wAttacker, reqAttacker)

	if wAttacker.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when deleting someone else's review, got %d", wAttacker.Code)
	}

	// 3. Unauthenticated attempt -> 401 Unauthorized
	reqUnauth := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/products/%s/reviews/%s", productID, createdRev.ID), nil)
	wUnauth := httptest.NewRecorder()
	handlers.ProductsHandler(wUnauth, reqUnauth)

	if wUnauth.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized, got %d", wUnauth.Code)
	}

	// 4. Admin deletes review -> 200 OK
	reqAdmin := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/products/%s/reviews/%s", productID, createdRev.ID), nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wAdmin := httptest.NewRecorder()
	handlers.ProductsHandler(wAdmin, reqAdmin)

	if wAdmin.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for admin deletion, got %d: %s", wAdmin.Code, wAdmin.Body.String())
	}

	// 5. Product rating recalculates (no reviews left -> resets to 5.0)
	var ratingAfterDel float64
	_ = database.DB.QueryRow(database.Rebind("SELECT rating FROM products WHERE id = ?"), productID).Scan(&ratingAfterDel)
	if ratingAfterDel != 5.0 {
		t.Errorf("Expected rating 5.0 after deleting only review, got %f", ratingAfterDel)
	}
}
