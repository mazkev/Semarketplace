package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"semarket/backend/database"
	"semarket/backend/handlers"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func TestWishlistHandler_AuthRequired(t *testing.T) {
	setupTestDB(t)

	// 1. Anonymous GET -> 401
	reqGet := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
	wGet := httptest.NewRecorder()
	handlers.WishlistHandler(wGet, reqGet)
	if wGet.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for anonymous GET /api/wishlist, got %d", wGet.Code)
	}

	// 2. Anonymous POST -> 401
	reqPost := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader([]byte(`{"productId":"1"}`)))
	reqPost.Header.Set("Content-Type", "application/json")
	wPost := httptest.NewRecorder()
	handlers.WishlistHandler(wPost, reqPost)
	if wPost.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for anonymous POST /api/wishlist, got %d", wPost.Code)
	}

	// 3. Anonymous DELETE -> 401
	reqDel := httptest.NewRequest(http.MethodDelete, "/api/wishlist/1", nil)
	wDel := httptest.NewRecorder()
	handlers.WishlistHandler(wDel, reqDel)
	if wDel.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for anonymous DELETE /api/wishlist/1, got %d", wDel.Code)
	}
}

func TestWishlistHandler_AddAndGet(t *testing.T) {
	setupTestDB(t)

	user := models.User{ID: "usr-w-1", Name: "Wishlist User", Email: "wishlist1@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	// 1. Add existing product (ID "1" from seeder)
	body := map[string]string{"productId": "1"}
	b, _ := json.Marshal(body)
	reqAdd := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(b))
	reqAdd.Header.Set("Authorization", "Bearer "+token)
	reqAdd.Header.Set("Content-Type", "application/json")
	wAdd := httptest.NewRecorder()
	handlers.WishlistHandler(wAdd, reqAdd)

	if wAdd.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK when adding to wishlist, got %d: %s", wAdd.Code, wAdd.Body.String())
	}

	// 2. GET wishlist -> must contain 1 product with details
	reqGet := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
	reqGet.Header.Set("Authorization", "Bearer "+token)
	wGet := httptest.NewRecorder()
	handlers.WishlistHandler(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for GET /api/wishlist, got %d: %s", wGet.Code, wGet.Body.String())
	}

	var prods []models.Product
	if err := json.Unmarshal(wGet.Body.Bytes(), &prods); err != nil {
		t.Fatalf("Failed to decode wishlist products: %v", err)
	}
	if len(prods) != 1 || prods[0].ID != "1" {
		t.Errorf("Expected 1 product with ID '1', got %d products", len(prods))
	}

	// 3. Add non-existent product -> 404 Not Found
	bodyNonExist := map[string]string{"productId": "NON_EXISTENT_PROD_999"}
	bNonExist, _ := json.Marshal(bodyNonExist)
	reqNonExist := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(bNonExist))
	reqNonExist.Header.Set("Authorization", "Bearer "+token)
	reqNonExist.Header.Set("Content-Type", "application/json")
	wNonExist := httptest.NewRecorder()
	handlers.WishlistHandler(wNonExist, reqNonExist)

	if wNonExist.Code != http.StatusNotFound {
		t.Errorf("Expected 404 Not Found for invalid product, got %d", wNonExist.Code)
	}

	// 4. Empty product ID -> 400 Bad Request
	reqEmpty := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader([]byte(`{"productId":""}`)))
	reqEmpty.Header.Set("Authorization", "Bearer "+token)
	reqEmpty.Header.Set("Content-Type", "application/json")
	wEmpty := httptest.NewRecorder()
	handlers.WishlistHandler(wEmpty, reqEmpty)

	if wEmpty.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty product ID, got %d", wEmpty.Code)
	}
}

func TestWishlistHandler_DuplicatePrevention(t *testing.T) {
	setupTestDB(t)

	user := models.User{ID: "usr-w-dup", Name: "Dup User", Email: "dup@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	// Add product "2" twice
	for i := 0; i < 2; i++ {
		b, _ := json.Marshal(map[string]string{"productId": "2"})
		req := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(b))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handlers.WishlistHandler(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected 200 OK on iteration %d, got %d: %s", i, w.Code, w.Body.String())
		}
	}

	// Verify only 1 entry in DB
	var count int
	_ = database.DB.QueryRow(
		database.Rebind("SELECT COUNT(*) FROM wishlist WHERE user_id = ? AND product_id = ?"),
		user.ID, "2",
	).Scan(&count)

	if count != 1 {
		t.Errorf("Expected exactly 1 wishlist entry for user, got %d", count)
	}
}

