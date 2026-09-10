package models

type Product struct {
	ID            string  `json:"_id"`
	IDAlias       string  `json:"id,omitempty"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"originalPrice"`
	Category      string  `json:"category"`
	Image         string  `json:"image"`
	Stock         int     `json:"stock"`
	Rating        float64 `json:"rating"`
	Sold          int     `json:"sold"`
	Description   string  `json:"description"`
	IsFlashSale   bool    `json:"isFlashSale"`
	CreatedAt     string  `json:"createdAt,omitempty"`
}

type OrderItem struct {
	ProductID string  `json:"productId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Qty       int     `json:"qty"`
}

type Order struct {
	ID            string      `json:"_id"`
	IDAlias       string      `json:"id,omitempty"`
	CustomerID    string      `json:"customerId"`
	CustomerName  string      `json:"customerName"`
	CustomerEmail string      `json:"customerEmail"`
	Items         []OrderItem `json:"items"`
	Total         float64     `json:"total"`
	Status        string      `json:"status"` // Processing, Shipped, Delivered, Cancelled
	Timestamp     string      `json:"timestamp"`
}

type User struct {
	ID           string `json:"_id"`
	IDAlias      string `json:"id,omitempty"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
	IsAdmin      bool   `json:"isAdmin"`
	Role         string `json:"role"` // Admin, Customer
	IsVIP        bool   `json:"isVIP"`
	CreatedAt    string `json:"createdAt"`
	Token        string `json:"token,omitempty"`
}

type Coupon struct {
	ID          string  `json:"_id"`
	IDAlias     string  `json:"id,omitempty"`
	Code        string  `json:"code"`
	Type        string  `json:"type"` // percentage, fixed
	Value       float64 `json:"value"`
	Active      bool    `json:"active"`
	Description string  `json:"description"`
}

type TopSellerItem struct {
	Name string `json:"name"`
	Qty  int    `json:"qty"`
}

type CustomerInsight struct {
	ID         string  `json:"_id"`
	Name       string  `json:"name"`
	Email      string  `json:"email"`
	IsAdmin    bool    `json:"isAdmin"`
	Role       string  `json:"role"`
	IsVIP      bool    `json:"isVIP"`
	OrderCount int     `json:"orderCount"`
	TotalSpent float64 `json:"totalSpent"`
}

type AnalyticsSummary struct {
	TotalRevenue  float64 `json:"totalRevenue"`
	OrderCount    int     `json:"orderCount"`
	ProductCount  int     `json:"productCount"`
	CustomerCount int     `json:"customerCount"`
}

type AnalyticsOverview struct {
	CategoryDistribution map[string]int    `json:"categoryDistribution"`
	TopSellers           []TopSellerItem   `json:"topSellers"`
	CustomerInsights     []CustomerInsight `json:"customerInsights"`
	Summary              AnalyticsSummary  `json:"summary"`
}
