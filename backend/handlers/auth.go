package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"

	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	IsAdmin  bool   `json:"isAdmin"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		middleware.Error(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	var u models.User
	var isAdminInt, isVIPInt int
	err := database.DB.QueryRow(
		`SELECT id, name, email, password_hash, is_admin, role, is_vip, created_at 
		 FROM users WHERE LOWER(email) = ?`,
		req.Email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &isAdminInt, &u.Role, &isVIPInt, &u.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	u.IsAdmin = isAdminInt == 1
	u.IsVIP = isVIPInt == 1
	u.IDAlias = u.ID

	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		middleware.Error(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	log.Printf("🔐 [AUTH LOGIN] Successful login: %s (Role: %s)", u.Email, u.Role)
	middleware.JSON(w, http.StatusOK, u)
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	if req.Email == "" || req.Password == "" || req.Name == "" {
		middleware.Error(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}

	var existingCount int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(email) = ?", req.Email).Scan(&existingCount)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}
	if existingCount > 0 {
		middleware.Error(w, http.StatusConflict, "Email already registered")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	role := "Customer"
	if req.IsAdmin || strings.Contains(req.Email, "admin") {
		req.IsAdmin = true
		role = "Admin"
	}

	newID := fmt.Sprintf("U-%d", time.Now().UnixMilli())
	createdAt := time.Now().UTC().Format(time.RFC3339)
	isAdminInt := 0
	if req.IsAdmin {
		isAdminInt = 1
	}

	_, err = database.DB.Exec(
		`INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		newID, req.Name, req.Email, string(hash), isAdminInt, role, 0, createdAt,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to create user: "+err.Error())
		return
	}

	user := models.User{
		ID:        newID,
		IDAlias:   newID,
		Name:      req.Name,
		Email:     req.Email,
		IsAdmin:   req.IsAdmin,
		Role:      role,
		IsVIP:     false,
		CreatedAt: createdAt,
	}

	log.Printf("📝 [AUTH REGISTER] New user created: %s (%s) [Role: %s]", user.Email, user.Name, user.Role)
	middleware.JSON(w, http.StatusCreated, user)
}
