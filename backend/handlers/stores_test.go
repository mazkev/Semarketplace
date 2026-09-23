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

func TestStores_CreateAndSingleStorePerUser(t *testing.T) {
	setupTestDB(t)

	sellerUser := models.User{
		ID:      "seller-001",
		Name:    "Budi Santoso",
		Email:   "budi@example.com",
		Role:    "Customer",
		IsAdmin: false,
	}
	sellerToken, _ := middleware.GenerateToken(sellerUser)

	// 1. Create a store for sellerUser
	bodyCreate := map[string]any{
		"name":        "Budi Electro Store",
		"description": "Toko spesialis barang elektronik terlengkap di Bandung",
		"city":        "Bandung",
	}
	b, _ := json.Marshal(bodyCreate)
	req := httptest.NewRequest(http.MethodPost, "/api/stores", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+sellerToken)
	w := httptest.NewRecorder()

	handlers.StoresHandler(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	var createdStore models.Store
	if err := json.Unmarshal(w.Body.Bytes(), &createdStore); err != nil {
		t.Fatalf("Failed to parse store response: %v", err)
	}

	if createdStore.Name != "Budi Electro Store" {
		t.Errorf("Expected store name 'Budi Electro Store', got '%s'", createdStore.Name)
	}
	if createdStore.Slug != "budi-electro-store" {
		t.Errorf("Expected slug 'budi-electro-store', got '%s'", createdStore.Slug)
	}
	if createdStore.City != "Bandung" {
		t.Errorf("Expected city 'Bandung', got '%s'", createdStore.City)
	}

	// 2. Try to create second store for same user -> Must return 409 Conflict
	req2 := httptest.NewRequest(http.MethodPost, "/api/stores", bytes.NewReader(b))
	req2.Header.Set("Authorization", "Bearer "+sellerToken)
	w2 := httptest.NewRecorder()

	handlers.StoresHandler(w2, req2)
	if w2.Code != http.StatusConflict {
		t.Errorf("Expected 409 Conflict for duplicate store creation, got %d: %s", w2.Code, w2.Body.String())
	}

	// 3. Test GET /api/stores/my-store
	reqMy := httptest.NewRequest(http.MethodGet, "/api/stores/my-store", nil)
	reqMy.Header.Set("Authorization", "Bearer "+sellerToken)
	wMy := httptest.NewRecorder()

	handlers.StoresHandler(wMy, reqMy)
	if wMy.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for my-store, got %d: %s", wMy.Code, wMy.Body.String())
	}

	// 4. Test GET /api/stores/{slug} (Public)
	reqPublic := httptest.NewRequest(http.MethodGet, "/api/stores/budi-electro-store", nil)
	wPublic := httptest.NewRecorder()

	handlers.StoresHandler(wPublic, reqPublic)
	if wPublic.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for public store view, got %d: %s", wPublic.Code, wPublic.Body.String())
	}
}

