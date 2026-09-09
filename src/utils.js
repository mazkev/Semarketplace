export function formatPrice(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateId() { return Date.now() + Math.floor(Math.random() * 1000) }
export function generateTxnId() { return `TRX-${Date.now()}` }

export function formatDate(ts) {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date)
}


export function formatRelative(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return formatDate(ts)
}

/* ── Auth Helpers ── */
export function hashPassword(pw) {
  let h = 0
  for (let i = 0; i < pw.length; i++) {
    h = ((h << 5) - h) + pw.charCodeAt(i)
    h |= 0
  }
  return String(h)
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/* ── Default Admin Seed ── */
export const DEFAULT_ADMINS = [
  { id: 'admin-001', name: 'Super Admin', email: 'admin@semarketplace.com', password: hashPassword('admin123'), createdAt: Date.now() }
]

/* ── Shopee-Style Seed Products (IDR) ── */
export const SEED_PRODUCTS = [
  {
    id: 2001,
    name: 'Wireless Bluetooth Earbuds Pro',
    price: 450000,
    originalPrice: 899000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    category: 'Electronics',
    sold: 1240,
    rating: 4.8,
    stock: 150,
  },
  {
    id: 2002,
    name: 'Mechanical RGB Gaming Keyboard',
    price: 750000,
    originalPrice: 1200000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    category: 'Electronics',
    sold: 876,
    rating: 4.7,
    stock: 80,
  },
  {
    id: 2003,
    name: 'Minimalist Leather Wallet',
    price: 299000,
    originalPrice: 500000,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    category: 'Fashion',
    sold: 3210,
    rating: 4.9,
    stock: 320,
  },
  {
    id: 2004,
    name: 'Smart Watch Fitness Tracker',
    price: 1200000,
    originalPrice: 2000000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    category: 'Electronics',
    sold: 2150,
    rating: 4.6,
    stock: 95,
  },
  {
    id: 2005,
    name: 'Portable Mini Blender USB',
    price: 350000,
    originalPrice: 500000,
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop',
    category: 'Home',
    sold: 5430,
    rating: 4.5,
    stock: 200,
  },
  {
    id: 2006,
    name: 'Premium Yoga Mat Non-Slip',
    price: 499000,
    originalPrice: 800000,
    image: 'https://images.unsplash.com/photo-1601925228843-d860f855aef5?w=400&h=400&fit=crop',
    category: 'Sports',
    sold: 890,
    rating: 4.7,
    stock: 130,
  },
  {
    id: 2007,
    name: 'Vintage Polaroid Camera',
    price: 950000,
    originalPrice: 1500000,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop',
    category: 'Electronics',
    sold: 430,
    rating: 4.4,
    stock: 45,
  },
  {
    id: 2008,
    name: 'Ceramic Coffee Mug Set (4pcs)',
    price: 345000,
    originalPrice: 600000,
    image: 'https://images.unsplash.com/photo-1571942676516-bcab84649e44?w=400&h=400&fit=crop',
    category: 'Home',
    sold: 2760,
    rating: 4.8,
    stock: 500,
  },
  {
    id: 2009,
    name: 'Running Sneakers Lightweight',
    price: 850000,
    originalPrice: 1400000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    category: 'Sports',
    sold: 1870,
    rating: 4.6,
    stock: 75,
  },
  {
    id: 2010,
    name: 'LED Desk Lamp Touch Control',
    price: 425000,
    originalPrice: 700000,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
    category: 'Home',
    sold: 3100,
    rating: 4.7,
    stock: 180,
  },
]

export const CATEGORIES = [
  { id: 'All', name: 'All Products', icon: '🛒' },
  { id: 'Electronics', name: 'Electronics', icon: '💻' },
  { id: 'Home', name: 'Living & Deco', icon: '🛋️' },
  { id: 'Beauty', name: 'Beauty & Care', icon: '💄' },
  { id: 'Mens', name: 'Mens Style', icon: '👕' },
  { id: 'Womens', name: 'Womens Style', icon: '👗' },
  { id: 'Automotive', name: 'Automotive', icon: '🚗' },
  { id: 'Groceries', name: 'Groceries', icon: '🍎' }
]

export const COUPONS = [
  { code: 'SEMARKET10', type: 'percentage', value: 0.1, description: '10% OFF Storewide' },
  { code: 'SAVE50', type: 'fixed', value: 50000, description: 'Rp 50.000 Flat Discount' },
  { code: 'FLASH20', type: 'percentage', value: 0.2, description: '20% OFF Flash Sale Voucher' },
]

