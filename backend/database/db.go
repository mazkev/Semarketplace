package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

var (
	DB         *sql.DB
	IsPostgres bool
)

// Rebind converts '?' placeholders into PostgreSQL '$1', '$2', ... if connected to PostgreSQL.
func Rebind(query string) string {
	if !IsPostgres {
		return query
	}
	var b strings.Builder
	b.Grow(len(query) + 16)
	idx := 1
	for i := 0; i < len(query); i++ {
		if query[i] == '?' {
			b.WriteString(fmt.Sprintf("$%d", idx))
			idx++
		} else {
			b.WriteByte(query[i])
		}
	}
	return b.String()
}

func InitDB() (*sql.DB, error) {
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	var db *sql.DB
	var err error

	if databaseURL != "" {
		log.Printf("🐘 Initializing Enterprise PostgreSQL connection...")
		db, err = sql.Open("pgx", databaseURL)
		if err != nil {
			return nil, fmt.Errorf("failed to open postgres database: %w", err)
		}
		IsPostgres = true

		// Enterprise connection pool tuning
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(10)
		db.SetConnMaxLifetime(5 * time.Minute)
	} else {
		dataDir := "./data"
		if err := os.MkdirAll(dataDir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create data dir: %w", err)
		}
		dbPath := filepath.Join(dataDir, "marketplace.db")
		log.Printf("Connecting to SQLite database at: %s", dbPath)
		db, err = sql.Open("sqlite", dbPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open sqlite database: %w", err)
		}
		IsPostgres = false
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	DB = db

	if err := migrateSchema(db); err != nil {
		return nil, fmt.Errorf("failed to migrate schema: %w", err)
	}

	if IsPostgres {
		// Automatically copy data from old SQLite if PostgreSQL is empty
		AutoMigrateFromSQLite(db)
	}

	if err := seedDefaults(db); err != nil {
		log.Printf("Warning: Seeding defaults encountered error: %v", err)
	}

	syncAdminAccount(db)

	return db, nil
}

func migrateSchema(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			is_admin INTEGER NOT NULL DEFAULT 0,
			role VARCHAR(50) NOT NULL DEFAULT 'Customer',
			is_vip INTEGER NOT NULL DEFAULT 0,
			created_at VARCHAR(64) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS products (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			price NUMERIC(14,2) NOT NULL,
			original_price NUMERIC(14,2) NOT NULL,
			category VARCHAR(100) NOT NULL,
			image TEXT,
			stock INTEGER NOT NULL DEFAULT 0,
			rating NUMERIC(4,2) NOT NULL DEFAULT 0.0,
			sold INTEGER NOT NULL DEFAULT 0,
			description TEXT,
			is_flash_sale INTEGER NOT NULL DEFAULT 0,
			created_at VARCHAR(64) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS orders (
			id VARCHAR(64) PRIMARY KEY,
			customer_id VARCHAR(64) NOT NULL,
			customer_name VARCHAR(255) NOT NULL,
			customer_email VARCHAR(255) NOT NULL,
			items_json TEXT NOT NULL,
			total NUMERIC(14,2) NOT NULL,
			status VARCHAR(50) NOT NULL,
			timestamp VARCHAR(64) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS coupons (
			id VARCHAR(64) PRIMARY KEY,
			code VARCHAR(50) UNIQUE NOT NULL,
			type VARCHAR(50) NOT NULL,
			value NUMERIC(14,2) NOT NULL,
			active INTEGER NOT NULL DEFAULT 1,
			description TEXT
		);`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

func seedDefaults(db *sql.DB) error {
	// Seed Admin
	var adminCount int
	err := db.QueryRow(Rebind("SELECT COUNT(*) FROM users WHERE email = ?"), "admin@nexmart.com").Scan(&adminCount)
	if err == nil && adminCount == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		_, err = db.Exec(
			Rebind(`INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
			"admin-001", "Super Admin", "admin@nexmart.com", string(hash), 1, "Admin", 0, time.Now().UTC().Format(time.RFC3339),
		)
		if err != nil {
			log.Printf("Failed to seed admin: %v", err)
		} else {
			log.Println("Seeded default admin (admin@nexmart.com / admin123)")
		}
	}

	// Seed Sample Customer
	var custCount int
	err = db.QueryRow(Rebind("SELECT COUNT(*) FROM users WHERE email = ?"), "kevin@test.com").Scan(&custCount)
	if err == nil && custCount == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		_, _ = db.Exec(
			Rebind(`INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) 
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
			"u-002", "Kevin Pratama", "kevin@test.com", string(hash), 0, "Customer", 1, time.Now().UTC().Format(time.RFC3339),
		)
	}

	// Seed Coupons
	var couponCount int
	err = db.QueryRow("SELECT COUNT(*) FROM coupons").Scan(&couponCount)
	if err == nil && couponCount == 0 {
		coupons := [][]any{
			{"c1", "WELCOME10", "percentage", 10.0, 1, "10% New User Discount"},
			{"c2", "MEGAIDR", "fixed", 500000.0, 1, "IDR 500k Flat Discount"},
			{"c3", "NEXMART10", "percentage", 10.0, 1, "10% OFF Storewide"},
			{"c4", "SAVE50", "fixed", 50000.0, 1, "Rp 50.000 Flat Discount"},
		}
		for _, c := range coupons {
			_, _ = db.Exec(Rebind("INSERT INTO coupons (id, code, type, value, active, description) VALUES (?, ?, ?, ?, ?, ?)"), c...)
		}
		log.Println("Seeded default discount coupons")
	}

	// Seed Products
	var prodCount int
	err = db.QueryRow("SELECT COUNT(*) FROM products").Scan(&prodCount)
	if err == nil && prodCount == 0 {
		products := [][]any{
			{"1", "Fjallraven - Foldsack No. 1 Backpack", 1095000.0, 1500000.0, "Men's clothing", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80", 15, 3.9, 120, "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve.", 1},
			{"2", "Mens Casual Premium Slim Fit T-Shirts", 223000.0, 350000.0, "Men's clothing", "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80", 25, 4.1, 259, "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric.", 0},
			{"3", "Mens Cotton Jacket", 559900.0, 800000.0, "Men's clothing", "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80", 12, 4.7, 500, "Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions.", 1},
			{"4", "Mens Casual Slim Fit", 159900.0, 250000.0, "Men's clothing", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80", 45, 2.1, 430, "Classic comfortable fit shirt for daily casual use.", 0},
			{"5", "John Hardy Women's Naga Dragon Station Bracelet", 6950000.0, 8500000.0, "Jewelery", "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80", 5, 4.6, 40, "From our Legends Collection, handcrafted silver dragon bracelet.", 0},
			{"6", "Solid Gold Petite Micropave", 1680000.0, 2200000.0, "Jewelery", "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80", 10, 3.9, 70, "Satisfaction Guaranteed. Return or exchange any order within 30 days.", 0},
			{"7", "White Gold Plated Princess Ring", 99900.0, 150000.0, "Jewelery", "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&auto=format&fit=crop&q=80", 100, 3.0, 400, "Classic Created Wedding Engagement Solitaire Diamond Promise Ring.", 0},
			{"8", "WD 2TB Elements Portable External Hard Drive", 640000.0, 900000.0, "Electronics", "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80", 50, 3.3, 203, "USB 3.0 and USB 2.0 Compatibility. Fast data transfers.", 1},
			{"9", "SanDisk SSD PLUS 1TB Internal SSD", 1090000.0, 1400000.0, "Electronics", "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80", 35, 2.9, 470, "Easy upgrade for faster boot-up, shutdown, application load and response.", 0},
			{"10", "Silicon Power 256GB SSD 3D NAND A55", 350000.0, 500000.0, "Electronics", "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80", 60, 4.8, 890, "3D NAND flash are applied to deliver high transfer speeds.", 1},
			{"11", "Wireless Bluetooth Earbuds Pro", 450000.0, 899000.0, "Electronics", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80", 40, 4.8, 1240, "High fidelity sound with active noise cancelling and waterproof case.", 1},
		}

		now := time.Now().UTC().Format(time.RFC3339)
		for _, p := range products {
			_, err = db.Exec(
				Rebind(`INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
				p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[10], now,
			)
			if err != nil {
				log.Printf("Failed to insert product %v: %v", p[0], err)
			}
		}
		log.Println("Seeded initial product catalog")
	}

	return nil
}

