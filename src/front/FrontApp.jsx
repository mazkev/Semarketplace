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
import OpenStoreModal from './OpenStoreModal'
import SellerCenter   from './SellerCenter'
import StoreProfile   from './StoreProfile'

export default function FrontApp({ user, onLogout, darkMode, setDarkMode }) {
  const [isAdmin, setIsAdmin]            = useState(false)
  const [products, setProducts]          = useState([])
  const [loading, setLoading]            = useState(true)
  const [transactions, setTransactions]  = useState([])
  const [cart, setCart]                  = useLocalStorage('semarket_cart', [])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [wishlist, setWishlist]          = useLocalStorage('semarket_wishlist', [])
  const [reviews, setReviews]           = useLocalStorage('semarket_reviews', [])
  const [cartOpen, setCartOpen]          = useState(false)
  const [receipt, setReceipt]            = useState(null)
  const [page, setPage]                  = useState('shop') 
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [myStore, setMyStore]            = useState(null)
  const [openStoreModal, setOpenStoreModal] = useState(false)
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(null)

  // Fetch caller's store on mount or user change
  useEffect(() => {
    if (user?._id) {
      apiFetch('/stores/my-store')
        .then(store => setMyStore(store))
        .catch(() => setMyStore(null))
    }
  }, [user?._id])

  // Auto-scroll to top on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);
  const [search, setSearch]              = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [toasts, setToasts]              = useState([])
  const showToast = useToast(setToasts)

  // Fetch reviews whenever a product is selected
  useEffect(() => {
    const prodId = selectedProduct?._id || selectedProduct?.id;
    if (page === 'detail' && prodId) {
      apiFetch(`/products/${prodId}/reviews`)
        .then(fetchedReviews => {
          if (Array.isArray(fetchedReviews)) {
            setReviews(prev => {
              const others = prev.filter(r => r.productId !== prodId);
              return [...fetchedReviews, ...others];
            });
          }
        })
        .catch(() => {});
    }
  }, [page, selectedProduct, setReviews]);

  const submitReview = useCallback(async (productId, review) => {
    try {
      const created = await apiFetch(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: review.rating, comment: review.comment })
      });
      setReviews(prev => [created, ...prev.filter(r => (r._id || r.id) !== (created._id || created.id))]);
      
      // Refresh products so the updated rating reflects across the catalog
      apiFetch('/products').then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
          const updated = data.find(p => (p._id || p.id) === productId);
          if (updated) setSelectedProduct(updated);
        }
      }).catch(() => {});
      
      showToast('Review submitted successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    }
  }, [setReviews, showToast]);

  const deleteReview = useCallback(async (reviewId) => {
    const prodId = selectedProduct?._id || selectedProduct?.id;
    if (!prodId) return;
    try {
      await apiFetch(`/products/${prodId}/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      setReviews(prev => prev.filter(r => (r._id || r.id) !== reviewId));

      // Refresh products so the recalculated rating reflects across the catalog
      apiFetch('/products').then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
          const updated = data.find(p => (p._id || p.id) === prodId);
          if (updated) setSelectedProduct(updated);
        }
      }).catch(() => {});

      showToast('Review removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete review', 'error');
    }
  }, [selectedProduct, setReviews, showToast]);

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

  // Sync wishlist from server for authenticated user
  useEffect(() => {
    if (user) {
      apiFetch('/wishlist')
        .then(serverWishlist => {
          if (Array.isArray(serverWishlist)) {
            setWishlist(serverWishlist)
          }
        })
        .catch(() => {})
    }
  }, [user, setWishlist])

  const toggleWishlist = useCallback(async (product) => {
    const prodId = product._id || product.id
    const isFav = wishlist.some(i => (i._id || i.id) === prodId)
    if (isFav) {
      setWishlist(prev => prev.filter(i => (i._id || i.id) !== prodId))
      showToast(`Removed "${product.name}" from wishlist`, 'info')
      if (user) {
        apiFetch(`/wishlist/${prodId}`, { method: 'DELETE' }).catch(() => {})
      }
    } else {
      setWishlist(prev => [product, ...prev.filter(i => (i._id || i.id) !== prodId)])
      showToast(`Added "${product.name}" to wishlist`, 'success')
      if (user) {
        apiFetch('/wishlist', {
          method: 'POST',
          body: JSON.stringify({ productId: prodId })
        }).catch(() => {})
      }
    }
  }, [wishlist, setWishlist, showToast, user])

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
    const variant = product.variant || (product.variants && product.variants.length > 0 ? product.variants[0] : '')
    const isGroupBuy = Boolean(product.isGroupBuy)
    const activePrice = isGroupBuy && product.groupPrice ? product.groupPrice : product.price
    const cartItemId = (product._id || product.id) + (variant ? '::' + variant : '') + (isGroupBuy ? '::gb' : '')
    setCart(prev => {
      const ex = prev.find(i => (i.cartItemId || i._id || i.id) === cartItemId)
      if (ex) return prev.map(i => (i.cartItemId || i._id || i.id) === cartItemId ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, price: activePrice, isGroupBuy, groupBuyId: product.groupBuyId, variant, cartItemId, qty: 1 }]
    })
    showToast(`Added ${isGroupBuy ? '👥 [Beli Bareng] ' : ''}"${product.name}${variant ? ' (' + variant + ')' : ''}" to cart`, 'success')
  }, [showToast])

  const updateQty = useCallback((id, qty) => {
    if (qty <= 0) setCart(prev => prev.filter(i => (i.cartItemId || i._id || i.id) !== id))
    else setCart(prev => prev.map(i => (i.cartItemId || i._id || i.id) === id ? { ...i, qty } : i))
  }, [])

  const removeFromCart = useCallback(id => setCart(prev => prev.filter(i => (i.cartItemId || i._id || i.id) !== id)), [])

  const checkout = useCallback(async (shippingData = {}) => {
    if (!cart.length) return
    try {
      const courier = shippingData.shippingCourier || 'JNE Reguler (2-3 Hari)'
      const shippingCost = Number(shippingData.shippingCost) || 0
      const address = shippingData.shippingAddress || 'Alamat Utama Pembeli'
      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
      const total = subtotal + shippingCost
      const txnData = {
        customerId: user._id, 
        customerName: user.name,
        customerEmail: user.email,
        items: cart.map(i => ({ 
          productId: i._id || i.id, 
          name: i.name, 
          price: i.price, 
          qty: i.qty,
          variant: i.variant || ''
        })),
        total,
        shippingCourier: courier,
        shippingCost: shippingCost,
        shippingAddress: address,
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
        onOpenAdmin={() => setIsAdmin(true)} showToast={showToast}
        myStore={myStore}
        onOpenStoreModal={() => setOpenStoreModal(true)}
        onGoToSeller={() => setPage('seller')}
      />

      <main className="flex-1">
        {page === 'shop' && <Storefront products={products} loading={loading} onAddToCart={addToCart} search={search} setSearch={setSearch} activeCategory={activeCategory} setActiveCategory={setActiveCategory} wishlist={wishlist} onToggleWishlist={toggleWishlist} onSelectProduct={(p) => { setSelectedProduct(p); setPage('detail') }} />}
        {page === 'wishlist' && <Storefront products={wishlist} onAddToCart={addToCart} title="My Wishlist" wishlist={wishlist} onToggleWishlist={toggleWishlist} onSelectProduct={(p) => { setSelectedProduct(p); setPage('detail') }} />}
        {page === 'detail' && <ProductDetail product={selectedProduct} onBack={() => setPage('shop')} onAddToCart={addToCart} wishlist={wishlist} onToggleWishlist={toggleWishlist} reviews={reviews.filter(r => r.productId === selectedProduct?._id)} onSubmitReview={(rev) => submitReview(selectedProduct?._id, rev)} onDeleteReview={deleteReview} user={user} onSelectStore={(slug) => { setSelectedStoreSlug(slug); setPage('store-detail') }} />}
        {page === 'orders' && <MyOrders orders={myOrders} onDelete={deleteOrder} />}
        {page === 'seller' && <SellerCenter store={myStore} onBack={() => setPage('shop')} onViewPublicStore={(slug) => { setSelectedStoreSlug(slug); setPage('store-detail') }} showToast={showToast} />}
        {page === 'store-detail' && <StoreProfile slug={selectedStoreSlug} onBack={() => setPage('shop')} onAddToCart={addToCart} onSelectProduct={(p) => { setSelectedProduct(p); setPage('detail') }} wishlist={wishlist} onToggleWishlist={toggleWishlist} />}
      </main>

      <OpenStoreModal
        isOpen={openStoreModal}
        onClose={() => setOpenStoreModal(false)}
        onStoreCreated={(newStore) => {
          setMyStore(newStore)
          setPage('seller')
        }}
        showToast={showToast}
      />

      {isAdmin && (
        <div className="fixed inset-0 z-[100] animate-fade-in">
          <BackOffice admin={user} onLogout={() => setIsAdmin(false)} transactions={transactions} onUpdateOrderStatus={updateOrderStatus} />
          <button className="fixed top-6 right-6 z-[101] bg-gray-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform" onClick={() => { fetchTransactions(); setIsAdmin(false) }}>← Back To Store</button>
        </div>
      )}

      {cartOpen && <Cart cart={cart} user={user} onClose={() => setCartOpen(false)} onQtyChange={updateQty} onRemove={removeFromCart} onCheckout={checkout} appliedCoupon={appliedCoupon} onApplyCoupon={validateCoupon} />}
      {receipt && <Receipt receipt={receipt} onClose={() => { setReceipt(null); setPage('shop') }} onViewOrders={() => { setReceipt(null); setPage('orders') }} />}

      <FrontFooter setPage={setPage} />
      <LiveChat user={user} />
      <Toast toasts={toasts} />
    </div>
  )
}
