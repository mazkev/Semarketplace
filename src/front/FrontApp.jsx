import { useState, useCallback, useEffect } from 'react'
import { useLocalStorage, useToast } from '../hooks'

import { CATEGORIES } from '../utils'
import { apiFetch } from '../api'

import FrontHeader  from './FrontHeader'
import Storefront   from './Storefront'
import Cart         from './Cart'
import Receipt      from './Receipt'
import MyOrders     from './MyOrders'
import ProductDetail from './ProductDetail'
import FrontFooter  from './FrontFooter'
import LiveChat     from './LiveChat'
import Toast        from '../components/Toast'

export default function FrontApp({ user, onLogout, darkMode, setDarkMode }) {
  const [isAdmin, setIsAdmin]            = useState(false)
  const [products, setProducts]          = useState([])
  const [loading, setLoading]            = useState(true)
  const [transactions, setTransactions]  = useState([])
  const [cart, setCart]                  = useLocalStorage('nex_cart', [])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [wishlist, setWishlist]          = useLocalStorage('nex_wishlist', [])
  const [reviews, setReviews]           = useLocalStorage('nex_reviews', [])
  const [cartOpen, setCartOpen]          = useState(false)
  const [receipt, setReceipt]            = useState(null)
  const [page, setPage]                  = useState('shop') 
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Auto-scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);
  const [search, setSearch]              = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [toasts, setToasts]              = useState([])
  const showToast = useToast(setToasts)

  const submitReview = useCallback((productId, review) => {
    const newReview = { ...review, _id: 'REV-' + Date.now(), productId, date: new Date().toISOString() }
    setReviews(prev => [newReview, ...prev])
    showToast('Review submitted successfully!', 'success')
  }, [setReviews, showToast])

  const deleteReview = useCallback((reviewId) => {
    setReviews(prev => prev.filter(r => r._id !== reviewId))
    showToast('Review removed', 'info')
  }, [setReviews, showToast])

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await apiFetch('/orders')
      setTransactions(data)
    } catch (err) {}
  }, [])

  // Fetch transactions on mount and when user navigates to orders view
  useEffect(() => {
    if (page === 'orders') {
      fetchTransactions()
    }
  }, [page, fetchTransactions])

  useEffect(() => {
    fetchTransactions()
    const handleStorageChange = (e) => {
      if (e.key === 'mock_orders') fetchTransactions()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchTransactions])

  const updateOrderStatus = useCallback(async (orderId, status) => {
    try {
      setTransactions(prev => prev.map(t => (t._id || t.id) === orderId ? { ...t, status } : t))
      await apiFetch(`/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ status }) })
      showToast(`Order status updated to ${status}`, 'info')
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }, [showToast])

  const toggleWishlist = useCallback((product) => {
    const isFav = wishlist.some(i => i._id === product._id)
    if (isFav) {
      setWishlist(prev => prev.filter(i => i._id !== product._id))
      showToast(`Removed "${product.name}" from wishlist`, 'info')
    } else {
      setWishlist(prev => [...prev, product])
      showToast(`Added "${product.name}" to wishlist`, 'success')
    }
  }, [wishlist, setWishlist, showToast])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const prodData = await apiFetch('/products')
        setProducts(prodData)
      } catch (err) {
        showToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [showToast])

  const addToCart = useCallback(product => {
    setCart(prev => {
      const ex = prev.find(i => i._id === product._id)
      if (ex) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    showToast(`Added "${product.name}" to cart`, 'success')
  }, [showToast])

  const updateQty = useCallback((id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i._id !== id))
    else setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i))
  }, [])

  const removeFromCart = useCallback(id => setCart(prev => prev.filter(i => i._id !== id)), [])

  const checkout = useCallback(async () => {
    if (!cart.length) return
    try {
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
      const txnData = {
        customerId: user._id, 
        customerName: user.name,
        customerEmail: user.email,
        items: cart.map(i => ({ productId: i._id, name: i.name, price: i.price, qty: i.qty })),
        total,
        status: 'Processing'
      }
      const response = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(txnData) })
      setTransactions(prev => [response, ...prev])
      setReceipt(response)
      setCart([])
      setAppliedCoupon(null)
      setCartOpen(false)
      showToast('Order placed successfully!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }, [cart, user, showToast])

  const deleteOrder = useCallback(async (id) => {
    if (!confirm('Are you sure you want to cancel/delete this order?')) return
    try {
      await apiFetch(`/orders/${id}`, { method: 'DELETE' })
      setTransactions(prev => prev.filter(t => (t._id || t.id) !== id))
      showToast('Order removed successfully', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }, [showToast])

  const validateCoupon = useCallback(async (code) => {
    if (!code) { setAppliedCoupon(null); return }
    try {
      const coupon = await apiFetch('/coupons/validate', { method: 'POST', body: JSON.stringify({ code }) })
      setAppliedCoupon(coupon)
      showToast(`Coupon "${code}" applied!`, 'success')
    } catch (err) { throw err }
  }, [showToast])

  const myOrders = (Array.isArray(transactions) ? transactions : []).filter(t => t && (t.customerId === user._id || t.customerEmail === user.email))
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex flex-col transition-colors">
      <FrontHeader
        user={user} cartCount={cartCount} onCartOpen={() => setCartOpen(true)}
        onLogout={onLogout} search={search} setSearch={setSearch}
        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
        page={page} setPage={setPage} ordersCount={myOrders.length}
        darkMode={darkMode} setDarkMode={setDarkMode} wishlistCount={wishlist.length}
        onOpenAdmin={() => setIsAdmin(true)}
      />

      <main className="flex-1">
        {page === 'shop' && <Storefront products={products} loading={loading} onAddToCart={addToCart} search={search} setSearch={setSearch} activeCategory={activeCategory} setActiveCategory={setActiveCategory} wishlist={wishlist} onToggleWishlist={toggleWishlist} onSelectProduct={(p) => { setSelectedProduct(p); setPage('detail') }} />}
        {page === 'wishlist' && <Storefront products={wishlist} onAddToCart={addToCart} title="My Wishlist" wishlist={wishlist} onToggleWishlist={toggleWishlist} onSelectProduct={(p) => { setSelectedProduct(p); setPage('detail') }} />}
        {page === 'detail' && <ProductDetail product={selectedProduct} onBack={() => setPage('shop')} onAddToCart={addToCart} wishlist={wishlist} onToggleWishlist={toggleWishlist} reviews={reviews.filter(r => r.productId === selectedProduct?._id)} onSubmitReview={(rev) => submitReview(selectedProduct?._id, rev)} onDeleteReview={deleteReview} user={user} />}
        {page === 'orders' && <MyOrders orders={myOrders} onDelete={deleteOrder} />}
      </main>

      {isAdmin && (
        <div className="fixed inset-0 z-[100] animate-fade-in">
          <BackOffice admin={user} onLogout={() => setIsAdmin(false)} transactions={transactions} onUpdateOrderStatus={updateOrderStatus} />
          <button className="fixed top-6 right-6 z-[101] bg-gray-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform" onClick={() => { fetchTransactions(); setIsAdmin(false) }}>← Back To Store</button>
        </div>
      )}

      {cartOpen && <Cart cart={cart} onClose={() => setCartOpen(false)} onQtyChange={updateQty} onRemove={removeFromCart} onCheckout={checkout} appliedCoupon={appliedCoupon} onApplyCoupon={validateCoupon} />}
      {receipt && <Receipt receipt={receipt} onClose={() => { setReceipt(null); setPage('shop') }} onViewOrders={() => { setReceipt(null); setPage('orders') }} />}

      <FrontFooter setPage={setPage} />
      <LiveChat user={user} />
      <Toast toasts={toasts} />
    </div>
  )
}
