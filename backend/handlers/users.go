package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func UsersHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/users")
	path = strings.TrimPrefix(path, "/")
	id := path

	if id != "" {
		handleSingleUser(w, r, id)
		return
	}

	if r.Method == http.MethodGet {
		getAllUsers(w, r)
		return
	}

	middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
}

func handleSingleUser(w http.ResponseWriter, r *http.Request, id string) {
	switch r.Method {
	case http.MethodGet:
		getUserByID(w, r, id)
	case http.MethodPut:
		updateUser(w, r, id)
	case http.MethodDelete:
		deleteUser(w, r, id)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getAllUsers(w http.ResponseWriter, _ *http.Request) {
	rows, err := database.DB.Query("SELECT id, name, email, is_admin, role, is_vip, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query users: "+err.Error())
		return
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		var isAdminInt, isVIPInt int
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &isAdminInt, &u.Role, &isVIPInt, &u.CreatedAt); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to scan user: "+err.Error())
			return
		}
		u.IsAdmin = isAdminInt == 1
		u.IsVIP = isVIPInt == 1
		u.IDAlias = u.ID
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading users: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusOK, users)
}

func getUserByID(w http.ResponseWriter, _ *http.Request, id string) {
	var u models.User
	var isAdminInt, isVIPInt int
	err := database.DB.QueryRow(
		database.Rebind("SELECT id, name, email, is_admin, role, is_vip, created_at FROM users WHERE id = ?"),
		id,
	).Scan(&u.ID, &u.Name, &u.Email, &isAdminInt, &u.Role, &isVIPInt, &u.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "User not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to query user: "+err.Error())
		return
	}

	u.IsAdmin = isAdminInt == 1
	u.IsVIP = isVIPInt == 1
	u.IDAlias = u.ID
	middleware.JSON(w, http.StatusOK, u)
}

func updateUser(w http.ResponseWriter, r *http.Request, id string) {
	var existing models.User
	var isAdminInt, isVIPInt int
	err := database.DB.QueryRow(
		database.Rebind("SELECT id, name, email, is_admin, role, is_vip, created_at FROM users WHERE id = ?"),
		id,
	).Scan(&existing.ID, &existing.Name, &existing.Email, &isAdminInt, &existing.Role, &isVIPInt, &existing.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "User not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}
	existing.IsAdmin = isAdminInt == 1
	existing.IsVIP = isVIPInt == 1

	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if name, ok := updates["name"].(string); ok && name != "" {
		existing.Name = name
	}
	if email, ok := updates["email"].(string); ok && email != "" {
		existing.Email = email
	}
	if role, ok := updates["role"].(string); ok && role != "" {
		existing.Role = role
	}
	if isAdmin, ok := updates["isAdmin"].(bool); ok {
		existing.IsAdmin = isAdmin
	}
	if isVIP, ok := updates["isVIP"].(bool); ok {
		existing.IsVIP = isVIP
	}

	newAdminInt := 0
	if existing.IsAdmin {
		newAdminInt = 1
	}
	newVIPInt := 0
	if existing.IsVIP {
		newVIPInt = 1
	}

	_, err = database.DB.Exec(
		database.Rebind("UPDATE users SET name = ?, email = ?, role = ?, is_admin = ?, is_vip = ? WHERE id = ?"),
		existing.Name, existing.Email, existing.Role, newAdminInt, newVIPInt, id,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to update user: "+err.Error())
		return
	}

	existing.IDAlias = existing.ID
	middleware.JSON(w, http.StatusOK, existing)
}

func deleteUser(w http.ResponseWriter, _ *http.Request, id string) {
	result, err := database.DB.Exec(database.Rebind("DELETE FROM users WHERE id = ?"), id)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to delete user: "+err.Error())
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.Error(w, http.StatusNotFound, "User not found")
		return
	}

	middleware.JSON(w, http.StatusOK, map[string]any{"success": true})
}
