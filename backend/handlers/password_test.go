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

	"golang.org/x/crypto/bcrypt"
)

func TestChangePassword_Unauthenticated(t *testing.T) {
	setupTestDB(t)

	body := map[string]string{
		"currentPassword": "old",
		"newPassword":     "newpass123",
		"confirmPassword": "newpass123",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.ChangePasswordHandler(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for unauthenticated change password, got %d", w.Code)
	}
}

func TestChangePassword_Validation(t *testing.T) {
	setupTestDB(t)

	user := models.User{ID: "usr-pwd-val", Name: "Val User", Email: "val@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	// Case 1: Empty fields
	reqEmpty := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader([]byte(`{"currentPassword":"","newPassword":"","confirmPassword":""}`)))
	reqEmpty.Header.Set("Authorization", "Bearer "+token)
	reqEmpty.Header.Set("Content-Type", "application/json")
	wEmpty := httptest.NewRecorder()
	handlers.ChangePasswordHandler(wEmpty, reqEmpty)
	if wEmpty.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 for empty fields, got %d", wEmpty.Code)
	}

	// Case 2: Confirmation mismatch
	reqMismatch := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader([]byte(`{"currentPassword":"old","newPassword":"newpass1","confirmPassword":"newpass2"}`)))
	reqMismatch.Header.Set("Authorization", "Bearer "+token)
	reqMismatch.Header.Set("Content-Type", "application/json")
	wMismatch := httptest.NewRecorder()
	handlers.ChangePasswordHandler(wMismatch, reqMismatch)
	if wMismatch.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 for confirmation mismatch, got %d", wMismatch.Code)
	}

	// Case 3: Too short (< 6 chars)
	reqShort := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader([]byte(`{"currentPassword":"old","newPassword":"12345","confirmPassword":"12345"}`)))
	reqShort.Header.Set("Authorization", "Bearer "+token)
	reqShort.Header.Set("Content-Type", "application/json")
	wShort := httptest.NewRecorder()
	handlers.ChangePasswordHandler(wShort, reqShort)
	if wShort.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 for short password, got %d", wShort.Code)
	}
}

func TestChangePassword_WrongCurrentPassword(t *testing.T) {
	setupTestDB(t)

	// Seed user with password "secret123"
	hash, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	_, _ = database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"usr-pwd-wrong", "Wrong Tester", "wrong@test.com", string(hash), 0, "Customer", 0, "2026-01-01T00:00:00Z",
	)

	user := models.User{ID: "usr-pwd-wrong", Name: "Wrong Tester", Email: "wrong@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	body := map[string]string{
		"currentPassword": "wrongCurrentPassword!",
		"newPassword":     "newSecret456!",
		"confirmPassword": "newSecret456!",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.ChangePasswordHandler(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for incorrect current password, got %d", w.Code)
	}
}

func TestChangePassword_SameAsCurrent(t *testing.T) {
	setupTestDB(t)

	// Seed user with password "existingPass123"
	hash, _ := bcrypt.GenerateFromPassword([]byte("existingPass123"), bcrypt.DefaultCost)
	_, _ = database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"usr-pwd-same", "Same Tester", "same@test.com", string(hash), 0, "Customer", 0, "2026-01-01T00:00:00Z",
	)

	user := models.User{ID: "usr-pwd-same", Name: "Same Tester", Email: "same@test.com", Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	body := map[string]string{
		"currentPassword": "existingPass123",
		"newPassword":     "existingPass123",
		"confirmPassword": "existingPass123",
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handlers.ChangePasswordHandler(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request when new password equals current password, got %d", w.Code)
	}
}

func TestChangePassword_SuccessAndRelogin(t *testing.T) {
	setupTestDB(t)

	userEmail := "pwdtester@example.com"
	oldPass := "InitialPass123!"
	newPass := "NewSecurePass456!"

	// 1. Seed user
	hash, _ := bcrypt.GenerateFromPassword([]byte(oldPass), bcrypt.DefaultCost)
	_, _ = database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"usr-pwd-success", "Password Tester", userEmail, string(hash), 0, "Customer", 0, "2026-01-01T00:00:00Z",
	)

	user := models.User{ID: "usr-pwd-success", Name: "Password Tester", Email: userEmail, Role: "Customer", IsAdmin: false}
	token, _ := middleware.GenerateToken(user)

	// 2. Change password
	changeBody := map[string]string{
		"currentPassword": oldPass,
		"newPassword":     newPass,
		"confirmPassword": newPass,
	}
	bChange, _ := json.Marshal(changeBody)
	reqChange := httptest.NewRequest(http.MethodPut, "/api/auth/password", bytes.NewReader(bChange))
	reqChange.Header.Set("Authorization", "Bearer "+token)
	reqChange.Header.Set("Content-Type", "application/json")
	wChange := httptest.NewRecorder()

	handlers.ChangePasswordHandler(wChange, reqChange)
	if wChange.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for successful password change, got %d: %s", wChange.Code, wChange.Body.String())
	}

	// 3. Attempt login with old password -> must fail (401)
	oldLoginBody := map[string]string{"email": userEmail, "password": oldPass}
	bOldLogin, _ := json.Marshal(oldLoginBody)
	reqOldLogin := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(bOldLogin))
	reqOldLogin.Header.Set("Content-Type", "application/json")
	wOldLogin := httptest.NewRecorder()

	handlers.LoginHandler(wOldLogin, reqOldLogin)
	if wOldLogin.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized when logging in with old password, got %d", wOldLogin.Code)
	}

	// 4. Attempt login with new password -> must succeed (200)
	newLoginBody := map[string]string{"email": userEmail, "password": newPass}
	bNewLogin, _ := json.Marshal(newLoginBody)
	reqNewLogin := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(bNewLogin))
	reqNewLogin.Header.Set("Content-Type", "application/json")
	wNewLogin := httptest.NewRecorder()

	handlers.LoginHandler(wNewLogin, reqNewLogin)
	if wNewLogin.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK when logging in with new password, got %d: %s", wNewLogin.Code, wNewLogin.Body.String())
	}

	var loggedUser models.User
	if err := json.Unmarshal(wNewLogin.Body.Bytes(), &loggedUser); err != nil {
		t.Fatalf("Failed to decode logged user: %v", err)
	}
	if loggedUser.Token == "" {
		t.Errorf("Expected JWT token upon login with new password, got empty")
	}
}
