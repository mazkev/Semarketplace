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
		database.Rebind(`SELECT id, name, email, password_hash, is_admin, role, is_vip, created_at 
		 FROM users WHERE LOWER(email) = ?`),
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

	token, err := middleware.GenerateToken(u)
	if err == nil {
		u.Token = token
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
	err := database.DB.QueryRow(database.Rebind("SELECT COUNT(*) FROM users WHERE LOWER(email) = ?"), req.Email).Scan(&existingCount)
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

	// Public registration is strictly for regular customers.
	// Admin accounts are provisioned via environment variables (ADMIN_EMAIL/ADMIN_PASSWORD) or database seeders.
	role := "Customer"
	isAdminInt := 0

	newID := fmt.Sprintf("U-%d", time.Now().UnixMilli())
	createdAt := time.Now().UTC().Format(time.RFC3339)

	_, err = database.DB.Exec(
		database.Rebind(`INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
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
		IsAdmin:   false,
		Role:      role,
		IsVIP:     false,
		CreatedAt: createdAt,
	}

	token, err := middleware.GenerateToken(user)
	if err == nil {
		user.Token = token
	}

	log.Printf("📝 [AUTH REGISTER] New user created: %s (%s) [Role: %s]", user.Email, user.Name, user.Role)
	middleware.JSON(w, http.StatusCreated, user)
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
	ConfirmPassword string `json:"confirmPassword"`
}

func ChangePasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	claims := middleware.GetClaims(r)
	if claims == nil {
		tokenStr := middleware.ExtractToken(r)
		if tokenStr != "" {
			claims, _ = middleware.ValidateToken(tokenStr)
		}
	}
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required to change password")
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.CurrentPassword = strings.TrimSpace(req.CurrentPassword)
	req.NewPassword = strings.TrimSpace(req.NewPassword)
	req.ConfirmPassword = strings.TrimSpace(req.ConfirmPassword)

	if req.CurrentPassword == "" || req.NewPassword == "" || req.ConfirmPassword == "" {
		middleware.Error(w, http.StatusBadRequest, "All password fields are required")
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		middleware.Error(w, http.StatusBadRequest, "New password and confirmation do not match")
		return
	}

	if len(req.NewPassword) < 6 {
		middleware.Error(w, http.StatusBadRequest, "New password must be at least 6 characters long")
		return
	}

	// Fetch current password hash from database
	var currentHash string
	err := database.DB.QueryRow(
		database.Rebind("SELECT password_hash FROM users WHERE id = ?"),
		claims.UserID,
	).Scan(&currentHash)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "User not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Current password is incorrect")
		return
	}

	// Disallow new password matching current password
	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.NewPassword)); err == nil {
		middleware.Error(w, http.StatusBadRequest, "New password cannot be the same as current password")
		return
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to hash new password")
		return
	}

	// Update password in database
	_, err = database.DB.Exec(
		database.Rebind("UPDATE users SET password_hash = ? WHERE id = ?"),
		string(newHash), claims.UserID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to update password: "+err.Error())
		return
	}

	log.Printf("🔑 [AUTH PASSWORD] Password changed successfully for user ID: %s (%s)", claims.UserID, claims.Email)
	middleware.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Password updated successfully",
	})
}
