import { useState } from 'react'
import { formatPrice } from '../utils'

export default function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className="product-card">
      {/* Image */}
      <div className="product-image-wrap">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-image-placeholder">📦</div>
        )}
        <div className="product-overlay" />
        <button
          id={`quick-add-${product.id}`}
          className="btn btn-primary btn-sm product-quick-add"
          onClick={handleAdd}
        >
          {added ? '✓ Added!' : '+ Add to Cart'}
        </button>
      </div>

      {/* Body */}
      <div className="product-body">
        <div className="product-name">{product.name}</div>
        <div className="product-price">
          {formatPrice(product.price)}
          <span> / item</span>
        </div>
        <div className="product-actions">
          <button
            id={`add-to-cart-${product.id}`}
            className={`btn btn-primary btn-sm`}
            style={{ flex: 1 }}
            onClick={handleAdd}
          >
            {added ? '✓ Added!' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
