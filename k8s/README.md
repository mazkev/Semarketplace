# Panduan Praktik Kubernetes (K8s) - SeMarketplace

Panduan ini dirancang untuk latihan orkestrasi microservices menggunakan Kubernetes lokal di laptop Anda, sebagai bekal portofolio dan pengalaman kerja nyata (*Enterprise Cloud-Native DevOps*).

---

## 📁 Struktur Manifest Kubernetes

| File | Objek K8s | Deskripsi |
| :--- | :--- | :--- |
| [`00-namespace.yaml`](00-namespace.yaml) | **Namespace** | Mengisolasi seluruh resource SeMarketplace dalam ruang lingkup `semarketplace`. |
| [`01-configmap-secret.yaml`](01-configmap-secret.yaml) | **ConfigMap & Secret** | Memisahkan konfigurasi publik (`PORT`) dan data rahasia (`JWT_SECRET`, kredensial DB). |
| [`02-postgres.yaml`](02-postgres.yaml) | **PVC, Deployment, Service** | Database PostgreSQL 16 dengan media penyimpanan persisten (*storage*) & ClusterIP internal. |
| [`03-backend.yaml`](03-backend.yaml) | **Deployment & Service** | REST API Golang (2 Replicas) + Health Probes (`/api/health`) + Resource Limits. |
| [`04-frontend.yaml`](04-frontend.yaml) | **Deployment & Service** | Nginx React Frontend (2 Replicas) + NodePort `30080` untuk akses browser. |
| [`05-hpa.yaml`](05-hpa.yaml) | **HPA (Autoscaler)** | Skalabilitas otomatis Pod Golang dari 2 hingga 6 Pod saat CPU > 70%. |

---

## 🛠️ Persiapan Lingkungan Lokal (Pilih Salah Satu)

Di laptop Windows Anda, `kubectl` sudah terinstal. Anda hanya membutuhkan 1 cluster K8s lokal gratis:

### Opsi A: Aktifkan Kubernetes di Docker Desktop (Paling Mudah)
1. Buka aplikasi **Docker Desktop** di Windows.
2. Klik ikon gerigi **Settings** di pojok kanan atas.
3. Pilih menu **Kubernetes** di panel sebelah kiri.
4. Beri tanda centang pada **"Enable Kubernetes"** ➔ Klik **Apply & restart**.
5. Tunggu 1–2 menit sampai indikator Kubernetes di pojok kiri bawah berubah menjadi warna hijau.

### Opsi B: Menggunakan Minikube
Jika tidak menggunakan Docker Desktop Kubernetes, Anda bisa instal Minikube:
```powershell
winget install Kubernetes.minikube
minikube start --driver=docker
```

---

## 🚀 Langkah Menjalankan ke Cluster (Deploy)

### 1. Build Image Docker Lokal (Sekali saja):
Agar Kubernetes dapat menggunakan container image terbaru Anda:
```powershell
# Di root direktori semarketplace:
docker build -t semarketplace-frontend:latest .
docker build -t semarketplace-backend:latest ./backend
```

### 2. Terapkan Seluruh Manifest K8s:
Cukup jalankan satu baris ini:
```powershell
kubectl apply -f k8s/
```

### 3. Periksa Status Pod:
```powershell
kubectl get pods -n semarketplace
```
*Output yang akan muncul:*
```text
NAME                        READY   STATUS    RESTARTS   AGE
backend-79f88c886f-g9k8j    1/1     Running   0          30s
backend-79f88c886f-xq2w1    1/1     Running   0          30s
frontend-6bf96c898c-4p5m2   1/1     Running   0          30s
frontend-6bf96c898c-8v1k9   1/1     Running   0          30s
postgres-5c46fd6b94-k98p2   1/1     Running   0          30s
```

### 4. Buka Aplikasi di Browser:
Buka browser dan akses:
- **`http://localhost:30080`**

---

## 🧪 Skenario Eksperimen untuk Portofolio Anda

### Eksperimen 1: Uji Coba *Self-Healing* (Ketahanan Sistem)
Simulasikan salah satu pod backend Golang mengalami crash / mati mendadak:
```powershell
# Ambil nama salah satu pod backend
kubectl get pods -n semarketplace

# Hapus (bunuh) pod tersebut secara paksa:
kubectl delete pod <NAMA_POD_BACKEND> -n semarketplace
```
👉 **Perhatikan keajaibannya**: Dalam 0.5 detik, Kubernetes secara otomatis mendeteksi kematian pod tersebut dan langsung melahirkan Pod baru penggantinya tanpa ada downtime bagi pengunjung!

### Eksperimen 2: Uji Coba *Manual Scaling* (Flash Sale Simulation)
Ingin menambah kekuatan backend menjadi 5 server sekaligus saat Flash Sale?
```powershell
kubectl scale deployment backend --replicas=5 -n semarketplace
```
Ketik `kubectl get pods -n semarketplace`, Anda akan melihat 5 server Golang berjalan serentak membagi beban request!

Untuk mengembalikan normal:
```powershell
kubectl scale deployment backend --replicas=2 -n semarketplace
```

### Eksperimen 3: Melihat Log Pod Secara Realtime
```powershell
# Log dari salah satu pod backend Go:
kubectl logs -f -l app=backend -n semarketplace
```

---

## 🧹 Cara Bersih-Bersih (Menghapus Lab K8s)
Jika sudah selesai belajar dan ingin mengosongkan memori:
```powershell
kubectl delete -f k8s/
```
Semua Pod, Service, dan Namespace akan terhapus bersih dalam hitungan detik.
