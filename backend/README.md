# SeMarketplace Backend (Golang)

Backend REST API untuk **SeMarketplace** yang dibangun menggunakan bahasa pemrograman **Go** dengan database **SQLite** (CGO-free via `modernc.org/sqlite`).

## 🚀 Fitur Backend

- **Pure-Go SQLite Engine**: Tidak memerlukan compiler C / GCC di Windows.
- **RESTful API**: Mendukung endpoint lengkap untuk katalog produk, transaksi pesanan, autentikasi, kupon diskon, manajemen pengguna, dan analitik dashboard.
- **Auto Database Migration & Seeding**: Otomatis membuat tabel dan mengisi data awal (Admin, produk, kupon) saat pertama kali dijalankan.
- **Password Security**: Password dienkripsi menggunakan algoritma `bcrypt`.
- **CORS Enabled**: Siap menerima request dari frontend Vite (`http://localhost:5173`).

---

## 🛠️ Persyaratan Sistem

- **Go**: v1.22 atau lebih baru (saat ini teruji pada Go 1.26).

---

## 🏁 Cara Menjalankan Server

### Opsi 1: Menjalankan langsung dengan `go run`
```powershell
cd d:\prog\semarket\backend
go run main.go
```

### Opsi 2: Menjalankan binary yang sudah di-compile
```powershell
cd d:\prog\semarket\backend
.\server.exe
```

Server akan aktif di: `http://localhost:8080`

---

## 🔑 Akun Bawaan (Default Seed)

- **Admin Portal**:
  - Email: `admin@nexmart.com`
  - Password: `admin123`
- **Customer Sample**:
  - Email: `kevin@test.com`
  - Password: `password123`

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck server status |
| `POST` | `/api/auth/login` | Login user / admin |
| `POST` | `/api/auth/register` | Pendaftaran akun baru |
| `GET` | `/api/products` | Mendapatkan semua produk |
| `GET` | `/api/products/{id}` | Detail produk |
| `POST` | `/api/products` | Tambah produk baru |
| `PUT` | `/api/products/{id}` | Update informasi produk |
| `DELETE` | `/api/products/{id}` | Hapus produk |
| `GET` | `/api/orders` | Riwayat seluruh pesanan |
| `GET` | `/api/orders/{id}` | Detail pesanan |
| `POST` | `/api/orders` | Checkout pesanan baru |
| `PUT` | `/api/orders/{id}` | Update status pesanan |
| `DELETE` | `/api/orders/{id}` | Hapus / batalkan pesanan |
| `GET` | `/api/coupons` | Daftar kupon aktif |
| `POST` | `/api/coupons` | Buat kupon baru |
| `POST` | `/api/coupons/validate` | Validasi kode kupon |
| `DELETE` | `/api/coupons/{id}` | Hapus kupon |
| `GET` | `/api/users` | Daftar pelanggan & admin |
| `GET` | `/api/users/{id}` | Detail pengguna |
| `PUT` | `/api/users/{id}` | Update data pengguna / status VIP |
| `DELETE` | `/api/users/{id}` | Hapus pengguna |
| `GET` | `/api/analytics/overview` | Data analitik penjualan untuk dashboard |
