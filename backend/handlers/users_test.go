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

func TestUsersHandler_GetAllSecurity(t *testing.T) {
	setupTestDB(t)

	cust := models.User{ID: "usr-cust-all", Name: "Customer All", Email: "custall@test.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "usr-admin-all", Name: "Admin All", Email: "adminall@test.com", Role: "Admin", IsAdmin: true}

	tokenCust, _ := middleware.GenerateToken(cust)
	tokenAdmin, _ := middleware.GenerateToken(admin)

	// 1. Anonymous request -> 401 Unauthorized
	reqAnon := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	wAnon := httptest.NewRecorder()
	handlers.UsersHandler(wAnon, reqAnon)

	if wAnon.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for anonymous GET /api/users, got %d", wAnon.Code)
	}

	// 2. Customer request -> 403 Forbidden
	reqCust := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	reqCust.Header.Set("Authorization", "Bearer "+tokenCust)
	wCust := httptest.NewRecorder()
	handlers.UsersHandler(wCust, reqCust)

	if wCust.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for customer GET /api/users, got %d", wCust.Code)
	}

	// 3. Admin request -> 200 OK
	reqAdmin := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wAdmin := httptest.NewRecorder()
	handlers.UsersHandler(wAdmin, reqAdmin)

	if wAdmin.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for admin GET /api/users, got %d: %s", wAdmin.Code, wAdmin.Body.String())
	}

	var users []models.User
	if err := json.Unmarshal(wAdmin.Body.Bytes(), &users); err != nil {
		t.Fatalf("Failed to decode users list: %v", err)
	}
	if len(users) == 0 {
		t.Errorf("Expected seeded users list, got 0")
	}
}

func TestUsersHandler_GetByIDIsolation(t *testing.T) {
	setupTestDB(t)

	// Seed two distinct users in DB
	if _, err := database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"u-alice", "Alice", "alice@example.com", "hash", 0, "Customer", 0, "2026-01-01T00:00:00Z",
	); err != nil {
		t.Fatalf("Failed to insert alice: %v", err)
	}
	if _, err := database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"u-bob", "Bob", "bob@example.com", "hash", 0, "Customer", 0, "2026-01-01T00:00:00Z",
	); err != nil {
		t.Fatalf("Failed to insert bob: %v", err)
	}

	userAlice := models.User{ID: "u-alice", Name: "Alice", Email: "alice@example.com", Role: "Customer", IsAdmin: false}
	userBob := models.User{ID: "u-bob", Name: "Bob", Email: "bob@example.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "admin-001", Name: "Admin", Email: "admin@semarket.com", Role: "Admin", IsAdmin: true}

	tokenAlice, _ := middleware.GenerateToken(userAlice)
	tokenAdmin, _ := middleware.GenerateToken(admin)
	_ = userBob

	// 1. Anonymous request -> 401
	reqAnon := httptest.NewRequest(http.MethodGet, "/api/users/u-alice", nil)
	wAnon := httptest.NewRecorder()
	handlers.UsersHandler(wAnon, reqAnon)
	if wAnon.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 for anonymous GET /api/users/u-alice, got %d", wAnon.Code)
	}

	// 2. Alice accessing Bob's profile -> 403 Forbidden (Anti-IDOR)
	reqAliceToBob := httptest.NewRequest(http.MethodGet, "/api/users/u-bob", nil)
	reqAliceToBob.Header.Set("Authorization", "Bearer "+tokenAlice)
	wAliceToBob := httptest.NewRecorder()
	handlers.UsersHandler(wAliceToBob, reqAliceToBob)
	if wAliceToBob.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for Alice accessing Bob's profile, got %d", wAliceToBob.Code)
	}

	// 3. Alice accessing her own profile -> 200 OK
	reqAliceToSelf := httptest.NewRequest(http.MethodGet, "/api/users/u-alice", nil)
	reqAliceToSelf.Header.Set("Authorization", "Bearer "+tokenAlice)
	wAliceToSelf := httptest.NewRecorder()
	handlers.UsersHandler(wAliceToSelf, reqAliceToSelf)
	if wAliceToSelf.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for Alice accessing her own profile, got %d", wAliceToSelf.Code)
	}

	// 4. Admin accessing Alice's profile -> 200 OK
	reqAdminToAlice := httptest.NewRequest(http.MethodGet, "/api/users/u-alice", nil)
	reqAdminToAlice.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wAdminToAlice := httptest.NewRecorder()
	handlers.UsersHandler(wAdminToAlice, reqAdminToAlice)
	if wAdminToAlice.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for Admin accessing Alice's profile, got %d", wAdminToAlice.Code)
	}

	// 5. Admin accessing non-existent user -> 404 Not Found
	reqAdminNotFound := httptest.NewRequest(http.MethodGet, "/api/users/non-existent-user-999", nil)
	reqAdminNotFound.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wAdminNotFound := httptest.NewRecorder()
	handlers.UsersHandler(wAdminNotFound, reqAdminNotFound)
	if wAdminNotFound.Code != http.StatusNotFound {
		t.Errorf("Expected 404 for non-existent user, got %d", wAdminNotFound.Code)
	}
}

func TestUsersHandler_UpdateSecurityAndPrivilegeEscalation(t *testing.T) {
	setupTestDB(t)

	if _, err := database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"u-charlie", "Charlie", "charlie@example.com", "hash", 0, "Customer", 0, "2026-01-01T00:00:00Z",
	); err != nil {
		t.Fatalf("Failed to insert charlie: %v", err)
	}
	if _, err := database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"u-david", "David", "david@example.com", "hash", 0, "Customer", 0, "2026-01-01T00:00:00Z",
	); err != nil {
		t.Fatalf("Failed to insert david: %v", err)
	}

	userCharlie := models.User{ID: "u-charlie", Name: "Charlie", Email: "charlie@example.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "admin-001", Name: "Admin", Email: "admin@semarket.com", Role: "Admin", IsAdmin: true}

	tokenCharlie, _ := middleware.GenerateToken(userCharlie)
	tokenAdmin, _ := middleware.GenerateToken(admin)

	// 1. Charlie attempts to update David's profile -> 403 Forbidden
	payloadDavid := map[string]any{"name": "Hacked David"}
	bDavid, _ := json.Marshal(payloadDavid)
	reqCharlieToDavid := httptest.NewRequest(http.MethodPut, "/api/users/u-david", bytes.NewReader(bDavid))
	reqCharlieToDavid.Header.Set("Authorization", "Bearer "+tokenCharlie)
	reqCharlieToDavid.Header.Set("Content-Type", "application/json")
	wCharlieToDavid := httptest.NewRecorder()
	handlers.UsersHandler(wCharlieToDavid, reqCharlieToDavid)

	if wCharlieToDavid.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when customer edits another user, got %d", wCharlieToDavid.Code)
	}

	// 2. Charlie attempts privilege escalation on own profile (setting isAdmin: true, role: "Admin", isVIP: true)
	payloadEscalate := map[string]any{
		"name":    "Charlie Updated",
		"email":   "charlie_new@example.com",
		"isAdmin": true,
		"role":    "Admin",
		"isVIP":   true,
	}
	bEscalate, _ := json.Marshal(payloadEscalate)
	reqEscalate := httptest.NewRequest(http.MethodPut, "/api/users/u-charlie", bytes.NewReader(bEscalate))
	reqEscalate.Header.Set("Authorization", "Bearer "+tokenCharlie)
	reqEscalate.Header.Set("Content-Type", "application/json")
	wEscalate := httptest.NewRecorder()
	handlers.UsersHandler(wEscalate, reqEscalate)

	if wEscalate.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for Charlie updating name/email, got %d: %s", wEscalate.Code, wEscalate.Body.String())
	}

	// Check database: Name updated, but isAdmin, role, isVIP MUST NOT change
	var nameInDB, roleInDB string
	var isAdminInDB, isVIPInDB int
	_ = database.DB.QueryRow(
		database.Rebind("SELECT name, role, is_admin, is_vip FROM users WHERE id = ?"),
		"u-charlie",
	).Scan(&nameInDB, &roleInDB, &isAdminInDB, &isVIPInDB)

	if nameInDB != "Charlie Updated" {
		t.Errorf("Expected name 'Charlie Updated', got '%s'", nameInDB)
	}
	if roleInDB != "Customer" || isAdminInDB != 0 || isVIPInDB != 0 {
		t.Errorf("PRIVILEGE ESCALATION VULNERABILITY DETECTED! role=%s, isAdmin=%d, isVIP=%d", roleInDB, isAdminInDB, isVIPInDB)
	}

	// 3. Admin updates Charlie to VIP and Admin role -> Allowed (200 OK)
	payloadAdminEdit := map[string]any{
		"isVIP":   true,
		"role":    "Admin",
		"isAdmin": true,
	}
	bAdminEdit, _ := json.Marshal(payloadAdminEdit)
	reqAdminEdit := httptest.NewRequest(http.MethodPut, "/api/users/u-charlie", bytes.NewReader(bAdminEdit))
	reqAdminEdit.Header.Set("Authorization", "Bearer "+tokenAdmin)
	reqAdminEdit.Header.Set("Content-Type", "application/json")
	wAdminEdit := httptest.NewRecorder()
	handlers.UsersHandler(wAdminEdit, reqAdminEdit)

	if wAdminEdit.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for Admin updating customer, got %d: %s", wAdminEdit.Code, wAdminEdit.Body.String())
	}

	_ = database.DB.QueryRow(
		database.Rebind("SELECT role, is_admin, is_vip FROM users WHERE id = ?"),
		"u-charlie",
	).Scan(&roleInDB, &isAdminInDB, &isVIPInDB)
	if roleInDB != "Admin" || isAdminInDB != 1 || isVIPInDB != 1 {
		t.Errorf("Expected Admin to be able to promote user, got role=%s, isAdmin=%d, isVIP=%d", roleInDB, isAdminInDB, isVIPInDB)
	}

	// 4. Admin tries to demote self -> 400 Bad Request
	payloadSelfDemote := map[string]any{"role": "Customer", "isAdmin": false}
	bSelfDemote, _ := json.Marshal(payloadSelfDemote)
	reqSelfDemote := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/users/%s", admin.ID), bytes.NewReader(bSelfDemote))
	reqSelfDemote.Header.Set("Authorization", "Bearer "+tokenAdmin)
	reqSelfDemote.Header.Set("Content-Type", "application/json")
	wSelfDemote := httptest.NewRecorder()
	handlers.UsersHandler(wSelfDemote, reqSelfDemote)

	if wSelfDemote.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request when Admin tries to revoke own admin role, got %d", wSelfDemote.Code)
	}
}

