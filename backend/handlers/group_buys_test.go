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

func TestGroupBuys_CreateAndList(t *testing.T) {
	setupTestDB(t)

	// User 1 creates a new group buy team
	user1 := models.User{ID: "usr-gb-1", Name: "Andi Wijaya", Email: "andi@test.com", Role: "Customer"}
	token1, _ := middleware.GenerateToken(user1)

	payload := map[string]any{
		"productId":  "2", // Seeded Mens Casual Slim Fit T-Shirts
		"groupPrice": 160000.0,
	}
	b, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/group-buys", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+token1)
	w := httptest.NewRecorder()

	handlers.GroupBuysHandler(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	var created models.GroupBuy
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if created.ProductID != "2" || created.GroupPrice != 160000.0 || created.HostUserID != "usr-gb-1" {
		t.Errorf("Unexpected created team: %+v", created)
	}
	if created.CurrentMembers != 1 || created.RequiredMembers != 2 || created.Status != "open" {
		t.Errorf("Unexpected member count or status: %+v", created)
	}

	// Fetch via GET /api/group-buys?productId=2
	reqList := httptest.NewRequest(http.MethodGet, "/api/group-buys?productId=2", nil)
	wList := httptest.NewRecorder()
	handlers.GroupBuysHandler(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK listing group buys, got %d: %s", wList.Code, wList.Body.String())
	}

	var list []models.GroupBuy
	_ = json.Unmarshal(wList.Body.Bytes(), &list)
	if len(list) == 0 {
		t.Fatalf("Expected at least 1 group buy for product 2, got 0")
	}

	// Verify details
	found := false
	for _, item := range list {
		if item.ID == created.ID {
			found = true
			if len(item.Members) != 1 || item.Members[0].UserID != "usr-gb-1" {
				t.Errorf("Expected host to be in members list: %+v", item.Members)
			}
		}
	}
	if !found {
		t.Errorf("Created group buy ID %s not found in list", created.ID)
	}
}

func TestGroupBuys_JoinAndCompletion(t *testing.T) {
	setupTestDB(t)

	// User 1 creates team
	user1 := models.User{ID: "usr-gb-host", Name: "Host User", Email: "host@test.com", Role: "Customer"}
	token1, _ := middleware.GenerateToken(user1)

	payload := map[string]any{
		"productId":  "3",
		"groupPrice": 400000.0,
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/group-buys", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+token1)
	w := httptest.NewRecorder()
	handlers.GroupBuysHandler(w, req)

	var created models.GroupBuy
	_ = json.Unmarshal(w.Body.Bytes(), &created)

	// User 2 joins team
	user2 := models.User{ID: "usr-gb-joiner", Name: "Joiner User", Email: "joiner@test.com", Role: "Customer"}
	token2, _ := middleware.GenerateToken(user2)

	reqJoin := httptest.NewRequest(http.MethodPost, "/api/group-buys/"+created.ID+"/join", nil)
	reqJoin.Header.Set("Authorization", "Bearer "+token2)
	wJoin := httptest.NewRecorder()
	handlers.GroupBuysHandler(wJoin, reqJoin)

	if wJoin.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on join, got %d: %s", wJoin.Code, wJoin.Body.String())
	}

	var joinRes map[string]any
	_ = json.Unmarshal(wJoin.Body.Bytes(), &joinRes)
	if joinRes["status"] != "completed" {
		t.Errorf("Expected team status to become 'completed', got %v", joinRes["status"])
	}

	// Verify User 2 cannot join again (duplicate check)
	reqDup := httptest.NewRequest(http.MethodPost, "/api/group-buys/"+created.ID+"/join", nil)
	reqDup.Header.Set("Authorization", "Bearer "+token2)
	wDup := httptest.NewRecorder()
	handlers.GroupBuysHandler(wDup, reqDup)

	if wDup.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request on duplicate join, got %d: %s", wDup.Code, wDup.Body.String())
	}
}
