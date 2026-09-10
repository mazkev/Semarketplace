package database

import (
	"database/sql"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

// AutoMigrateFromSQLite checks if a legacy SQLite database exists and migrates data to PostgreSQL.
func AutoMigrateFromSQLite(pgDB *sql.DB) {
	candidates := []string{
		"./data/marketplace.db",
		"/app/data/marketplace.db",
	}

	var sqlitePath string
	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			sqlitePath = path
			break
		}
	}

	if sqlitePath == "" {
		return
	}

	// Check if PostgreSQL already has data
	var pgProdCount int
	err := pgDB.QueryRow("SELECT COUNT(*) FROM products").Scan(&pgProdCount)
	if err != nil || pgProdCount > 0 {
		return
	}

	log.Printf("📦 [DATABASE MIGRATOR] Empty PostgreSQL detected. Migrating from legacy SQLite: %s ...", sqlitePath)

	sqliteDB, err := sql.Open("sqlite", sqlitePath)
	if err != nil {
		log.Printf("Warning: Failed to open SQLite for migration: %v", err)
		return
	}
	defer sqliteDB.Close()

	// 1. Migrate Users
	userRows, err := sqliteDB.Query("SELECT id, name, email, password_hash, is_admin, role, is_vip, created_at FROM users")
	if err == nil {
		defer userRows.Close()
		userCount := 0
		for userRows.Next() {
			var id, name, email, hash, role, createdAt string
			var isAdmin, isVIP int
			if err := userRows.Scan(&id, &name, &email, &hash, &isAdmin, &role, &isVIP, &createdAt); err == nil {
				_, _ = pgDB.Exec(
					Rebind("INSERT INTO users (id, name, email, password_hash, is_admin, role, is_vip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (email) DO NOTHING"),
					id, name, email, hash, isAdmin, role, isVIP, createdAt,
				)
				userCount++
			}
		}
		if err := userRows.Err(); err != nil {
			log.Printf("Warning: Error iterating users during migration: %v", err)
		}
		log.Printf("   -> Migrated %d users", userCount)
	}

	// 2. Migrate Products
	prodRows, err := sqliteDB.Query("SELECT id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at FROM products")
	if err == nil {
		defer prodRows.Close()
		prodCount := 0
		for prodRows.Next() {
			var id, name, category, image, desc, createdAt string
			var price, origPrice, rating float64
			var stock, sold, isFlashSale int
			if err := prodRows.Scan(&id, &name, &price, &origPrice, &category, &image, &stock, &rating, &sold, &desc, &isFlashSale, &createdAt); err == nil {
				_, _ = pgDB.Exec(
					Rebind("INSERT INTO products (id, name, price, original_price, category, image, stock, rating, sold, description, is_flash_sale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING"),
					id, name, price, origPrice, category, image, stock, rating, sold, desc, isFlashSale, createdAt,
				)
				prodCount++
			}
		}
		if err := prodRows.Err(); err != nil {
			log.Printf("Warning: Error iterating products during migration: %v", err)
		}
		log.Printf("   -> Migrated %d products", prodCount)
	}

	// 3. Migrate Orders
	orderRows, err := sqliteDB.Query("SELECT id, customer_id, customer_name, customer_email, items_json, total, status, timestamp FROM orders")
	if err == nil {
		defer orderRows.Close()
		orderCount := 0
		for orderRows.Next() {
			var id, custID, custName, custEmail, itemsJSON, status, timestamp string
			var total float64
			if err := orderRows.Scan(&id, &custID, &custName, &custEmail, &itemsJSON, &total, &status, &timestamp); err == nil {
				_, _ = pgDB.Exec(
					Rebind("INSERT INTO orders (id, customer_id, customer_name, customer_email, items_json, total, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING"),
					id, custID, custName, custEmail, itemsJSON, total, status, timestamp,
				)
				orderCount++
			}
		}
		if err := orderRows.Err(); err != nil {
			log.Printf("Warning: Error iterating orders during migration: %v", err)
		}
		log.Printf("   -> Migrated %d orders", orderCount)
	}

	// 4. Migrate Coupons
	couponRows, err := sqliteDB.Query("SELECT id, code, type, value, active, description FROM coupons")
	if err == nil {
		defer couponRows.Close()
		couponCount := 0
		for couponRows.Next() {
			var id, code, cType, desc string
			var value float64
			var active int
			if err := couponRows.Scan(&id, &code, &cType, &value, &active, &desc); err == nil {
				_, _ = pgDB.Exec(
					Rebind("INSERT INTO coupons (id, code, type, value, active, description) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (code) DO NOTHING"),
					id, code, cType, value, active, desc,
				)
				couponCount++
			}
		}
		if err := couponRows.Err(); err != nil {
			log.Printf("Warning: Error iterating coupons during migration: %v", err)
		}
		log.Printf("   -> Migrated %d coupons", couponCount)
	}

	log.Println("✨ [DATABASE MIGRATOR] Migration from SQLite to PostgreSQL completed successfully!")
}
