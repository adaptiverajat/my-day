import React from 'react'

export default function InvoicesVerifyTableRow({
  order,
  idx,
  currency,
  onToggleSelect,
  onUpdateField,
  onTogglePayment,
  onRemoveRow
}) {
  const hasDbDup = Boolean(order.dbDuplicate)

  return (
    <tr className={`${!order.selected ? 'unselected' : ''} ${hasDbDup ? 'has-dup' : ''}`}>
      <td style={{ textAlign: 'center' }}>
        <input type="checkbox" checked={Boolean(order.selected)} onChange={() => onToggleSelect(order.id)} />
      </td>
      <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
      <td>
        <input
          type="text"
          className="jd-verify-input"
          value={order.location_title}
          placeholder="Location Title"
          onChange={(e) => onUpdateField(order.id, 'location_title', e.target.value)}
        />
        <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className={`jd-verify-badge ${order.is_matched_location ? 'matched' : 'new'}`}>
            {order.is_matched_location ? '✓ Matched Location' : '➕ New Location'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{order.country === 'US' ? '🇺🇸' : '🇮🇳'}</span>
        </div>
      </td>
      <td>
        <input
          type="text"
          className="jd-verify-input"
          placeholder="Inv #"
          value={order.invoice_number}
          onChange={(e) => onUpdateField(order.id, 'invoice_number', e.target.value)}
        />
      </td>
      <td>
        <input
          type="date"
          className="jd-verify-input"
          value={order.invoice_date}
          onChange={(e) => onUpdateField(order.id, 'invoice_date', e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          className="jd-verify-input"
          value={order.books_sent}
          onChange={(e) => onUpdateField(order.id, 'books_sent', e.target.value)}
        />
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{currency}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            className="jd-verify-input"
            placeholder="0.00"
            value={order.amount !== null && order.amount !== undefined ? order.amount : ''}
            onChange={(e) => onUpdateField(order.id, 'amount', e.target.value)}
          />
        </div>
      </td>
      <td>
        <button
          type="button"
          className={`jd-status-pill ${order.payment_received ? 'paid' : 'pending'}`}
          onClick={() => onTogglePayment(order.id)}
          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          title="Click to toggle Payment status"
        >
          {order.payment_received ? '✅ Paid' : '⏳ Pending'}
        </button>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            className="jd-verify-input"
            placeholder="City"
            value={order.city}
            onChange={(e) => onUpdateField(order.id, 'city', e.target.value)}
          />
          <input
            type="text"
            className="jd-verify-input"
            placeholder="State"
            value={order.state}
            onChange={(e) => onUpdateField(order.id, 'state', e.target.value)}
          />
        </div>
      </td>
      <td>
        <input
          type="text"
          className="jd-verify-input"
          placeholder="Contact Person"
          value={order.decision_maker_name}
          onChange={(e) => onUpdateField(order.id, 'decision_maker_name', e.target.value)}
        />
        {order.decision_maker_phone && (
          <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
            📞 {order.decision_maker_phone}
          </span>
        )}
      </td>
      <td>
        {hasDbDup ? (
          <span className="jd-verify-badge dup" title={`Matches DB Invoice #${order.dbDuplicate.invoice_number || 'N/A'}`}>
            ⚠️ In DB: #{order.dbDuplicate.invoice_number || 'N/A'} ({order.dbDuplicate.invoice_date})
          </span>
        ) : order.sheetDuplicate ? (
          <span className="jd-verify-badge dup" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
            ⚠️ Duplicate in Sheet
          </span>
        ) : (
          <span className="jd-verify-badge clean">✅ Clean</span>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="jd-loc-action-btn del"
          onClick={() => onRemoveRow(order.id)}
          title="Remove row from batch"
          style={{ padding: '2px 5px', fontSize: '0.8rem' }}
        >
          🗑️
        </button>
      </td>
    </tr>
  )
}
