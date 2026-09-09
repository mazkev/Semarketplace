package handlers

import (
	"encoding/json"
	"net/http"
	"sort"

	"semarket/backend/database"
	"semarket/backend/middleware"
	"semarket/backend/models"
)

func AnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		middleware.Error(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// 1. Query products for category distribution & count
	catDist := make(map[string]int)
	var productCount int
	prodRows, err := database.DB.Query("SELECT category FROM products")
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query products: "+err.Error())
		return
	}
	defer prodRows.Close()
	for prodRows.Next() {
		var cat string
		if err := prodRows.Scan(&cat); err == nil {
			productCount++
			catDist[cat]++
		}
	}
	if err := prodRows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading products: "+err.Error())
		return
	}

	// 2. Query orders for revenue, count, top sellers, and user spend
	var totalRevenue float64
	var orderCount int
	sellerMap := make(map[string]int)
	customerSpend := make(map[string]float64)
	customerOrderCount := make(map[string]int)

	orderRows, err := database.DB.Query("SELECT customer_id, items_json, total FROM orders")
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query orders: "+err.Error())
		return
	}
	defer orderRows.Close()
	for orderRows.Next() {
		var custID, itemsJSON string
		var total float64
		if err := orderRows.Scan(&custID, &itemsJSON, &total); err == nil {
			orderCount++
			totalRevenue += total
			customerSpend[custID] += total
			customerOrderCount[custID]++

			var items []models.OrderItem
			if err := json.Unmarshal([]byte(itemsJSON), &items); err == nil {
				for _, it := range items {
					sellerMap[it.Name] += it.Qty
				}
			}
		}
	}
	if err := orderRows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading orders: "+err.Error())
		return
	}

	// Sort top sellers
	topSellers := make([]models.TopSellerItem, 0, len(sellerMap))
	for name, qty := range sellerMap {
		topSellers = append(topSellers, models.TopSellerItem{Name: name, Qty: qty})
	}
	sort.Slice(topSellers, func(i, j int) bool {
		return topSellers[i].Qty > topSellers[j].Qty
	})
	if len(topSellers) > 5 {
		topSellers = topSellers[:5]
	}

	// 3. Query users for customer insights
	customerInsights := make([]models.CustomerInsight, 0)
	var customerCount int
	userRows, err := database.DB.Query("SELECT id, name, email, is_admin, role, is_vip FROM users")
	if err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed to query users: "+err.Error())
		return
	}
	defer userRows.Close()
	for userRows.Next() {
		var u models.CustomerInsight
		var isAdminInt, isVIPInt int
		if err := userRows.Scan(&u.ID, &u.Name, &u.Email, &isAdminInt, &u.Role, &isVIPInt); err == nil {
			customerCount++
			u.IsAdmin = isAdminInt == 1
			u.TotalSpent = customerSpend[u.ID]
			u.OrderCount = customerOrderCount[u.ID]
			u.IsVIP = isVIPInt == 1 || u.TotalSpent > 5000000
			customerInsights = append(customerInsights, u)
		}
	}
	if err := userRows.Err(); err != nil {
		middleware.Error(w, http.StatusInternalServerError, "Failed reading users: "+err.Error())
		return
	}

	sort.Slice(customerInsights, func(i, j int) bool {
		return customerInsights[i].TotalSpent > customerInsights[j].TotalSpent
	})

	overview := models.AnalyticsOverview{
		CategoryDistribution: catDist,
		TopSellers:           topSellers,
		CustomerInsights:     customerInsights,
		Summary: models.AnalyticsSummary{
			TotalRevenue:  totalRevenue,
			OrderCount:    orderCount,
			ProductCount:  productCount,
			CustomerCount: customerCount,
		},
	}

	middleware.JSON(w, http.StatusOK, overview)
}
