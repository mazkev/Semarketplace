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

func GroupBuysHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/group-buys")
	path = strings.TrimPrefix(path, "/")
	parts := strings.Split(path, "/")

	if len(parts) == 1 && parts[0] != "" {
		id := parts[0]
		if r.Method == http.MethodGet {
			getGroupBuyByID(w, r, id)
			return
		}
	} else if len(parts) == 2 && parts[1] == "join" {
		id := parts[0]
		if r.Method == http.MethodPost {
			joinGroupBuy(w, r, id)
			return
		}
	}

	switch r.Method {
	case http.MethodGet:
		getGroupBuys(w, r)
	case http.MethodPost:
		createGroupBuy(w, r)
	default:
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getGroupBuys(w http.ResponseWriter, r *http.Request) {
	productID := strings.TrimSpace(r.URL.Query().Get("productId"))
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	if status == "" {
		status = "open"
	}

	var rows *sql.Rows
	var err error

	baseQuery := `SELECT g.id, g.product_id, g.host_user_id, g.host_user_name, g.group_price, 
	                     g.required_members, g.current_members, g.status, g.expires_at, g.created_at,
	                     p.name, p.image, p.price
	              FROM group_buys g
	              LEFT JOIN products p ON g.product_id = p.id`

	if productID != "" {
		query := database.Rebind(baseQuery + " WHERE g.product_id = ? AND g.status = ? ORDER BY g.created_at DESC")
		rows, err = database.DB.Query(query, productID, status)
	} else {
		query := database.Rebind(baseQuery + " WHERE g.status = ? ORDER BY g.created_at DESC")
		rows, err = database.DB.Query(query, status)
	}

	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal mengambil data Beli Bareng: "+err.Error())
		return
	}
	defer rows.Close()

	list := make([]models.GroupBuy, 0)
	for rows.Next() {
		var gb models.GroupBuy
		var pName, pImg sql.NullString
		var pPrice sql.NullFloat64

		if err := rows.Scan(
			&gb.ID, &gb.ProductID, &gb.HostUserID, &gb.HostUserName, &gb.GroupPrice,
			&gb.RequiredMembers, &gb.CurrentMembers, &gb.Status, &gb.ExpiresAt, &gb.CreatedAt,
			&pName, &pImg, &pPrice,
		); err != nil {
			continue
		}

		if pName.Valid {
			gb.ProductName = pName.String
		}
		if pImg.Valid {
			gb.ProductImage = pImg.String
		}
		if pPrice.Valid {
			gb.OriginalPrice = pPrice.Float64
		}
		gb.IDAlias = gb.ID

		// Load members
		mRows, mErr := database.DB.Query(database.Rebind("SELECT id, group_buy_id, user_id, user_name, order_id, joined_at FROM group_buy_members WHERE group_buy_id = ?"), gb.ID)
		if mErr == nil {
			members := make([]models.GroupBuyMember, 0)
			for mRows.Next() {
				var m models.GroupBuyMember
				if err := mRows.Scan(&m.ID, &m.GroupBuyID, &m.UserID, &m.UserName, &m.OrderID, &m.JoinedAt); err == nil {
					members = append(members, m)
				}
			}
			mRows.Close()
			gb.Members = members
		}

		list = append(list, gb)
	}

	middleware.JSON(w, http.StatusOK, list)
}

func getGroupBuyByID(w http.ResponseWriter, _ *http.Request, id string) {
	var gb models.GroupBuy
	var pName, pImg sql.NullString
	var pPrice sql.NullFloat64

	query := database.Rebind(`SELECT g.id, g.product_id, g.host_user_id, g.host_user_name, g.group_price, 
	                                 g.required_members, g.current_members, g.status, g.expires_at, g.created_at,
	                                 p.name, p.image, p.price
	                          FROM group_buys g
	                          LEFT JOIN products p ON g.product_id = p.id
	                          WHERE g.id = ?`)
	err := database.DB.QueryRow(query, id).Scan(
		&gb.ID, &gb.ProductID, &gb.HostUserID, &gb.HostUserName, &gb.GroupPrice,
		&gb.RequiredMembers, &gb.CurrentMembers, &gb.Status, &gb.ExpiresAt, &gb.CreatedAt,
		&pName, &pImg, &pPrice,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Tim Beli Bareng tidak ditemukan")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	if pName.Valid {
		gb.ProductName = pName.String
	}
	if pImg.Valid {
		gb.ProductImage = pImg.String
	}
	if pPrice.Valid {
		gb.OriginalPrice = pPrice.Float64
	}
	gb.IDAlias = gb.ID

	// Load members
	mRows, mErr := database.DB.Query(database.Rebind("SELECT id, group_buy_id, user_id, user_name, order_id, joined_at FROM group_buy_members WHERE group_buy_id = ?"), gb.ID)
	if mErr == nil {
		members := make([]models.GroupBuyMember, 0)
		for mRows.Next() {
			var m models.GroupBuyMember
			if err := mRows.Scan(&m.ID, &m.GroupBuyID, &m.UserID, &m.UserName, &m.OrderID, &m.JoinedAt); err == nil {
				members = append(members, m)
			}
		}
		mRows.Close()
		gb.Members = members
	}

	middleware.JSON(w, http.StatusOK, gb)
}