func TestSeller_ProductCRUDAndAntiIDOR(t *testing.T) {
	setupTestDB(t)

	// Seller 1
	seller1 := models.User{ID: "seller-10", Name: "Seller One", Email: "s1@test.com", Role: "Customer"}
	token1, _ := middleware.GenerateToken(seller1)

	// Seller 2 (Attacker)
	seller2 := models.User{ID: "seller-20", Name: "Seller Two", Email: "s2@test.com", Role: "Customer"}
	token2, _ := middleware.GenerateToken(seller2)

	// Create stores for both
	b1, _ := json.Marshal(map[string]string{"name": "Store Satu", "city": "Jakarta"})
	reqS1 := httptest.NewRequest(http.MethodPost, "/api/stores", bytes.NewReader(b1))
	reqS1.Header.Set("Authorization", "Bearer "+token1)
	wS1 := httptest.NewRecorder()
	handlers.StoresHandler(wS1, reqS1)
	if wS1.Code != http.StatusCreated {
		t.Fatalf("Failed to create store 1: %s", wS1.Body.String())
	}

	b2, _ := json.Marshal(map[string]string{"name": "Store Dua", "city": "Surabaya"})
	reqS2 := httptest.NewRequest(http.MethodPost, "/api/stores", bytes.NewReader(b2))
	reqS2.Header.Set("Authorization", "Bearer "+token2)
	wS2 := httptest.NewRecorder()
	handlers.StoresHandler(wS2, reqS2)
	if wS2.Code != http.StatusCreated {
		t.Fatalf("Failed to create store 2: %s", wS2.Body.String())
	}

	// 1. Seller 1 creates product via /api/seller/products
	newProd := map[string]any{
		"name":        "Wireless Gaming Mouse",
		"price":       250000.0,
		"stock":       20,
		"category":    "Electronics",
		"description": "Ergonomic gaming mouse",
	}
	bProd, _ := json.Marshal(newProd)
	reqProd := httptest.NewRequest(http.MethodPost, "/api/seller/products", bytes.NewReader(bProd))
	reqProd.Header.Set("Authorization", "Bearer "+token1)
	wProd := httptest.NewRecorder()

	handlers.SellerHandler(wProd, reqProd)
	if wProd.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for seller product, got %d: %s", wProd.Code, wProd.Body.String())
	}

	var createdProduct models.Product
	_ = json.Unmarshal(wProd.Body.Bytes(), &createdProduct)
	if createdProduct.Name != "Wireless Gaming Mouse" {
		t.Errorf("Unexpected product name: %s", createdProduct.Name)
	}

	// 2. Seller 1 lists own products
	reqList := httptest.NewRequest(http.MethodGet, "/api/seller/products", nil)
	reqList.Header.Set("Authorization", "Bearer "+token1)
	wList := httptest.NewRecorder()

	handlers.SellerHandler(wList, reqList)
	if wList.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for seller products list, got %d: %s", wList.Code, wList.Body.String())
	}

	var pList []models.Product
	_ = json.Unmarshal(wList.Body.Bytes(), &pList)
	if len(pList) != 1 {
		t.Errorf("Expected 1 product for seller 1, got %d", len(pList))
	}

	// 3. Attacker (Seller 2) tries to update Seller 1's product -> Rejected with 403
	updateBody, _ := json.Marshal(map[string]any{"price": 1000.0})
	reqHack := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/seller/products/%s", createdProduct.ID), bytes.NewReader(updateBody))
	reqHack.Header.Set("Authorization", "Bearer "+token2)
	wHack := httptest.NewRecorder()

	handlers.SellerHandler(wHack, reqHack)
	if wHack.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for cross-store product edit, got %d: %s", wHack.Code, wHack.Body.String())
	}

	// 4. Attacker (Seller 2) tries to delete Seller 1's product -> Rejected with 403
	reqDelHack := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/seller/products/%s", createdProduct.ID), nil)
	reqDelHack.Header.Set("Authorization", "Bearer "+token2)
	wDelHack := httptest.NewRecorder()

	handlers.SellerHandler(wDelHack, reqDelHack)
	if wDelHack.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for cross-store product delete, got %d: %s", wDelHack.Code, wDelHack.Body.String())
	}

	// 5. Seller 1 successfully updates own product
	validUpdate, _ := json.Marshal(map[string]any{"price": 275000.0})
	reqValidUpdate := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/seller/products/%s", createdProduct.ID), bytes.NewReader(validUpdate))
	reqValidUpdate.Header.Set("Authorization", "Bearer "+token1)
	wValidUpdate := httptest.NewRecorder()

	handlers.SellerHandler(wValidUpdate, reqValidUpdate)
	if wValidUpdate.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for valid product update, got %d: %s", wValidUpdate.Code, wValidUpdate.Body.String())
	}

	// 6. Seller 1 successfully deletes own product
	reqDel := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/seller/products/%s", createdProduct.ID), nil)
	reqDel.Header.Set("Authorization", "Bearer "+token1)
	wDel := httptest.NewRecorder()

	handlers.SellerHandler(wDel, reqDel)
	if wDel.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for seller product deletion, got %d: %s", wDel.Code, wDel.Body.String())
	}
}

