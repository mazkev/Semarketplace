package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"semarket/backend/database"
	"semarket/backend/handlers"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func setupTestDB(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "semarket_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	t.Cleanup(func() {
		if database.DB != nil {
			database.DB.Close()
		}
		os.RemoveAll(tempDir)
	})

	os.Setenv("DATABASE_URL", "")
	origWd, _ := os.Getwd()
	_ = os.Chdir(tempDir)
	t.Cleanup(func() { _ = os.Chdir(origWd) })

	db, err := database.InitDB()
	if err != nil {
		t.Fatalf("Failed to init test DB: %v", err)
	}
	_ = db
	_ = filepath.Join(tempDir, "data")
}

func TestRegisterHandler_NoPrivilegeEscalation(t *testing.T) {
	setupTestDB(t)

	// Attacker tries to register with isAdmin: true and email containing 'admin'
	body := map[string]any{
		"name":     "Attacker",
		"email":    "super_admin_fake@example.com",
		"password": "Password123!",
		"isAdmin":  true,
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.RegisterHandler(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	var res models.User
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if res.IsAdmin {
		t.Errorf("CRITICAL SECURITY FLAW: Newly registered user has IsAdmin=true")
	}
	if res.Role != "Customer" {
		t.Errorf("Expected role 'Customer', got '%s'", res.Role)
	}

	// Verify in DB as well
	var isAdminInt int
	var role string
	err := database.DB.QueryRow(
		"SELECT is_admin, role FROM users WHERE email = ?",
		"super_admin_fake@example.com",
	).Scan(&isAdminInt, &role)
	if err != nil {
		t.Fatalf("Failed to query user from DB: %v", err)
	}

	if isAdminInt != 0 || role != "Customer" {
		t.Errorf("DB record has is_admin=%d, role=%s; expected 0 and Customer", isAdminInt, role)
	}
}

func TestOrdersHandler_RequireAuth(t *testing.T) {
	setupTestDB(t)

	// Wrap with RequireAuth as done in main.go
	handler := middleware.RequireAuth(handlers.OrdersHandler)

	req := httptest.NewRequest(http.MethodGet, "/api/orders", nil)
	w := httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 Unauthorized for unauthenticated request, got %d", w.Code)
	}
}

func TestOrdersHandler_CustomerIsolationAndOwnership(t *testing.T) {
	setupTestDB(t)

	custA := models.User{ID: "cust-A", Name: "Customer A", Email: "custA@test.com", Role: "Customer", IsAdmin: false}
	custB := models.User{ID: "cust-B", Name: "Customer B", Email: "custB@test.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "admin-1", Name: "Admin", Email: "admin@test.com", Role: "Admin", IsAdmin: true}

	tokenA, _ := middleware.GenerateToken(custA)
	tokenB, _ := middleware.GenerateToken(custB)
	tokenAdmin, _ := middleware.GenerateToken(admin)

	handler := middleware.RequireAuth(handlers.OrdersHandler)

	// 1. Cust A creates an order with seeded product ID "1"
	orderPayload := models.Order{
		ID:    "ORD-TEST-A1",
		Total: 250000,
		Items: []models.OrderItem{
			{ProductID: "1", Name: "Fjallraven Backpack", Price: 250000, Qty: 1},
		},
	}
	orderBytes, _ := json.Marshal(orderPayload)
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(orderBytes))
	reqCreate.Header.Set("Authorization", "Bearer "+tokenA)
	reqCreate.Header.Set("Content-Type", "application/json")
	wCreate := httptest.NewRecorder()

	handler(wCreate, reqCreate)
	if wCreate.Code != http.StatusCreated {
		t.Fatalf("Failed to create order as Cust A, status %d: %s", wCreate.Code, wCreate.Body.String())
	}

	// 2. Cust A calls GET /api/orders -> should see 1 order
	reqGetA := httptest.NewRequest(http.MethodGet, "/api/orders", nil)
	reqGetA.Header.Set("Authorization", "Bearer "+tokenA)
	wGetA := httptest.NewRecorder()
	handler(wGetA, reqGetA)

	var ordersA []models.Order
	_ = json.Unmarshal(wGetA.Body.Bytes(), &ordersA)
	if len(ordersA) != 1 || ordersA[0].ID != "ORD-TEST-A1" {
		t.Errorf("Cust A expected 1 order (ORD-TEST-A1), got %d orders", len(ordersA))
	}

	// 3. Cust B calls GET /api/orders -> must NOT see Cust A's order
	reqGetB := httptest.NewRequest(http.MethodGet, "/api/orders", nil)
	reqGetB.Header.Set("Authorization", "Bearer "+tokenB)
	wGetB := httptest.NewRecorder()
	handler(wGetB, reqGetB)

	var ordersB []models.Order
	_ = json.Unmarshal(wGetB.Body.Bytes(), &ordersB)
	if len(ordersB) != 0 {
		t.Errorf("CRITICAL IDOR: Cust B received %d orders belonging to other customers!", len(ordersB))
	}

	// 4. Cust B tries to GET /api/orders/ORD-TEST-A1 directly -> must return 403 Forbidden
	reqGetDetailB := httptest.NewRequest(http.MethodGet, "/api/orders/ORD-TEST-A1", nil)
	reqGetDetailB.Header.Set("Authorization", "Bearer "+tokenB)
	wGetDetailB := httptest.NewRecorder()
	handler(wGetDetailB, reqGetDetailB)

	if wGetDetailB.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when Cust B accesses Cust A's order, got %d", wGetDetailB.Code)
	}

	// 5. Cust B tries to update status of Cust A's order -> must return 403 Forbidden
	updatePayload, _ := json.Marshal(map[string]any{"status": "Delivered"})
	reqUpdateB := httptest.NewRequest(http.MethodPut, "/api/orders/ORD-TEST-A1", bytes.NewReader(updatePayload))
	reqUpdateB.Header.Set("Authorization", "Bearer "+tokenB)
	reqUpdateB.Header.Set("Content-Type", "application/json")
	wUpdateB := httptest.NewRecorder()
	handler(wUpdateB, reqUpdateB)

	if wUpdateB.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when Cust B updates order status, got %d", wUpdateB.Code)
	}

	// 6. Cust B tries to delete Cust A's order -> must return 403 Forbidden
	reqDeleteB := httptest.NewRequest(http.MethodDelete, "/api/orders/ORD-TEST-A1", nil)
	reqDeleteB.Header.Set("Authorization", "Bearer "+tokenB)
	wDeleteB := httptest.NewRecorder()
	handler(wDeleteB, reqDeleteB)

	if wDeleteB.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when Cust B deletes Cust A's order, got %d", wDeleteB.Code)
	}

	// 7. Admin updates order status -> should succeed 200 OK
	reqUpdateAdmin := httptest.NewRequest(http.MethodPut, "/api/orders/ORD-TEST-A1", bytes.NewReader(updatePayload))
	reqUpdateAdmin.Header.Set("Authorization", "Bearer "+tokenAdmin)
	reqUpdateAdmin.Header.Set("Content-Type", "application/json")
	wUpdateAdmin := httptest.NewRecorder()
	handler(wUpdateAdmin, reqUpdateAdmin)

	if wUpdateAdmin.Code != http.StatusOK {
		t.Errorf("Expected 200 OK when Admin updates status, got %d: %s", wUpdateAdmin.Code, wUpdateAdmin.Body.String())
	}

	// 8. Cust A deletes their own order -> should succeed 200 OK
	reqDeleteA := httptest.NewRequest(http.MethodDelete, "/api/orders/ORD-TEST-A1", nil)
	reqDeleteA.Header.Set("Authorization", "Bearer "+tokenA)
	wDeleteA := httptest.NewRecorder()
	handler(wDeleteA, reqDeleteA)

	if wDeleteA.Code != http.StatusOK {
		t.Errorf("Expected 200 OK when Cust A deletes their own order, got %d: %s", wDeleteA.Code, wDeleteA.Body.String())
	}
}

