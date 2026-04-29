import { formatPrice, formatDate } from '../utils'

export default function Receipt({ receipt, onClose }) {
  if (!receipt) return null

  const itemCount = receipt.items.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="receipt-overlay" role="dialog" aria-label="Order Receipt">
      <div className="receipt-card">
        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-success-icon">✅</div>
          <h2 className="receipt-title">Order Confirmed!</h2>
          <p className="receipt-subtitle">Your purchase was successful. Thank you!</p>
        </div>

        {/* Meta */}
        <div className="receipt-meta">
          <div className="receipt-meta-item">
            <span className="receipt-meta-label">Transaction ID</span>
            <span className="receipt-meta-value" style={{ fontFamily: 'monospace', color: 'var(--accent-light)' }}>
              {receipt.id}
            </span>
          </div>
          <div className="receipt-meta-item">
            <span className="receipt-meta-label">Date</span>
            <span className="receipt-meta-value">{formatDate(receipt.timestamp)}</span>
          </div>
          <div className="receipt-meta-item">
            <span className="receipt-meta-label">Items</span>
            <span className="receipt-meta-value">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Items */}
        <div className="receipt-items">
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>
            Order Summary
          </div>
          {receipt.items.map(item => (
            <div key={item.id} className="receipt-item">
              <div>
                <div className="receipt-item-name">{item.name}</div>
                <div className="receipt-item-qty">× {item.qty}</div>
              </div>
              <div className="receipt-item-price">
                {formatPrice(item.price * item.qty)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="receipt-total-section">
          <div className="receipt-total-row">
            <span className="receipt-total-label">Subtotal</span>
            <span className="receipt-total-value">{formatPrice(receipt.total)}</span>
          </div>
          <div className="receipt-total-row">
            <span className="receipt-total-label">Shipping</span>
            <span className="receipt-total-value" style={{ color: 'var(--success)' }}>FREE</span>
          </div>
          <div className="receipt-grand-total">
            <span className="receipt-grand-total-label">Grand Total</span>
            <span className="receipt-grand-total-value">{formatPrice(receipt.total)}</span>
          </div>
        </div>

        {/* Action */}
        <div className="receipt-actions">
          <button
            id="receipt-close-btn"
            className="btn btn-primary btn-lg"
            onClick={onClose}
          >
            🛍️ Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
