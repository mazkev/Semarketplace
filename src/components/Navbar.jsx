import { formatPrice } from '../utils'

export default function Navbar({ activeTab, setActiveTab, cartCount, onCartOpen }) {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="navbar-logo">🛍️</div>
          <span className="navbar-title">NexMart</span>
        </div>

        {/* Tabs */}
        <div className="navbar-tabs">
          <button
            id="tab-storefront"
            className={`nav-tab ${activeTab === 'storefront' ? 'active' : ''}`}
            onClick={() => setActiveTab('storefront')}
          >
            🏪 Storefront
          </button>
          <button
            id="tab-backoffice"
            className={`nav-tab ${activeTab === 'backoffice' ? 'active' : ''}`}
            onClick={() => setActiveTab('backoffice')}
          >
            ⚙️ Back Office
          </button>
          <button
            id="tab-transactions"
            className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            📋 History
          </button>
        </div>

        {/* Cart */}
        <div className="navbar-actions">
          <button
            id="cart-open-btn"
            className={`cart-btn ${cartCount > 0 ? 'has-items' : ''}`}
            onClick={onCartOpen}
            title="Open cart"
          >
            🛒 Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  )
}