func TestOrdersHandler_StockValidationAndOverselling(t *testing.T) {
	setupTestDB(t)

	// Insert a specific test product with initial stock = 5
	prodID := "P-STOCK-TEST"
	_, err := database.DB.Exec(
		database.Rebind(`INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at)
		 VALUES (?, 'Limited Edition Sneaker', 500000, 750000, 'Shoes', '', 5, 5.0, 0, 'Test sneaker', 0, ?)`),
		prodID, "2026-09-23T00:00:00Z",
	)
	if err != nil {
		t.Fatalf("Failed to insert test product: %v", err)
	}

	cust := models.User{ID: "cust-stock", Name: "Stock Buyer", Email: "buyer@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(cust)
	handler := middleware.RequireAuth(handlers.OrdersHandler)

	// 1. Attempt to purchase 6 items when only 5 are in stock -> Expect 409 Conflict
	orderExcess := models.Order{
		ID:    "ORD-EXCESS",
		Total: 3000000,
		Items: []models.OrderItem{
			{ProductID: prodID, Name: "Limited Edition Sneaker", Price: 500000, Qty: 6},
		},
	}
	bExcess, _ := json.Marshal(orderExcess)
	reqExcess := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(bExcess))
	reqExcess.Header.Set("Authorization", "Bearer "+token)
	reqExcess.Header.Set("Content-Type", "application/json")
	wExcess := httptest.NewRecorder()
	handler(wExcess, reqExcess)

	if wExcess.Code != http.StatusConflict {
		t.Errorf("Expected 409 Conflict for overselling order, got %d: %s", wExcess.Code, wExcess.Body.String())
	}

	// Verify stock is still 5
	var stock int
	_ = database.DB.QueryRow("SELECT stock FROM products WHERE id = ?", prodID).Scan(&stock)
	if stock != 5 {
		t.Fatalf("Stock should remain 5 after failed order, got %d", stock)
	}

	// 2. Purchase 3 items -> Should succeed 201 Created. Remaining stock: 2
	orderValid := models.Order{
		ID:    "ORD-VALID-1",
		Total: 1500000,
		Items: []models.OrderItem{
			{ProductID: prodID, Name: "Limited Edition Sneaker", Price: 500000, Qty: 3},
		},
	}
	bValid, _ := json.Marshal(orderValid)
	reqValid := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(bValid))
	reqValid.Header.Set("Authorization", "Bearer "+token)
	reqValid.Header.Set("Content-Type", "application/json")
	wValid := httptest.NewRecorder()
	handler(wValid, reqValid)

	if wValid.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", wValid.Code, wValid.Body.String())
	}

	_ = database.DB.QueryRow("SELECT stock FROM products WHERE id = ?", prodID).Scan(&stock)
	if stock != 2 {
		t.Errorf("Expected stock to be 2 after buying 3, got %d", stock)
	}

	// 3. Try to purchase 3 items again when only 2 are left -> Expect 409 Conflict
	orderSecondFail := models.Order{
		ID:    "ORD-FAIL-2",
		Total: 1500000,
		Items: []models.OrderItem{
			{ProductID: prodID, Name: "Limited Edition Sneaker", Price: 500000, Qty: 3},
		},
	}
	bFail2, _ := json.Marshal(orderSecondFail)
	reqFail2 := httptest.NewRequest(http.MethodPost, "/api/orders", bytes.NewReader(bFail2))
	reqFail2.Header.Set("Authorization", "Bearer "+token)
	reqFail2.Header.Set("Content-Type", "application/json")
	wFail2 := httptest.NewRecorder()
	handler(wFail2, reqFail2)

	if wFail2.Code != http.StatusConflict {
		t.Errorf("Expected 409 Conflict when requesting 3 from 2 available, got %d", wFail2.Code)
	}

	// 4. Cancel/Delete ORD-VALID-1 -> Stock should be restored from 2 back to 5
	reqCancel := httptest.NewRequest(http.MethodDelete, "/api/orders/ORD-VALID-1", nil)
	reqCancel.Header.Set("Authorization", "Bearer "+token)
	wCancel := httptest.NewRecorder()
	handler(wCancel, reqCancel)

	if wCancel.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on order cancellation, got %d: %s", wCancel.Code, wCancel.Body.String())
	}

	_ = database.DB.QueryRow("SELECT stock FROM products WHERE id = ?", prodID).Scan(&stock)
	if stock != 5 {
		t.Errorf("Expected stock to be restored to 5 after order deletion, got %d", stock)
	}
}