func syncAdminAccount(db *sql.DB) {
	email := strings.TrimSpace(strings.ToLower(os.Getenv("ADMIN_EMAIL")))
	pass := os.Getenv("ADMIN_PASSWORD")
	if email == "" || pass == "" {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Warning: Failed to hash admin password: %v", err)
		return
	}

	var existingID string
	err = db.QueryRow(Rebind("SELECT id FROM users WHERE LOWER(email) = ?"), email).Scan(&existingID)
	if err == sql.ErrNoRows {
		newID := fmt.Sprintf("admin-%d", time.Now().UnixMilli())
		_, err = db.Exec(
			Rebind(`INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at)
			 VALUES (?, 'Administrator', ?, ?, 1, 'Admin', 0, ?)`),
			newID, email, string(hash), time.Now().UTC().Format(time.RFC3339),
		)
		if err != nil {
			log.Printf("Warning: Failed to create custom admin: %v", err)
		} else {
			log.Printf("👑 Created admin user from env: %s", email)
		}
	} else if err == nil {
		_, err = db.Exec(Rebind("UPDATE users SET password_hash = ?, is_admin = 1, role = 'Admin' WHERE id = ?"), string(hash), existingID)
		if err != nil {
			log.Printf("Warning: Failed to update admin credentials: %v", err)
		} else {
			log.Printf("🔑 Successfully updated admin credentials for: %s", email)
		}
	}
}
