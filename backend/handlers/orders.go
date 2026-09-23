package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func OrdersHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/orders")
	path = strings.TrimPrefix(path, "/")
	id := path

	if id != "" {
		handleSingleOrder(w, r, id)
		return
	}

	switch r.Method {
	case http.MethodGet:
		getAllOrders(w, r)
	case http.MethodPost:
		createOrder(w, r)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func handleSingleOrder(w http.ResponseWriter, r *http.Request, id string) {
	switch r.Method {
	case http.MethodGet:
		getOrderByID(w, r, id)
	case http.MethodPut:
		updateOrder(w, r, id)
	case http.MethodDelete:
		deleteOrder(w, r, id)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getAllOrders(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	limit := 100
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	var rows *sql.Rows
	var err error

	if claims.IsAdmin {
		// Admin can view all orders or filter by customerId query param
		customerID := strings.TrimSpace(r.URL.Query().Get("customerId"))
		if customerID != "" {
			query := database.Rebind(
				`SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp 
				 FROM orders WHERE customer_id = ? ORDER BY timestamp DESC LIMIT ?`,
			)
			rows, err = database.DB.Query(query, customerID, limit)
		} else {
			query := database.Rebind(
				`SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp 
				 FROM orders ORDER BY timestamp DESC LIMIT ?`,
			)
			rows, err = database.DB.Query(query, limit)
		}
	} else {
		// Non-admin customer can ONLY view their own orders
		query := database.Rebind(
			`SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp 
			 FROM orders WHERE customer_id = ? ORDER BY timestamp DESC LIMIT ?`,
		)
		rows, err = database.DB.Query(query, claims.UserID, limit)
	}

	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query orders: "+err.Error())
		return
	}
	defer rows.Close()

	orders := make([]models.Order, 0)
	for rows.Next() {
		var o models.Order
		var itemsJSON string
		if err := rows.Scan(
			&o.ID, &o.CustomerID, &o.CustomerName, &o.CustomerEmail,
			&itemsJSON, &o.Total, &o.Status, &o.Timestamp,
		); err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to scan order: "+err.Error())
			return
		}
		_ = json.Unmarshal([]byte(itemsJSON), &o.Items)
		o.IDAlias = o.ID
		orders = append(orders, o)
	}
	if err := rows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading orders: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusOK, orders)
}

