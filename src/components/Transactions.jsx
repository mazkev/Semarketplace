import { useState } from 'react'
import { formatPrice, formatDate } from '../utils'

function TxnRow({ txn }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="txn-card">
      <div className="txn-header" onClick={() => setOpen(o => !o)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}>
        <div className="txn-header-left">
          <span className="badge badge-green">✓ Paid</span>
          <div>
            <div className="txn-id">{txn.id}</div>
            <div className="txn-date">{formatDate(txn.timestamp)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="txn-total">{formatPrice(txn.total)}</span>
          <span className={`txn-chevron ${open ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <div className="txn-details">
          {txn.items.map(item => (
            <div key={item.id} className="txn-detail-item">
              <span className="txn-detail-name">
                {item.name}
                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>× {item.qty}</span>
              </span>
              <span className="txn-detail-price">{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="divider" style={{ margin: '8px 0' }} />
          <div className="txn-detail-item">
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 800, color: 'var(--accent-light)' }}>{formatPrice(txn.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Transactions({ transactions }) {
  return (
    <section className="transactions">
      <div className="container">
        <div className="page-section-header">
          <h1 className="page-section-title">📋 Order History</h1>
          <p className="page-section-subtitle">
            All transactions are stored locally in your browser.
            {transactions.length > 0 && ` ${transactions.length} order${transactions.length !== 1 ? 's' : ''} found.`}
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">📭</div>
            <h3>No orders yet</h3>
            <p>Your purchase history will appear here after your first order.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...transactions].reverse().map(txn => (
              <TxnRow key={txn.id} txn={txn} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
