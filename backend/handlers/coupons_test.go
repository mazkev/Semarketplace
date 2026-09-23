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

func TestCouponsHandler_GetAll(t *testing.T) {
	setupTestDB(t)

	req := httptest.NewRequest(http.MethodGet, "/api/coupons", nil)
	w := httptest.NewRecorder()

	handlers.CouponsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}

	var coupons []models.Coupon
	if err := json.Unmarshal(w.Body.Bytes(), &coupons); err != nil {
		t.Fatalf("Failed to decode coupons response: %v", err)
	}

	if len(coupons) == 0 {
		t.Errorf("Expected seeded coupons to be returned, got 0")
	}
}

func TestCouponsHandler_Validate(t *testing.T) {
	setupTestDB(t)

	// 1. Valid coupon code (case-insensitive & trimmed)
	validBody, _ := json.Marshal(map[string]string{"code": " welcome10 "})
	req := httptest.NewRequest(http.MethodPost, "/api/coupons/validate", bytes.NewReader(validBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.CouponsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for valid coupon, got %d: %s", w.Code, w.Body.String())
	}

	var coupon models.Coupon
	if err := json.Unmarshal(w.Body.Bytes(), &coupon); err != nil {
		t.Fatalf("Failed to parse coupon: %v", err)
	}
	if coupon.Code != "WELCOME10" || coupon.Type != "percentage" || coupon.Value != 10 {
		t.Errorf("Unexpected coupon data: %+v", coupon)
	}

	// 2. Invalid coupon code
	invalidBody, _ := json.Marshal(map[string]string{"code": "FAKECOUPON"})
	reqInvalid := httptest.NewRequest(http.MethodPost, "/api/coupons/validate", bytes.NewReader(invalidBody))
	reqInvalid.Header.Set("Content-Type", "application/json")
	wInvalid := httptest.NewRecorder()

	handlers.CouponsHandler(wInvalid, reqInvalid)
	if wInvalid.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for invalid coupon, got %d, body: %s", wInvalid.Code, wInvalid.Body.String())
	}

	// 3. Empty coupon code
	emptyBody, _ := json.Marshal(map[string]string{"code": ""})
	reqEmpty := httptest.NewRequest(http.MethodPost, "/api/coupons/validate", bytes.NewReader(emptyBody))
	reqEmpty.Header.Set("Content-Type", "application/json")
	wEmpty := httptest.NewRecorder()

	handlers.CouponsHandler(wEmpty, reqEmpty)
	if wEmpty.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty coupon code, got %d, body: %s", wEmpty.Code, wEmpty.Body.String())
	}
}

func TestCouponsHandler_AdminCRUD(t *testing.T) {
	setupTestDB(t)

	cust := models.User{ID: "cust-1", Name: "Customer", Email: "cust@test.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "admin-1", Name: "Admin", Email: "admin@test.com", Role: "Admin", IsAdmin: true}

	tokenCust, _ := middleware.GenerateToken(cust)
	tokenAdmin, _ := middleware.GenerateToken(admin)

	newCoupon := models.Coupon{
		Code:        "FLASH70",
		Type:        "percentage",
		Value:       70,
		Description: "70% Off Flash Voucher",
	}
	couponBytes, _ := json.Marshal(newCoupon)

	// 1. Non-admin customer tries to create coupon -> 403 Forbidden
	reqCust := httptest.NewRequest(http.MethodPost, "/api/coupons", bytes.NewReader(couponBytes))
	reqCust.Header.Set("Authorization", "Bearer "+tokenCust)
	reqCust.Header.Set("Content-Type", "application/json")
	wCust := httptest.NewRecorder()

	handlers.CouponsHandler(wCust, reqCust)
	if wCust.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for non-admin coupon creation, got %d", wCust.Code)
	}

	// 2. Admin creates coupon -> 201 Created
	reqAdmin := httptest.NewRequest(http.MethodPost, "/api/coupons", bytes.NewReader(couponBytes))
	reqAdmin.Header.Set("Authorization", "Bearer "+tokenAdmin)
	reqAdmin.Header.Set("Content-Type", "application/json")
	wAdmin := httptest.NewRecorder()

	handlers.CouponsHandler(wAdmin, reqAdmin)
	if wAdmin.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for admin coupon creation, got %d: %s", wAdmin.Code, wAdmin.Body.String())
	}

	var created models.Coupon
	_ = json.Unmarshal(wAdmin.Body.Bytes(), &created)
	if created.ID == "" || created.Code != "FLASH70" {
		t.Errorf("Unexpected created coupon: %+v", created)
	}

	// 3. Admin deletes coupon -> 200 OK
	reqDelete := httptest.NewRequest(http.MethodDelete, "/api/coupons/"+created.ID, nil)
	reqDelete.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wDelete := httptest.NewRecorder()

	handlers.CouponsHandler(wDelete, reqDelete)
	if wDelete.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for coupon deletion, got %d: %s", wDelete.Code, wDelete.Body.String())
	}

	// 4. Admin tries to delete non-existent coupon -> 404 Not Found
	reqDelete404 := httptest.NewRequest(http.MethodDelete, "/api/coupons/NON_EXISTENT_ID", nil)
	reqDelete404.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wDelete404 := httptest.NewRecorder()

	handlers.CouponsHandler(wDelete404, reqDelete404)
	if wDelete404.Code != http.StatusNotFound {
		t.Errorf("Expected 404 Not Found for deleting non-existent coupon, got %d", wDelete404.Code)
	}
}