func getOrderByID(w http.ResponseWriter, r *http.Request, id string) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var o models.Order
	var itemsJSON string
	err := database.DB.QueryRow(
		database.Rebind(`SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp 
		 FROM orders WHERE id = ?`),
		id,
	).Scan(
		&o.ID, &o.CustomerID, &o.CustomerName, &o.CustomerEmail,
		&itemsJSON, &o.Total, &o.Status, &o.Timestamp,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Order not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to query order: "+err.Error())
		return
	}

	// Ownership check: regular customers can only view their own order
	if !claims.IsAdmin && o.CustomerID != claims.UserID {
		middleware.Error(w, http.StatusForbidden, "Forbidden: Access denied to this order")
		return
	}

	_ = json.Unmarshal([]byte(itemsJSON), &o.Items)
	o.IDAlias = o.ID
	middleware.JSON(w, http.StatusOK, o)
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	var o models.Order
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if len(o.Items) == 0 {
		middleware.Error(w, http.StatusBadRequest, "Order must contain at least one item")
		return
	}

	// Prevent spoofing customer identity if non-admin
	if !claims.IsAdmin {
		o.CustomerID = claims.UserID
		o.CustomerEmail = claims.Email
	} else if o.CustomerID == "" {
		o.CustomerID = claims.UserID
		o.CustomerEmail = claims.Email
	}

	if o.ID == "" {
		o.ID = fmt.Sprintf("ORD-%d", time.Now().UnixMilli())
	}
	o.IDAlias = o.ID
	if o.Status == "" {
		o.Status = "Processing"
	}
	o.Timestamp = time.Now().UTC().Format(time.RFC3339)

	itemsBytes, err := json.Marshal(o.Items)
	if err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid order items")
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Transaction start error: "+err.Error())
		return
	}
	defer tx.Rollback()

	// 1. Verify stock availability and deduct atomically
	for _, item := range o.Items {
		prodID := strings.TrimSpace(item.ProductID)
		if prodID == "" {
			middleware.Error(w, http.StatusBadRequest, "Product ID is required for each item")
			return
		}
		if item.Qty <= 0 {
			middleware.Error(w, http.StatusBadRequest, fmt.Sprintf("Quantity for '%s' must be at least 1", item.Name))
			return
		}

		var prodName string
		var currentStock int
		err := tx.QueryRow(
			database.Rebind("SELECT name, stock FROM products WHERE id = ?"),
			prodID,
		).Scan(&prodName, &currentStock)
		if err != nil {
			if err == sql.ErrNoRows {
				middleware.Error(w, http.StatusBadRequest, fmt.Sprintf("Product not found: %s", prodID))
				return
			}
			middleware.Error(w, http.StatusInternalServerError, "Failed to verify product stock: "+err.Error())
			return
		}

		if currentStock < item.Qty {
			middleware.Error(w, http.StatusConflict, fmt.Sprintf("Insufficient stock for '%s' (available: %d, requested: %d)", prodName, currentStock, item.Qty))
			return
		}

		res, err := tx.Exec(
			database.Rebind("UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ? AND stock >= ?"),
			item.Qty, item.Qty, prodID, item.Qty,
		)
		if err != nil {
			middleware.Error(w, http.StatusInternalServerError, "Failed to deduct product stock: "+err.Error())
			return
		}
		rowsAffected, _ := res.RowsAffected()
		if rowsAffected == 0 {
			middleware.Error(w, http.StatusConflict, fmt.Sprintf("Stock was exhausted for '%s'", prodName))
			return
		}
	}

	// 2. Insert order record
	_, err = tx.Exec(
		database.Rebind(`INSERT INTO orders (id, customer_id, customer_name, customer_email, items_json, total, status, timestamp) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
		o.ID, o.CustomerID, o.CustomerName, o.CustomerEmail, string(itemsBytes), o.Total, o.Status, o.Timestamp,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to insert order: "+err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("❌ [ORDER ERROR] Failed to commit order %s: %v", o.ID, err)
		middleware.Error(w, http.StatusInternalServerError, "Failed to commit order: "+err.Error())
		return
	}

	log.Printf("================================================================")
	log.Printf("🛍️ [NEW TRANSACTION] Order ID: %s", o.ID)
	log.Printf("👤 Customer: %s (%s) [ID: %s]", o.CustomerName, o.CustomerEmail, o.CustomerID)
	log.Printf("💰 Total Amount: Rp %.0f | Status: %s", o.Total, o.Status)
	log.Printf("📦 Items (%d total):", len(o.Items))
	for idx, itm := range o.Items {
		log.Printf("   [%d] %s x%d @ Rp %.0f (ID: %s)", idx+1, itm.Name, itm.Qty, itm.Price, itm.ProductID)
	}
	log.Printf("🕒 Time: %s", o.Timestamp)
	log.Printf("================================================================")

	middleware.JSON(w, http.StatusCreated, o)
}

func updateOrder(w http.ResponseWriter, r *http.Request, id string) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}
	if !claims.IsAdmin {
		middleware.Error(w, http.StatusForbidden, "Forbidden: Admin privileges required to update order status")
		return
	}

	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	status, ok := updates["status"].(string)
	if !ok || status == "" {
		middleware.Error(w, http.StatusBadRequest, "Valid status is required")
		return
	}

	result, err := database.DB.Exec(database.Rebind("UPDATE orders SET status = ? WHERE id = ?"), status, id)
	if err != nil {
		log.Printf("❌ [ORDER ERROR] Failed to update order %s: %v", id, err)
		middleware.Error(w, http.StatusInternalServerError, "Failed to update order status: "+err.Error())
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.Error(w, http.StatusNotFound, "Order not found")
		return
	}

	log.Printf("🔄 [ORDER STATUS UPDATED] ID: %s -> New Status: %s", id, status)

	// Return updated order
	getOrderByID(w, r, id)
}

func deleteOrder(w http.ResponseWriter, r *http.Request, id string) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Authentication required")
		return
	}

	// Verify order existence and ownership
	var orderCustID, itemsJSON, status string
	err := database.DB.QueryRow(
		database.Rebind("SELECT customer_id, items_json, status FROM orders WHERE id = ?"),
		id,
	).Scan(&orderCustID, &itemsJSON, &status)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Order not found")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Failed to query order: "+err.Error())
		return
	}

	if !claims.IsAdmin && orderCustID != claims.UserID {
		middleware.Error(w, http.StatusForbidden, "Forbidden: You cannot delete another user's order")
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Transaction start error: "+err.Error())
		return
	}
	defer tx.Rollback()

	// Restore product stock if order was active (not already Cancelled)
	if strings.ToLower(status) != "cancelled" {
		var items []models.OrderItem
		if err := json.Unmarshal([]byte(itemsJSON), &items); err == nil {
			for _, item := range items {
				if item.ProductID != "" && item.Qty > 0 {
					_, _ = tx.Exec(
						database.Rebind("UPDATE products SET stock = stock + ?, sold = MAX(0, sold - ?) WHERE id = ?"),
						item.Qty, item.Qty, item.ProductID,
					)
				}
			}
		}
	}

	result, err := tx.Exec(database.Rebind("DELETE FROM orders WHERE id = ?"), id)
	if err != nil {
		log.Printf("❌ [ORDER ERROR] Failed to delete order %s: %v", id, err)
		middleware.Error(w, http.StatusInternalServerError, "Failed to delete order: "+err.Error())
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		middleware.Error(w, http.StatusNotFound, "Order not found")
		return
	}

	if err := tx.Commit(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to commit order deletion: "+err.Error())
		return
	}

	log.Printf("🗑️ [ORDER DELETED/CANCELLED] ID: %s by User: %s (Admin: %t)", id, claims.UserID, claims.IsAdmin)

	middleware.JSON(w, http.StatusOK, map[string]any{"success": true})
}
