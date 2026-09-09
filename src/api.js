/**
 * SeMarketplace API Client (LOCAL STORAGE MODE)
 * This file simulates a backend server using the browser's localStorage.
 */

// Initial Seed Data with Detailed Descriptions
const DEFAULT_PRODUCTS = [
  { 
    _id: '1', 
    name: 'Fjallraven - Foldsack No. 1 Backpack', 
    price: 1095000, 
    originalPrice: 1500000, 
    category: "Men's clothing", 
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 
    stock: 15, 
    rating: 3.9, 
    sold: 120,
    isFlashSale: true,
    description: 'Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve.'
  },
  { 
    _id: '2', 
    name: 'Mens Casual Premium Slim Fit T-Shirts', 
    price: 223000, 
    originalPrice: 350000, 
    category: "Men's clothing", 
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', 
    stock: 25, 
    rating: 4.1, 
    sold: 259,
    description: 'Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric.'
  },
  { 
    _id: '3', 
    name: 'Mens Cotton Jacket', 
    price: 559900, 
    originalPrice: 800000, 
    category: "Men's clothing", 
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80', 
    stock: 12, 
    rating: 4.7, 
    sold: 500,
    isFlashSale: true,
    description: 'Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions.'
  },
  { 
    _id: '4', 
    name: 'Mens Casual Slim Fit', 
    price: 159900, 
    originalPrice: 250000, 
    category: "Men's clothing", 
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80', 
    stock: 45, 
    rating: 2.1, 
    sold: 430,
    description: 'Classic comfortable fit shirt for daily casual use.'
  },
  { 
    _id: '5', 
    name: "John Hardy Women's Naga Dragon Station Bracelet", 
    price: 6950000, 
    originalPrice: 8500000, 
    category: 'Jewelery', 
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', 
    stock: 5, 
    rating: 4.6, 
    sold: 40,
    description: "From our Legends Collection, handcrafted silver dragon bracelet."
  },
  { 
    _id: '6', 
    name: 'Solid Gold Petite Micropave', 
    price: 1680000, 
    originalPrice: 2200000, 
    category: 'Jewelery', 
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80', 
    stock: 10, 
    rating: 3.9, 
    sold: 70,
    description: 'Satisfaction Guaranteed. Return or exchange any order within 30 days.'
  },
  { 
    _id: '7', 
    name: 'White Gold Plated Princess', 
    price: 99900, 
    originalPrice: 150000, 
    category: 'Jewelery', 
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&auto=format&fit=crop&q=80', 
    stock: 100, 
    rating: 3.0, 
    sold: 400,
    description: 'Classic Created Wedding Engagement Solitaire Diamond Promise Ring for Her.'
  },
  { 
    _id: '8', 
    name: 'WD 2TB Elements Portable External Hard Drive', 
    price: 640000, 
    originalPrice: 900000, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80', 
    stock: 50, 
    rating: 3.3, 
    sold: 203,
    isFlashSale: true,
    description: 'USB 3.0 and USB 2.0 Compatibility Fast data transfers.'
  },
  { 
    _id: '9', 
    name: 'SanDisk SSD PLUS 1TB Internal SSD', 
    price: 1090000, 
    originalPrice: 1400000, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80', 
    stock: 35, 
    rating: 2.9, 
    sold: 470,
    description: 'Easy upgrade for faster boot-up, shutdown, application load and response.'
  },
  { 
    _id: '10', 
    name: 'Silicon Power 256GB SSD 3D NAND A55', 
    price: 350000, 
    originalPrice: 500000, 
    category: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80', 
    stock: 60, 
    rating: 4.8, 
    sold: 890,
    isFlashSale: true,
    description: '3D NAND flash are applied to deliver high transfer speeds.'
  }
];

const DEFAULT_COUPONS = [
  { _id: 'c1', code: 'WELCOME10', type: 'percentage', value: 10, active: true, description: '10% New User Discount' },
  { _id: 'c2', code: 'MEGAIDR', type: 'fixed', value: 500000, active: true, description: 'IDR 500k Flat Discount' },
  { _id: 'c3', code: 'NEXMART10', type: 'percentage', value: 10, active: true, description: '10% OFF Storewide' },
  { _id: 'c4', code: 'SAVE50', type: 'fixed', value: 50000, active: true, description: 'Rp 50.000 Flat Discount' }
];

let initPromise = null;

