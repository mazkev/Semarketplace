import { useState } from 'react'
import ProductCard from './ProductCard'

export default function Storefront({ products, onAddToCart, heroStats }) {
  const [search, setSearch] = useState('')

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-inner animate-fade-in-up">
          <div className="hero-tag">
            <span />
            LIVE MARKETPLACE
          </div>
          <h1 className="hero-title">
            Discover &amp; Shop<br />
            <span className="gradient-text">Premium Products</span>
          </h1>
          <p className="hero-subtitle">
            Explore our curated collection of high-quality items. Add to cart and checkout in seconds.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">{heroStats.products}</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{heroStats.transactions}</div>
              <div className="stat-label">Orders</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">${heroStats.revenue.toFixed(0)}</div>
              <div className="stat-label">Revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Storefront ── */}
      <section className="storefront">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">All Products</h2>
            <div className="search-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                id="search-input"
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer' }}
                >✕</button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state animate-fade-in">
              <div className="empty-state-icon">
                {products.length === 0 ? '🏪' : '🔍'}
              </div>
              <h3>
                {products.length === 0
                  ? 'Store is empty'
                  : 'No products found'}
              </h3>
              <p>
                {products.length === 0
                  ? 'Visit the Back Office tab to add your first product.'
                  : `No products match "${search}". Try a different search.`}
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <ProductCard product={p} onAddToCart={onAddToCart} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