func createGroupBuy(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Login diperlukan untuk membuka tim Beli Bareng")
		return
	}

	var req struct {
		ProductID  string  `json:"productId"`
		GroupPrice float64 `json:"groupPrice"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.ProductID) == "" {
		middleware.Error(w, http.StatusBadRequest, "Product ID wajib diisi")
		return
	}

	// Fetch product details
	var pName, pImg string
	var origPrice float64
	err := database.DB.QueryRow(
		database.Rebind("SELECT name, image, price FROM products WHERE id = ?"),
		req.ProductID,
	).Scan(&pName, &pImg, &origPrice)
	if err != nil {
		middleware.Error(w, http.StatusNotFound, "Produk tidak ditemukan")
		return
	}

	// Determine group price: default to 75% of original if not specified
	groupPrice := req.GroupPrice
	if groupPrice <= 0 || groupPrice >= origPrice {
		groupPrice = origPrice * 0.75
	}

	now := time.Now().UTC()
	expiresAt := now.Add(24 * time.Hour).Format(time.RFC3339)
	gbID := fmt.Sprintf("gb-%d", now.UnixMilli())
	memberID := fmt.Sprintf("gbm-%d", now.UnixMilli())

	hostName := claims.Email
	var uName string
	_ = database.DB.QueryRow(database.Rebind("SELECT name FROM users WHERE id = ?"), claims.UserID).Scan(&uName)
	if uName != "" {
		hostName = uName
	}

	tx, err := database.DB.Begin()
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal memulai transaksi: "+err.Error())
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		database.Rebind(`INSERT INTO group_buys (id, product_id, host_user_id, host_user_name, group_price, required_members, current_members, status, expires_at, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
		gbID, req.ProductID, claims.UserID, hostName, groupPrice, 2, 1, "open", expiresAt, now.Format(time.RFC3339),
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal membuat tim Beli Bareng: "+err.Error())
		return
	}

	_, err = tx.Exec(
		database.Rebind(`INSERT INTO group_buy_members (id, group_buy_id, user_id, user_name, order_id, joined_at)
		 VALUES (?, ?, ?, ?, ?, ?)`),
		memberID, gbID, claims.UserID, hostName, "", now.Format(time.RFC3339),
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal mendaftarkan host ke tim: "+err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal commit tim: "+err.Error())
		return
	}

	gb := models.GroupBuy{
		ID:              gbID,
		IDAlias:         gbID,
		ProductID:       req.ProductID,
		ProductName:     pName,
		ProductImage:    pImg,
		GroupPrice:      groupPrice,
		OriginalPrice:   origPrice,
		HostUserID:      claims.UserID,
		HostUserName:    hostName,
		RequiredMembers: 2,
		CurrentMembers:  1,
		Status:          "open",
		ExpiresAt:       expiresAt,
		CreatedAt:       now.Format(time.RFC3339),
		Members: []models.GroupBuyMember{
			{
				ID:         memberID,
				GroupBuyID: gbID,
				UserID:     claims.UserID,
				UserName:   hostName,
				JoinedAt:   now.Format(time.RFC3339),
			},
		},
	}

	middleware.JSON(w, http.StatusCreated, gb)
}

func joinGroupBuy(w http.ResponseWriter, r *http.Request, groupBuyID string) {
	claims := middleware.GetClaims(r)
	if claims == nil {
		middleware.Error(w, http.StatusUnauthorized, "Login diperlukan untuk bergabung ke tim Beli Bareng")
		return
	}

	var gb models.GroupBuy
	err := database.DB.QueryRow(
		database.Rebind("SELECT id, product_id, current_members, required_members, status FROM group_buys WHERE id = ?"),
		groupBuyID,
	).Scan(&gb.ID, &gb.ProductID, &gb.CurrentMembers, &gb.RequiredMembers, &gb.Status)
	if err != nil {
		if err == sql.ErrNoRows {
			middleware.Error(w, http.StatusNotFound, "Tim Beli Bareng tidak ditemukan")
			return
		}
		middleware.Error(w, http.StatusInternalServerError, "Database error: "+err.Error())
		return
	}

	if gb.Status != "open" {
		middleware.Error(w, http.StatusBadRequest, "Tim Beli Bareng ini sudah penuh atau tidak aktif")
		return
	}

	// Check if user is already a member
	var existingMember int
	_ = database.DB.QueryRow(
		database.Rebind("SELECT COUNT(*) FROM group_buy_members WHERE group_buy_id = ? AND user_id = ?"),
		groupBuyID, claims.UserID,
	).Scan(&existingMember)
	if existingMember > 0 {
		middleware.Error(w, http.StatusBadRequest, "Anda sudah bergabung dalam tim ini")
		return
	}

	memberName := claims.Email
	var uName string
	_ = database.DB.QueryRow(database.Rebind("SELECT name FROM users WHERE id = ?"), claims.UserID).Scan(&uName)
	if uName != "" {
		memberName = uName
	}

	now := time.Now().UTC()
	memberID := fmt.Sprintf("gbm-%d", now.UnixMilli())
	newCount := gb.CurrentMembers + 1
	newStatus := "open"
	if newCount >= gb.RequiredMembers {
		newStatus = "completed"
	}

	tx, err := database.DB.Begin()
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal memulai transaksi: "+err.Error())
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		database.Rebind("INSERT INTO group_buy_members (id, group_buy_id, user_id, user_name, order_id, joined_at) VALUES (?, ?, ?, ?, ?, ?)"),
		memberID, groupBuyID, claims.UserID, memberName, "", now.Format(time.RFC3339),
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal bergabung ke tim: "+err.Error())
		return
	}

	_, err = tx.Exec(
		database.Rebind("UPDATE group_buys SET current_members = ?, status = ? WHERE id = ?"),
		newCount, newStatus, groupBuyID,
	)
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal update status tim: "+err.Error())
		return
	}

	if err := tx.Commit(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Gagal commit join tim: "+err.Error())
		return
	}

	middleware.JSON(w, http.StatusOK, map[string]any{
		"message":        "Berhasil bergabung ke tim Beli Bareng!",
		"groupBuyId":     groupBuyID,
		"currentMembers": newCount,
		"status":         newStatus,
	})
}
