package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func CouponsHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/coupons")
	path = strings.TrimPrefix(path, "/")

	if path == "validate" && r.Method == http.MethodPost {
		validateCoupon(w, r)
		return
	}

	id := path
	if id != "" {
		if r.Method == http.MethodDelete {
			deleteCoupon(w, r, id)
			return
		}
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	switch r.Method {
	case http.MethodGet:
		getAllCoupons(w, r)
	case http.MethodPost:
		createCoupon(w, r)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getAllCoupons(w http.ResponseWriter, _ *http.Request) {
	rows, err := database.DB.Query("SELECT id, code, type, value, active, description FROM coupons ORDER BY id DESC")
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query coupons: "+err.Error())
		return
	}
	defer rows.Close()

	coupons := make([]models.Coupon, 0)
	for rows.Next() {
		var c models.Coupon
		var activeInt int
		if err := rows.Scan(&c.ID, &c.Code, &c.Type, &c.Value, &activeInt, &c.Description); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to scan coupon: "+err.Error())
			return
		}
		c.Active = activeInt == 1
		c.IDAlias = c.ID
		coupons = append(coupons, c)
	}

	middleware.JSON(w, http.StatusOK, coupons)
}

func createCoupon(w http.ResponseWriter, r *http.Request) {
	var c models.Coupon
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	c.Code = strings.TrimSpace(strings.ToUpper(c.Code))
	if c.Code == "" {
		middleware.Error(w, http.StatusBadRequest, "Coupon code is required")
		return
	}

	if c.ID == "" {
		c.ID = fmt.Sprintf("CPN-%d", time.Now().UnixMilli())
	}
	c.IDAlias = c.ID
	c.Active = true

	activeInt := 1
	_, err := database.DB.Exec(
		"INSERT INTO coupons (id, code, type, value, active, description) VALUES (?, ?, ?, ?, ?, ?)",
		c.ID, c.Code, c.Type, c.Value, activeInt, c.Description,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to create coupon: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusCreated, c)
}

func validateCoupon(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	code := strings.TrimSpace(strings.ToUpper(req.Code))
	if code == "" {
		middleware.Error(w, http.StatusBadRequest, "No code provided")
		return
	}

	var c models.Coupon
	var activeInt int
	err := database.DB.QueryRow(
		"SELECT id, code, type, value, active, description FROM coupons WHERE code = ? AND active = 1",
		code,
	).Scan(&c.ID, &c.Code, &c.Type, &c.Value, &activeInt, &c.Description)

	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusBadRequest, "Invalid or expired coupon")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	c.Active = activeInt == 1
	c.IDAlias = c.ID
	middleware.JSON(w, http.StatusOK, c)
}

func deleteCoupon(w http.ResponseWriter, _ *http.Request, id string) {
	result, err := database.DB.Exec("DELETE FROM coupons WHERE id = ?", id)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to delete coupon: "+err.Error())
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.Error(w, http.StatusNotFound, "Coupon not found")
		return
	}

	middleware.JSON(w, http.StatusOK, map[string]any{"success": true})
}