func TestWishlistHandler_UserIsolation(t *testing.T) {
	setupTestDB(t)

	userA := models.User{ID: "usr-a", Name: "User A", Email: "usra@test.com", Role: "Customer", IsAdmin: false}
	userB := models.User{ID: "usr-b", Name: "User B", Email: "usrb@test.com", Role: "Customer", IsAdmin: false}

	tokenA, _ := middleware.GenerateToken(userA)
	tokenB, _ := middleware.GenerateToken(userB)

	// User A adds product 1
	bA, _ := json.Marshal(map[string]string{"productId": "1"})
	reqA := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(bA))
	reqA.Header.Set("Authorization", "Bearer "+tokenA)
	reqA.Header.Set("Content-Type", "application/json")
	wA := httptest.NewRecorder()
	handlers.WishlistHandler(wA, reqA)
	if wA.Code != http.StatusOK {
		t.Fatalf("Failed adding to A's wishlist: %d", wA.Code)
	}

	// User B adds product 3
	bB, _ := json.Marshal(map[string]string{"productId": "3"})
	reqB := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(bB))
	reqB.Header.Set("Authorization", "Bearer "+tokenB)
	reqB.Header.Set("Content-Type", "application/json")
	wB := httptest.NewRecorder()
	handlers.WishlistHandler(wB, reqB)
	if wB.Code != http.StatusOK {
		t.Fatalf("Failed adding to B's wishlist: %d", wB.Code)
	}

	// Verify User A only sees product 1
	reqGetA := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
	reqGetA.Header.Set("Authorization", "Bearer "+tokenA)
	wGetA := httptest.NewRecorder()
	handlers.WishlistHandler(wGetA, reqGetA)

	var prodsA []models.Product
	_ = json.Unmarshal(wGetA.Body.Bytes(), &prodsA)
	if len(prodsA) != 1 || prodsA[0].ID != "1" {
		t.Errorf("User A wishlist isolation violated: %+v", prodsA)
	}

	// Verify User B only sees product 3
	reqGetB := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
	reqGetB.Header.Set("Authorization", "Bearer "+tokenB)
	wGetB := httptest.NewRecorder()
	handlers.WishlistHandler(wGetB, reqGetB)

	var prodsB []models.Product
	_ = json.Unmarshal(wGetB.Body.Bytes(), &prodsB)
	if len(prodsB) != 1 || prodsB[0].ID != "3" {
		t.Errorf("User B wishlist isolation violated: %+v", prodsB)
	}
}

func TestWishlistHandler_Remove(t *testing.T) {
	setupTestDB(t)

	user := models.User{ID: "usr-del-w", Name: "Del User", Email: "delw@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	// Add product 1
	b, _ := json.Marshal(map[string]string{"productId": "1"})
	reqAdd := httptest.NewRequest(http.MethodPost, "/api/wishlist", bytes.NewReader(b))
	reqAdd.Header.Set("Authorization", "Bearer "+token)
	reqAdd.Header.Set("Content-Type", "application/json")
	wAdd := httptest.NewRecorder()
	handlers.WishlistHandler(wAdd, reqAdd)

	// Remove product 1
	reqDel := httptest.NewRequest(http.MethodDelete, "/api/wishlist/1", nil)
	reqDel.Header.Set("Authorization", "Bearer "+token)
	wDel := httptest.NewRecorder()
	handlers.WishlistHandler(wDel, reqDel)

	if wDel.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on wishlist delete, got %d: %s", wDel.Code, wDel.Body.String())
	}

	// GET wishlist -> must be empty
	reqGet := httptest.NewRequest(http.MethodGet, "/api/wishlist", nil)
	reqGet.Header.Set("Authorization", "Bearer "+token)
	wGet := httptest.NewRecorder()
	handlers.WishlistHandler(wGet, reqGet)

	var prods []models.Product
	_ = json.Unmarshal(wGet.Body.Bytes(), &prods)
	if len(prods) != 0 {
		t.Errorf("Expected empty wishlist after removal, got %d items", len(prods))
	}
}
