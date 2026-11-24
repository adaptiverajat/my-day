import React from 'react'

export default function JivanDishaLocationItem({
  loc,
  focusFn,
  historyFn,
  editFn,
  deleteFn
}) {
  const isPaid = Boolean(loc.payment_received)

  return (
    <div
      className="jd-location-item"
      onClick={() => focusFn && focusFn(loc)}
    >
      <div className="jd-loc-item-header">
        <span className="jd-loc-title">{loc.title}</span>
        <span className="jd-loc-country">{loc.country === 'US' ? '🇺🇸' : '🇮🇳'}</span>
      </div>

      {(loc.city || loc.state) && (
        <div className="jd-loc-city">
          📍 {[loc.city, loc.state].filter(Boolean).join(', ')}
        </div>
      )}

      <div className="jd-loc-metrics-row">
        <span className={`jd-metric-badge ${isPaid ? 'paid' : 'pending'}`}>
          {isPaid ? '✅ Paid' : '⏳ Pending'}
        </span>
        <span className="jd-metric-badge books">
          📦 {loc.books_sent || 0} books
        </span>
        {loc.invoice_date && (
          <span className="jd-metric-badge date">
            📅 {loc.invoice_date}
          </span>
        )}
        {loc.invoice_pdf_url && (
          <span className="jd-metric-badge pdf" title="Invoice PDF permanently retained">
            📄 PDF
          </span>
        )}
      </div>

      {(loc.decision_maker_name || loc.inventory_keeper_name) && (
        <div style={{ fontSize: '0.72rem', color: '#475569', margin: '4px 0' }}>
          {loc.decision_maker_name && <div>👔 {loc.decision_maker_name}</div>}
          {loc.inventory_keeper_name && <div>📦 {loc.inventory_keeper_name}</div>}
        </div>
      )}

      {loc.notes && <div className="jd-loc-notes">{loc.notes}</div>}

      <div className="jd-loc-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="jd-loc-action-btn history"
          onClick={() => historyFn && historyFn(loc)}
          title="View invoice history"
        >
          📜 History
        </button>
        <button
          className="jd-loc-action-btn"
          onClick={() => focusFn && focusFn(loc)}
        >
          🎯 Jump
        </button>
        <button
          className="jd-loc-action-btn"
          onClick={() => editFn && editFn(loc)}
        >
          ✏️ Edit
        </button>
        <button
          className="jd-loc-action-btn delete"
          onClick={() => deleteFn && deleteFn(loc.id)}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}
