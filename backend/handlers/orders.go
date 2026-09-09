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

func getAllOrders(w http.ResponseWriter, _ *http.Request) {
	rows, err := database.DB.Query(
		`SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp 
		 FROM orders ORDER BY timestamp DESC`,
	)
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

	middleware.JSON(w, http.StatusOK, orders)
}

func getOrderByID(w http.ResponseWriter, _ *http.Request, id string) {
	var o models.Order
	var itemsJSON string
	err := database.DB.QueryRow(
		`SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp 
		 FROM orders WHERE id = ?`,
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

	_ = json.Unmarshal([]byte(itemsJSON), &o.Items)
	o.IDAlias = o.ID
	middleware.JSON(w, http.StatusOK, o)
}

func createOrder(w http.ResponseWriter, r *http.Request) {
	var o models.Order
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
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

	_, err = tx.Exec(
		`INSERT INTO orders (id, customer_id, customer_name, customer_email, items_json, total, status, timestamp) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		o.ID, o.CustomerID, o.CustomerName, o.CustomerEmail, string(itemsBytes), o.Total, o.Status, o.Timestamp,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to insert order: "+err.Error())
		return
	}

	// Reduce stock and increase sold count for products in cart
	for _, item := range o.Items {
		if item.ProductID != "" && item.Qty > 0 {
			_, _ = tx.Exec(
				`UPDATE products SET stock = MAX(0, stock - ?), sold = sold + ? WHERE id = ?`,
				item.Qty, item.Qty, item.ProductID,
			)
		}
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

	result, err := database.DB.Exec("UPDATE orders SET status = ? WHERE id = ?", status, id)
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

func deleteOrder(w http.ResponseWriter, _ *http.Request, id string) {
	result, err := database.DB.Exec("DELETE FROM orders WHERE id = ?", id)
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

	log.Printf("🗑️ [ORDER DELETED/CANCELLED] ID: %s", id)

	middleware.JSON(w, http.StatusOK, map[string]any{"success": true})
}