const mapCategory = (dummyCat) => {
  const cat = dummyCat.toLowerCase();
  if (['smartphones', 'laptops', 'tablets', 'mobile-accessories'].includes(cat)) return 'Electronics';
  if (['furniture', 'home-decoration', 'kitchen-accessories', 'lighting'].includes(cat)) return 'Home';
  if (['beauty', 'fragrances', 'skin-care'].includes(cat)) return 'Beauty';
  if (['mens-shirts', 'mens-shoes', 'mens-watches'].includes(cat)) return 'Mens';
  if (['womens-bags', 'womens-dresses', 'womens-jewellery', 'womens-shoes', 'womens-watches', 'tops'].includes(cat)) return 'Womens';
  if (['motorcycle', 'vehicle'].includes(cat)) return 'Automotive';
  if (['groceries'].includes(cat)) return 'Groceries';
  return 'Home'; // Fallback
};

async function initStorage() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    // Sync Coupons and Users
    const savedCoupons = JSON.parse(localStorage.getItem('mock_coupons') || '[]');
    if (savedCoupons.length === 0) localStorage.setItem('mock_coupons', JSON.stringify(DEFAULT_COUPONS));
    if (!localStorage.getItem('mock_orders')) localStorage.setItem('mock_orders', JSON.stringify([]));
    if (!localStorage.getItem('mock_users')) {
      localStorage.setItem('mock_users', JSON.stringify([
        { _id: 'u1', name: 'Admin User', email: 'admin@nexmart.com', isAdmin: true, role: 'Admin' },
        { _id: 'u2', name: 'Kevin Pratama', email: 'kevin@test.com', isAdmin: false, role: 'Customer' }
      ]));
    }

    // Force Hydrate from DummyJSON if using old data, if empty, or if we want to switch
    const existingProducts = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const isFakeStoreData = existingProducts.some(p => p.image && p.image.includes('fakestoreapi.com'));
    const isOldSmallData = existingProducts.length > 0 && existingProducts.length <= 10;
    const isTooMuchData = existingProducts.length > 50;
    
    if (existingProducts.length === 0 || isFakeStoreData || isOldSmallData || isTooMuchData) {
      try {
        console.log('Clearing old data and hydrating from DummyJSON (Curated)...');
        const response = await fetch('https://dummyjson.com/products?limit=40');
        const result = await response.json();
        const mapped = result.products.map(p => {
          const priceIDR = Math.round(p.price * 15500);
          const originalPriceIDR = Math.round(priceIDR / (1 - (p.discountPercentage / 100)));
          
          return {
            _id: String(p.id),
            name: p.title,
            price: priceIDR, 
            originalPrice: originalPriceIDR, 
            category: mapCategory(p.category),
            image: p.thumbnail,
            stock: p.stock,
            rating: p.rating,
            sold: Math.floor(Math.random() * 200) + 50,
            description: p.description,
            isFlashSale: p.discountPercentage > 15
          };
        });
        localStorage.setItem('mock_products', JSON.stringify(mapped));
        console.log('Catalog Hydrated from DummyJSON with', mapped.length, 'items');
      } catch (err) {
        console.error('API Hydration Failed', err);
        if (existingProducts.length === 0) localStorage.setItem('mock_products', JSON.stringify(DEFAULT_PRODUCTS));
      }
    }
  })();
  
  return initPromise;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function apiFetch(endpoint, options = {}) {
  if (!USE_MOCK) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = (data && (data.message || data.error)) || `Request failed with status ${res.status}`;
      throw new Error(errMsg);
    }

    return data;
  }

  await initStorage();
  await new Promise(r => setTimeout(r, 300));
  const method = options.method || 'GET';
  
  if (endpoint.startsWith('/products')) {
    const id = endpoint.split('/')[2];
    const saved = JSON.parse(localStorage.getItem('mock_products') || '[]');
    if (method === 'GET') {
      if (id) return saved.find(p => p._id === id);
      return saved;
    }
    if (method === 'POST') {
      const newP = { ...JSON.parse(options.body), _id: 'P-' + Date.now() };
      localStorage.setItem('mock_products', JSON.stringify([...saved, newP]));
      return newP;
    }
    if (method === 'PUT' && id) {
      const updates = JSON.parse(options.body);
      const updated = saved.map(p => p._id === id ? { ...p, ...updates } : p);
      localStorage.setItem('mock_products', JSON.stringify(updated));
      return updated.find(p => p._id === id);
    }
    if (method === 'DELETE' && id) {
      localStorage.setItem('mock_products', JSON.stringify(saved.filter(p => p._id !== id)));
      return { success: true };
    }
  }

  if (endpoint.startsWith('/orders')) {
    const id = endpoint.split('/')[2];
    const saved = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    if (method === 'GET') return id ? saved.find(o => (o._id || o.id) === id) : saved;
    if (method === 'POST') {
      const newO = { ...JSON.parse(options.body), _id: 'ORD-' + Date.now(), timestamp: new Date().toISOString() };
      localStorage.setItem('mock_orders', JSON.stringify([newO, ...saved]));
      return newO;
    }
    if (method === 'PUT' && id) {
      const updates = JSON.parse(options.body);
      const updated = saved.map(o => (o._id || o.id) === id ? { ...o, ...updates } : o);
      localStorage.setItem('mock_orders', JSON.stringify(updated));
      return updated.find(o => (o._id || o.id) === id);
    }
    if (method === 'DELETE' && id) {
      localStorage.setItem('mock_orders', JSON.stringify(saved.filter(o => (o._id || o.id) !== id)));
      return { success: true };
    }
  }

  if (endpoint.startsWith('/analytics')) {
    const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const products = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const categoryMap = products.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {});
    const topSellers = orders.flatMap(o => o.items).reduce((acc, i) => {
      const ex = acc.find(x => x.name === i.name);
      if (ex) ex.qty += i.qty;
      else acc.push({ name: i.name, qty: i.qty });
      return acc;
    }, []).sort((a,b) => b.qty - a.qty).slice(0, 5);
    const customerInsights = users.map(u => {
      const uOrders = orders.filter(o => o.customerId === u._id);
      const totalSpent = uOrders.reduce((s, o) => s + o.total, 0);
      return { ...u, orderCount: uOrders.length, totalSpent, isVIP: totalSpent > 5000000 };
    }).sort((a,b) => b.totalSpent - a.totalSpent);

    return {
      categoryDistribution: categoryMap,
      topSellers,
      customerInsights,
      summary: { totalRevenue: orders.reduce((s,o) => s + o.total, 0), orderCount: orders.length, productCount: products.length, customerCount: users.length }
    };
  }

  if (endpoint.startsWith('/coupons')) {
    const saved = JSON.parse(localStorage.getItem('mock_coupons') || '[]');
    if (endpoint === '/coupons/validate') {
      const { code } = JSON.parse(options.body);
      if (!code) throw new Error('No code provided');
      const cleanCode = code.trim().toUpperCase();
      let coupon = saved.find(c => c.code === cleanCode && c.active);
      if (!coupon) coupon = DEFAULT_COUPONS.find(c => c.code === cleanCode && c.active);
      if (!coupon) throw new Error('Invalid or expired coupon');
      return coupon;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      const newC = { ...body, _id: 'CPN-' + Date.now(), code: body.code.trim().toUpperCase(), active: body.active ?? true };
      localStorage.setItem('mock_coupons', JSON.stringify([newC, ...saved]));
      return newC;
    }
    if (method === 'DELETE') {
      const id = endpoint.split('/').pop();
      localStorage.setItem('mock_coupons', JSON.stringify(saved.filter(c => (c._id || c.id) !== id)));
      return { success: true };
    }
    return saved;
  }

  if (endpoint.startsWith('/users')) {
    const id = endpoint.split('/')[2];
    const saved = JSON.parse(localStorage.getItem('mock_users') || '[]');
    if (method === 'GET') return id ? saved.find(u => u._id === id) : saved;
    if (method === 'PUT' && id) {
      const updates = JSON.parse(options.body);
      const updated = saved.map(u => u._id === id ? { ...u, ...updates } : u);
      localStorage.setItem('mock_users', JSON.stringify(updated));
      return updated.find(u => u._id === id);
    }
    if (method === 'DELETE' && id) {
      localStorage.setItem('mock_users', JSON.stringify(saved.filter(u => u._id !== id)));
      return { success: true };
    }
  }

  if (endpoint.startsWith('/auth')) {
    const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
    if (endpoint === '/auth/login') {
      const { email } = JSON.parse(options.body);
      let user = users.find(u => u.email === email);
      if (!user) user = { _id: 'U-' + Date.now(), name: email.split('@')[0], email, isAdmin: email.includes('admin'), role: email.includes('admin') ? 'Admin' : 'Customer' };
      return user;
    }
    if (endpoint === '/auth/register') {
      const body = JSON.parse(options.body);
      const newUser = { 
        ...body, 
        _id: 'U-' + Date.now(), 
        role: body.isAdmin ? 'Admin' : 'Customer',
        isVIP: false 
      };
      localStorage.setItem('mock_users', JSON.stringify([...users, newUser]));
      return newUser;
    }
  }
  throw new Error(`Route ${endpoint} not implemented`);
}
