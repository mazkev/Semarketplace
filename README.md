# SeMarketplace - Neo-Brutalism E-Commerce Platform

![CI/CD Automated Deployment](https://github.com/mazkev/Semarketplace/actions/workflows/deploy.yml/badge.svg)
![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![Design](https://img.shields.io/badge/Style-Neo--Brutalism-FFE500)

SeMarketplace adalah platform e-commerce berperforma tinggi dengan desain modern **Neo-Brutalism**, backend **Golang REST API**, dan database relasional skala enterprise **PostgreSQL 16**.

---

## 🚀 Fitur Utama

- **🎨 Neo-Brutalism Design**: Blok tegas, hard shadow, palet warna kontras tinggi, struk belanja barcode modern, dan pelacakan kurir logistik.
- **⚡ Backend Berkecepatan Tinggi**: REST API dibangun dengan Golang standar library dan connection pooling `pgx/v5`.
- **🐘 Database Enterprise PostgreSQL 16**: Penyimpanan transaksi dan katalog yang aman, terisolasi, dan ter-backup.
- **🛡️ Keamanan Standar Produksi**:
  - Autentikasi JSON Web Token (JWT HMAC-SHA256) dengan Role-Based Access Control (`RequireAdmin`).
  - Nginx Reverse Proxy dengan Rate Limiting anti brute-force (5 req/menit pada login) dan HTTP Security Headers.
  - Body payload limit (1 MB) anti DoS.
  - Port backend 8080 terisolasi di private network Docker.
- **🌐 Bilingual Support**: Alih bahasa instan Indonesia (ID) ⇄ English (EN).
- **🤖 SE-AI Assistant**: Asisten belanja cerdas terintegrasi dengan quick prompt chips.
- **🔄 CI/CD Otomatis**: Pipeline GitHub Actions terintegrasi untuk pengujian kode dan auto-deployment ke VPS via SSH.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Vanilla CSS + Tailwind Utility Tokens
- **Backend**: Golang, `pgx/v5`, `golang-jwt/jwt/v5`, `modernc.org/sqlite`
- **Database**: PostgreSQL 16 Alpine
- **Gateway**: Nginx Alpine Reverse Proxy + Rate Limiter
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD
