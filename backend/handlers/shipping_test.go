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

func TestOrders_ShippingCourierAndCost(t *testing.T) {
	setupTestDB(t)

	// Create customer & token
	customer := models.User{ID: "cust-ship-1", Name: "Budi Santoso", Email: "budi@test.com", Role: "Customer"}
	custToken, _ := middleware.GenerateToken(customer)

	// Order payload with shipping courier, cost, and destination address
	orderPayload := map[string]any{
		"shippingCourier": "JNE Reguler (2-3 Hari)",
		"shippingCost":    12000.0,
		"shippingAddress": "Jl. Sudirman No. 45, Jakarta Selatan",
		"items": []map[string]any{
			{
				"productId": "1", // Initial seeded backpack
				"name":      "Fjallraven - Foldsack No. 1 Backpack",
				"price":     1095000.0,
				"qty":       1,
				"variant":   "Navy",
			},
		},
		"total": 1107000.0, // 1095000 + 12000
	}
	b, _ := json.Marshal(orderPayload)

	req := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+custToken)
	w := httptest.NewRecorder()

	handlers.OrdersHandler(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for order with shipping, got %d: %s", w.Code, w.Body.String())
	}

	var created models.Order
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to unmarshal created order: %v", err)
	}

	if created.ShippingCourier != "JNE Reguler (2-3 Hari)" {
		t.Errorf("Expected ShippingCourier 'JNE Reguler (2-3 Hari)', got '%s'", created.ShippingCourier)
	}
	if created.ShippingCost != 12000.0 {
		t.Errorf("Expected ShippingCost 12000.0, got %f", created.ShippingCost)
	}
	if created.ShippingAddress != "Jl. Sudirman No. 45, Jakarta Selatan" {
		t.Errorf("Expected ShippingAddress 'Jl. Sudirman No. 45, Jakarta Selatan', got '%s'", created.ShippingAddress)
	}

	// Verify order retrieval by ID
	reqGet := httptest.NewRequest(http.MethodGet, "/api/orders/"+created.ID, nil)
	reqGet.Header.Set("Authorization", "Bearer "+custToken)
	wGet := httptest.NewRecorder()
	handlers.OrdersHandler(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK retrieving order, got %d: %s", wGet.Code, wGet.Body.String())
	}

	var fetched models.Order
	_ = json.Unmarshal(wGet.Body.Bytes(), &fetched)
	if fetched.ShippingCourier != "JNE Reguler (2-3 Hari)" || fetched.ShippingCost != 12000.0 || fetched.ShippingAddress != "Jl. Sudirman No. 45, Jakarta Selatan" {
		t.Errorf("Retrieved order shipping metadata mismatch: %+v", fetched)
	}

	// Verify retrieval in customer's order list
	reqList := httptest.NewRequest(http.MethodGet, "/api/orders", nil)
	reqList.Header.Set("Authorization", "Bearer "+custToken)
	wList := httptest.NewRecorder()
	handlers.OrdersHandler(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK listing orders, got %d: %s", wList.Code, wList.Body.String())
	}

	var list []models.Order
	_ = json.Unmarshal(wList.Body.Bytes(), &list)
	if len(list) == 0 || list[0].ShippingCourier != "JNE Reguler (2-3 Hari)" {
		t.Errorf("List orders did not return correct shipping courier: %+v", list)
	}
}

func TestOrders_FreeShippingThreshold(t *testing.T) {
	setupTestDB(t)

	customer := models.User{ID: "cust-ship-free", Name: "Siti Rahma", Email: "siti@test.com", Role: "Customer"}
	custToken, _ := middleware.GenerateToken(customer)

	// Order qualifying for free shipping (subtotal >= 500k, shipping cost = 0)
	orderPayload := map[string]any{
		"shippingCourier": "JNE Reguler (Promo Bebas Ongkir)",
		"shippingCost":    0.0,
		"shippingAddress": "Dago Pakar No. 12, Bandung",
		"items": []map[string]any{
			{
				"productId": "1",
				"name":      "Fjallraven - Foldsack No. 1 Backpack",
				"price":     1095000.0,
				"qty":       1,
			},
		},
		"total": 1095000.0,
	}
	b, _ := json.Marshal(orderPayload)

	req := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+custToken)
	w := httptest.NewRecorder()

	handlers.OrdersHandler(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for free shipping order, got %d: %s", w.Code, w.Body.String())
	}

	var created models.Order
	_ = json.Unmarshal(w.Body.Bytes(), &created)
	if created.ShippingCost != 0.0 {
		t.Errorf("Expected ShippingCost 0.0, got %f", created.ShippingCost)
	}
	if created.ShippingCourier != "JNE Reguler (Promo Bebas Ongkir)" {
		t.Errorf("Expected free shipping courier name, got '%s'", created.ShippingCourier)
	}
}
