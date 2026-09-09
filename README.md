# Aura Luxe - Premium Serverless Marketplace

Semarketplace is a high-performance, aesthetically premium e-commerce marketplace built as a **fully serverless, frontend-only application**. It features a dynamic product catalog hydrated from DummyJSON, persistent state via LocalStorage, and a stunning modern UI.

![Preview](https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80)

## ✨ Key Features

- **💎 Premium Aesthetic**: Modern minimalist design with glassmorphism, smooth transitions, and high-quality typography.
- **🚀 Fully Serverless**: No backend required. Uses a sophisticated Mock API layer with LocalStorage for persistence.
- **📦 Dynamic Catalog**: Automatically hydrates a curated collection of 40+ products from DummyJSON across multiple categories.
- **📱 Responsive & Interactive**: Fully optimized for mobile, tablet, and desktop with interactive elements (Cart, Wishlist, Reviews).
- **🌓 Dark Mode**: Built-in system-aware dark mode support.
- **🛒 Full E-commerce Flow**: Search, Category filtering, Cart management, Wishlist, and a simulated Checkout experience.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Design System)
- **Data Source**: [DummyJSON API](https://dummyjson.com/)
- **State Management**: React Hooks + LocalStorage
- **Icons**: Emoji-based (Lightweight & Universal)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.commazkev/semarketplace.git
   cd semarketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory:
   ```bash
   VITE_API_URL=https://dummyjson.com/products
   VITE_USE_MOCK=true
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view the app.

## 🐳 Docker Deployment (Recommended)

You can run both Frontend and Golang Backend together with persistent SQLite database using Docker Compose:

```bash
docker compose up -d --build
```

- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api`
- **Reverse Proxy**: Nginx automatically proxies `/api/` requests internally to the Go backend container.
- **Data Persistence**: Database is stored in a persistent Docker volume `backend-data`.

To stop containers:
```bash
docker compose down
```

## 📦 Cloud Deployment

### Deploy to Vercel / Netlify (Frontend)
1. Connect your GitHub repository to Vercel or Netlify.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Add environment variables:
   - `VITE_API_URL`: URL of your deployed Go backend (e.g. `https://your-backend.onrender.com/api`)
   - `VITE_USE_MOCK`: `false` (or `true` for standalone serverless mode)

### Deploy to GitHub Pages
1. Install the gh-pages package: `npm install gh-pages --save-dev`
2. Add these scripts to `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Run `npm run deploy`.

## 🧠 How It Works (Mock API Layer)

The app uses a custom abstraction in `src/api.js` that intercepts requests:
- **Product Hydration**: On first load, it fetches 40 curated items from DummyJSON and stores them in `localStorage`.
- **Persistent Store**: Orders, Cart, Wishlist, and User Reviews are all saved to the browser's `localStorage`, allowing the app to maintain state without a database.
- **Simulated Latency**: A small artificial delay (300ms) is added to API calls to simulate real-world server responses.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by mazkev
