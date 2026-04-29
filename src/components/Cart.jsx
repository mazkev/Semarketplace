import { formatPrice, formatDate } from '../utils'

export default function Cart({ cart, onClose, onQtyChange, onRemove, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <>
      {/* Overlay */}
      <div id="cart-overlay" className="cart-overlay" onClick={onClose} />

      {/* Sidebar */}
      <div className="cart-sidebar" role="dialog" aria-label="Shopping Cart">
        {/* Header */}
        <div className="cart-header">
          <h2>🛒 Cart <span className="badge badge-purple">{totalItems}</span></h2>
          <button id="cart-close-btn" className="close-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* Items */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-state animate-fade-in" style={{ padding: '60px 24px' }}>
              <div className="empty-state-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add products from the storefront to get started.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                {/* Thumbnail */}
                <div className="cart-item-img">
                  {item.image
                    ? <img src={item.image} alt={item.name} />
                    : <div className="placeholder">📦</div>
                  }
                </div>

                {/* Info */}
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">
                    {formatPrice(item.price)} × {item.qty} = {formatPrice(item.price * item.qty)}
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="qty-controls">
                  <button
                    id={`qty-dec-${item.id}`}
                    className="qty-btn"
                    onClick={() => onQtyChange(item.id, item.qty - 1)}
                  >−</button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    id={`qty-inc-${item.id}`}
                    className="qty-btn"
                    onClick={() => onQtyChange(item.id, item.qty + 1)}
                  >+</button>
                </div>

                {/* Remove */}
                <button
                  id={`remove-item-${item.id}`}
                  className="remove-item-btn"
                  onClick={() => onRemove(item.id)}
                  title="Remove item"
                >🗑️</button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Total ({totalItems} items)</span>
              <span className="cart-total-value">{formatPrice(total)}</span>
            </div>
            <button
              id="checkout-btn"
              className="btn btn-success btn-lg"
              style={{ width: '100%' }}
              onClick={onCheckout}
            >
              ✅ Checkout — {formatPrice(total)}
            </button>
            <button
              id="clear-cart-btn"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%' }}
              onClick={() => { cart.forEach(i => onRemove(i.id)) }}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}
