package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"semarket/backend/handlers"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func TestVariants_ProductCreationAndCatalog(t *testing.T) {
	setupTestDB(t)

	// Admin creates product with variants
	admin := models.User{ID: "adm-var", Name: "Admin Var", Email: "admin@semarket.com", Role: "Admin", IsAdmin: true}
	adminToken, _ := middleware.GenerateToken(admin)

	newProd := map[string]any{
		"name":          "Jaket Hoodie Polos Premium",
		"price":         200000.0,
		"originalPrice": 250000.0,
		"category":      "Men's clothing",
		"image":         "https://example.com/hoodie.jpg",
		"stock":         50,
		"variants":      []string{"S", "M", "L", "XL", "XXL"},
	}
	b, _ := json.Marshal(newProd)
	req := httptest.NewRequest(http.MethodPost, "/api/products", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+adminToken)
	w := httptest.NewRecorder()

	handlers.ProductsHandler(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for product with variants, got %d: %s", w.Code, w.Body.String())
	}

	var created models.Product
	_ = json.Unmarshal(w.Body.Bytes(), &created)
	if len(created.Variants) != 5 {
		t.Fatalf("Expected 5 variants, got %d", len(created.Variants))
	}
	if created.Variants[0] != "S" || created.Variants[3] != "XL" {
		t.Errorf("Unexpected variants content: %+v", created.Variants)
	}

	// Fetch via GET /api/products/{id}
	reqGet := httptest.NewRequest(http.MethodGet, "/api/products/"+created.ID, nil)
	wGet := httptest.NewRecorder()
	handlers.ProductsHandler(wGet, reqGet)
	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d: %s", wGet.Code, wGet.Body.String())
	}

	var fetched models.Product
	_ = json.Unmarshal(wGet.Body.Bytes(), &fetched)
	if len(fetched.Variants) != 5 {
		t.Errorf("Expected 5 variants from getProductByID, got %d", len(fetched.Variants))
	}
}

func TestVariants_SellerCenterAndOrders(t *testing.T) {
	setupTestDB(t)

	// Seller
	seller := models.User{ID: "seller-var-1", Name: "Seller Var", Email: "svar@test.com", Role: "Customer"}
	sellerToken, _ := middleware.GenerateToken(seller)

	// Open store
	bStore, _ := json.Marshal(map[string]string{"name": "Fashion Varian Store", "city": "Solo"})
	reqStore := httptest.NewRequest(http.MethodPost, "/api/stores", bytes.NewReader(bStore))
	reqStore.Header.Set("Authorization", "Bearer "+sellerToken)
	wStore := httptest.NewRecorder()
	handlers.StoresHandler(wStore, reqStore)
	if wStore.Code != http.StatusCreated {
		t.Fatalf("Failed to create store: %s", wStore.Body.String())
	}

	// Seller creates product with variants: ["Merah", "Kuning", "Hijau"]
	sellerProd := map[string]any{
		"name":     "Kaos Oblong Combed 30s",
		"price":    85000.0,
		"stock":    100,
		"category": "Fashion",
		"variants": []string{"Merah", "Kuning", "Hijau"},
	}
	bProd, _ := json.Marshal(sellerProd)
	reqProd := httptest.NewRequest(http.MethodPost, "/api/seller/products", bytes.NewReader(bProd))
	reqProd.Header.Set("Authorization", "Bearer "+sellerToken)
	wProd := httptest.NewRecorder()
	handlers.SellerHandler(wProd, reqProd)
	if wProd.Code != http.StatusCreated {
		t.Fatalf("Failed to create seller product with variants: %s", wProd.Body.String())
	}

	var created models.Product
	_ = json.Unmarshal(wProd.Body.Bytes(), &created)
	if len(created.Variants) != 3 {
		t.Fatalf("Expected 3 variants, got %d", len(created.Variants))
	}

	// Customer places an order choosing variant "Kuning"
	cust := models.User{ID: "cust-var-1", Name: "Buyer Varian", Email: "buyer@var.com", Role: "Customer"}
	custToken, _ := middleware.GenerateToken(cust)

	orderPayload := map[string]any{
		"items": []map[string]any{
			{
				"productId": created.ID,
				"name":      created.Name,
				"price":     created.Price,
				"qty":       2,
				"variant":   "Kuning",
			},
		},
		"total": 170000.0,
	}
	bOrder, _ := json.Marshal(orderPayload)
	reqOrder := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(bOrder))
	reqOrder.Header.Set("Authorization", "Bearer "+custToken)
	wOrder := httptest.NewRecorder()
	handlers.OrdersHandler(wOrder, reqOrder)
	if wOrder.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for order with variant, got %d: %s", wOrder.Code, wOrder.Body.String())
	}

	var createdOrder models.Order
	_ = json.Unmarshal(wOrder.Body.Bytes(), &createdOrder)
	if len(createdOrder.Items) != 1 || createdOrder.Items[0].Variant != "Kuning" {
		t.Errorf("Expected order item variant 'Kuning', got '%s'", createdOrder.Items[0].Variant)
	}

	// Seller updates variants: add "Hitam"
	updatePayload := map[string]any{
		"variants": []string{"Merah", "Kuning", "Hijau", "Hitam"},
	}
	bUp, _ := json.Marshal(updatePayload)
	reqUp := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/seller/products/%s", created.ID), bytes.NewReader(bUp))
	reqUp.Header.Set("Authorization", "Bearer "+sellerToken)
	wUp := httptest.NewRecorder()
	handlers.SellerHandler(wUp, reqUp)
	if wUp.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for variant update, got %d: %s", wUp.Code, wUp.Body.String())
	}

	var updated models.Product
	_ = json.Unmarshal(wUp.Body.Bytes(), &updated)
	if len(updated.Variants) != 4 {
		t.Errorf("Expected 4 variants after update, got %d", len(updated.Variants))
	}
}