func TestUsersHandler_DeleteSecurity(t *testing.T) {
	setupTestDB(t)

	if _, err := database.DB.Exec(
		database.Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
		"u-eva", "Eva", "eva@example.com", "hash", 0, "Customer", 0, "2026-01-01T00:00:00Z",
	); err != nil {
		t.Fatalf("Failed to insert eva: %v", err)
	}

	userEva := models.User{ID: "u-eva", Name: "Eva", Email: "eva@example.com", Role: "Customer", IsAdmin: false}
	admin := models.User{ID: "admin-001", Name: "Admin", Email: "admin@semarket.com", Role: "Admin", IsAdmin: true}

	tokenEva, _ := middleware.GenerateToken(userEva)
	tokenAdmin, _ := middleware.GenerateToken(admin)

	// 1. Customer attempts to delete an account -> 403 Forbidden
	reqCustDel := httptest.NewRequest(http.MethodDelete, "/api/users/u-eva", nil)
	reqCustDel.Header.Set("Authorization", "Bearer "+tokenEva)
	wCustDel := httptest.NewRecorder()
	handlers.UsersHandler(wCustDel, reqCustDel)

	if wCustDel.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden when customer attempts deletion, got %d", wCustDel.Code)
	}

	// 2. Admin attempts to delete own account -> 400 Bad Request
	reqAdminSelfDel := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/users/%s", admin.ID), nil)
	reqAdminSelfDel.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wAdminSelfDel := httptest.NewRecorder()
	handlers.UsersHandler(wAdminSelfDel, reqAdminSelfDel)

	if wAdminSelfDel.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request when admin tries to delete own account, got %d", wAdminSelfDel.Code)
	}

	// 3. Admin deletes customer account -> 200 OK
	reqAdminDel := httptest.NewRequest(http.MethodDelete, "/api/users/u-eva", nil)
	reqAdminDel.Header.Set("Authorization", "Bearer "+tokenAdmin)
	wAdminDel := httptest.NewRecorder()
	handlers.UsersHandler(wAdminDel, reqAdminDel)

	if wAdminDel.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for admin deleting customer, got %d: %s", wAdminDel.Code, wAdminDel.Body.String())
	}

	// Verify user is gone from DB
	var count int
	_ = database.DB.QueryRow(database.Rebind("SELECT COUNT(*) FROM users WHERE id = ?"), "u-eva").Scan(&count)
	if count != 0 {
		t.Errorf("Expected user u-eva to be deleted from database, but record still exists")
	}
}
