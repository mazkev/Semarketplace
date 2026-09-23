package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"semarket/backend/database"
	"semarket/backend/handlers"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func TestAnalyticsHandler_Protection(t *testing.T) {
	setupTestDB(t)

	handler := middleware.RequireAdmin(handlers.AnalyticsHandler)

	// 1. Unauthenticated request -> 401 Unauthorized
	reqUnauth := httptest.NewRequest(http.MethodGet, "/api/analytics", nil)
	wUnauth := httptest.NewRecorder()
	handler(wUnauth, reqUnauth)

	if wUnauth.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for unauthenticated analytics access, got %d", wUnauth.Code)
	}

	// 2. Regular customer -> 403 Forbidden
	cust := models.User{ID: "cust-a", Name: "Customer", Email: "c@test.com", Role: "Customer", IsAdmin: false}
	tokenCust, _ := middleware.GenerateToken(cust)

	reqCust := httptest.NewRequest(http.MethodGet, "/api/analytics", nil)
	reqCust.Header.Set("Authorization", "Bearer "+tokenCust)
	wCust := httptest.NewRecorder()
	handler(wCust, reqCust)

	if wCust.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for non-admin analytics access, got %d", wCust.Code)
	}
}

func TestAnalyticsHandler_Metrics(t *testing.T) {
	setupTestDB(t)

	// Insert an order for testing analytics metrics
	items := []models.OrderItem{
		{ProductID: "1", Name: "Fjallraven Backpack", Price: 1000000, Qty: 2},
	}
	itemsBytes, _ := json.Marshal(items)

	_, err := database.DB.Exec(
		database.Rebind(`INSERT INTO orders (id, customer_id, customer_name, customer_email, items_json, total, status, timestamp)
		 VALUES ('ORD-ANALYTICS-1', 'u-002', 'Kevin Pratama', 'kevin@test.com', ?, 2000000, 'Delivered', '2026-09-23T00:00:00Z')`),
		string(itemsBytes),
	)
	if err != nil {
		t.Fatalf("Failed to insert sample order for analytics: %v", err)
	}

	admin := models.User{ID: "admin-a", Name: "Admin", Email: "admin@test.com", Role: "Admin", IsAdmin: true}
	tokenAdmin, _ := middleware.GenerateToken(admin)

	handler := middleware.RequireAdmin(handlers.AnalyticsHandler)
	req := httptest.NewRequest(http.MethodGet, "/api/analytics", nil)
	req.Header.Set("Authorization", "Bearer "+tokenAdmin)
	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for admin analytics access, got %d: %s", w.Code, w.Body.String())
	}

	var overview models.AnalyticsOverview
	if err := json.Unmarshal(w.Body.Bytes(), &overview); err != nil {
		t.Fatalf("Failed to parse analytics overview: %v", err)
	}

	// Verify Summary
	if overview.Summary.ProductCount == 0 {
		t.Errorf("Expected ProductCount > 0, got 0")
	}
	if overview.Summary.OrderCount < 1 {
		t.Errorf("Expected OrderCount >= 1, got %d", overview.Summary.OrderCount)
	}
	if overview.Summary.TotalRevenue < 2000000 {
		t.Errorf("Expected TotalRevenue >= 2000000, got %.0f", overview.Summary.TotalRevenue)
	}

	// Verify TopSellers
	foundTopSeller := false
	for _, ts := range overview.TopSellers {
		if ts.Name == "Fjallraven Backpack" && ts.Qty >= 2 {
			foundTopSeller = true
			break
		}
	}
	if !foundTopSeller {
		t.Errorf("Expected 'Fjallraven Backpack' with qty >= 2 in top sellers, got %+v", overview.TopSellers)
	}

	// Verify CustomerInsights
	foundCustomer := false
	for _, ci := range overview.CustomerInsights {
		if ci.ID == "u-002" {
			foundCustomer = true
			if ci.TotalSpent < 2000000 {
				t.Errorf("Expected TotalSpent >= 2000000 for u-002, got %.0f", ci.TotalSpent)
			}
			break
		}
	}
	if !foundCustomer {
		t.Errorf("Expected customer u-002 in customer insights")
	}
}
