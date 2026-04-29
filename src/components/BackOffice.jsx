import { useState, useRef } from 'react'
import { generateId, formatPrice } from '../utils'

export default function BackOffice({ products, setProducts, showToast }) {
  const [form, setForm] = useState({ name: '', price: '', image: '' })
  const [editId, setEditId] = useState(null)
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      e.price = 'Enter a valid price greater than 0'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (editId !== null) {
      setProducts(prev =>
        prev.map(p =>
          p.id === editId
            ? { ...p, name: form.name.trim(), price: parseFloat(form.price), image: form.image.trim() }
            : p
        )
      )
      showToast('Product updated successfully!', 'success')
      setEditId(null)
    } else {
      const newProduct = {
        id: generateId(),
        name: form.name.trim(),
        price: parseFloat(form.price),
        image: form.image.trim(),
      }
      setProducts(prev => [newProduct, ...prev])
      showToast('Product added to store!', 'success')
    }

    setForm({ name: '', price: '', image: '' })
  }

  const handleEdit = product => {
    setEditId(product.id)
    setForm({ name: product.name, price: String(product.price), image: product.image || '' })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDelete = id => {
    setProducts(prev => prev.filter(p => p.id !== id))
    if (editId === id) { setEditId(null); setForm({ name: '', price: '', image: '' }) }
    showToast('Product removed.', 'info')
  }

  const handleCancel = () => {
    setEditId(null)
    setForm({ name: '', price: '', image: '' })
    setErrors({})
  }

  return (
    <section className="backoffice">
      <div className="container">
        <div className="page-section-header">
          <h1 className="page-section-title">⚙️ Back Office</h1>
          <p className="page-section-subtitle">Manage your product inventory. Changes sync automatically.</p>
        </div>

        <div className="backoffice-grid">
          {/* ── Form ── */}
          <div ref={formRef} className="admin-form-card animate-fade-in-up">
            <div className="admin-form-title">
              <span>{editId ? '✏️' : '➕'}</span>
              {editId ? 'Edit Product' : 'Add New Product'}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="admin-form-fields">
                {/* Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-name">Product Name</label>
                  <input
                    id="admin-name"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Wireless Headphones"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  {errors.name && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.name}</span>}
                </div>

                {/* Price */}
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-price">Price (USD)</label>
                  <input
                    id="admin-price"
                    className="form-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 49.99"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                  {errors.price && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.price}</span>}
                </div>

                {/* Image */}
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-image">Image URL (optional)</label>
                  <input
                    id="admin-image"
                    className="form-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  />
                  {/* Preview */}
                  <div className="image-preview">
                    {form.image ? (
                      <img src={form.image} alt="preview" onError={e => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="image-preview-placeholder">
                        <span>🖼️</span>
                        <p>Image preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button id="admin-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editId ? '💾 Save Changes' : '➕ Add Product'}
                  </button>
                  {editId && (
                    <button id="admin-cancel-btn" type="button" className="btn btn-ghost" onClick={handleCancel}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* ── Inventory ── */}
          <div className="inventory-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="inventory-header">
              <h2>📦 Inventory <span className="badge badge-purple">{products.length} items</span></h2>
            </div>

            {products.length === 0 ? (
              <div className="inventory-empty">
                <span>📭</span>
                <p>No products yet. Add your first product using the form.</p>
              </div>
            ) : (
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={editId === p.id ? { background: 'rgba(124,58,237,0.06)' } : {}}>
                        <td>
                          <div className="table-img">
                            {p.image
                              ? <img src={p.image} alt={p.name} />
                              : <div className="placeholder">📦</div>
                            }
                          </div>
                        </td>
                        <td className="product-name-cell">{p.name}</td>
                        <td className="price-cell">{formatPrice(p.price)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{p.id}</td>
                        <td>
                          <div className="action-cell">
                            <button
                              id={`edit-product-${p.id}`}
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleEdit(p)}
                            >✏️ Edit</button>
                            <button
                              id={`delete-product-${p.id}`}
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(p.id)}
                            >🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