func TestSeller_OrdersAndStoreCatalog(t *testing.T) {
	setupTestDB(t)

	seller := models.User{ID: "seller-30", Name: "Seller Three", Email: "s3@test.com", Role: "Customer"}
	sellerToken, _ := middleware.GenerateToken(seller)

	// Create store
	bStore, _ := json.Marshal(map[string]string{"name": "Store Tiga", "city": "Medan"})
	reqStore := httptest.NewRequest(http.MethodPost, "/api/stores", bytes.NewReader(bStore))
	reqStore.Header.Set("Authorization", "Bearer "+sellerToken)
	wStore := httptest.NewRecorder()
	handlers.StoresHandler(wStore, reqStore)
	var store models.Store
	_ = json.Unmarshal(wStore.Body.Bytes(), &store)

	// Create product in this store
	bProd, _ := json.Marshal(map[string]any{
		"name":     "Kemeja Batik Premium",
		"price":    300000.0,
		"stock":    15,
		"category": "Fashion",
	})
	reqProd := httptest.NewRequest(http.MethodPost, "/api/seller/products", bytes.NewReader(bProd))
	reqProd.Header.Set("Authorization", "Bearer "+sellerToken)
	wProd := httptest.NewRecorder()
	handlers.SellerHandler(wProd, reqProd)
	var prod models.Product
	_ = json.Unmarshal(wProd.Body.Bytes(), &prod)

	// Check public store products: GET /api/stores/{slug}/products
	reqStoreProds := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/stores/%s/products", store.Slug), nil)
	wStoreProds := httptest.NewRecorder()
	handlers.StoresHandler(wStoreProds, reqStoreProds)
	if wStoreProds.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for store products, got %d: %s", wStoreProds.Code, wStoreProds.Body.String())
	}
	var publicProds []models.Product
	_ = json.Unmarshal(wStoreProds.Body.Bytes(), &publicProds)
	if len(publicProds) != 1 {
		t.Errorf("Expected 1 public product in store catalog, got %d", len(publicProds))
	}

	// Insert an order containing this seller's item
	orderItems := []models.OrderItem{
		{
			ProductID: prod.ID,
			StoreID:   store.ID,
			StoreName: store.Name,
			Name:      prod.Name,
			Price:     prod.Price,
			Qty:       2,
		},
	}
	itemsJSON, _ := json.Marshal(orderItems)
	_, _ = database.DB.Exec(
		database.Rebind("INSERT INTO orders (id, customer_id, customer_name, customer_email, items_json, total, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"ord-seller-test", "cust-99", "Pembeli", "pembeli@test.com", string(itemsJSON), 600000.0, "Processing", "2026-01-01T10:00:00Z",
	)

	// Seller checks orders: GET /api/seller/orders
	reqOrders := httptest.NewRequest(http.MethodGet, "/api/seller/orders", nil)
	reqOrders.Header.Set("Authorization", "Bearer "+sellerToken)
	wOrders := httptest.NewRecorder()

	handlers.SellerHandler(wOrders, reqOrders)
	if wOrders.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for seller orders, got %d: %s", wOrders.Code, wOrders.Body.String())
	}

	var sellerOrders []struct {
		ID         string  `json:"_id"`
		StoreTotal float64 `json:"storeTotal"`
	}
	_ = json.Unmarshal(wOrders.Body.Bytes(), &sellerOrders)
	if len(sellerOrders) != 1 {
		t.Fatalf("Expected 1 order for seller, got %d", len(sellerOrders))
	}
	if sellerOrders[0].StoreTotal != 600000.0 {
		t.Errorf("Expected storeTotal 600000, got %f", sellerOrders[0].StoreTotal)
	}
}
