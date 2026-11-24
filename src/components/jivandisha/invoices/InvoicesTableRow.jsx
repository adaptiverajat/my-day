import React from 'react'
import { getPdfViewUrl } from '../jivandishaHelpers'

export default function InvoicesTableRow({
  inv,
  isSelected,
  selectedCount,
  onToggleSelect,
  onTogglePayment,
  onOpenEdit,
  onDelete
}) {
  const currencySymbol = inv.location_country === 'US' ? '$' : '₹'

  return (
    <tr className={isSelected ? 'jd-row-selected' : ''}>
      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(inv.id)}
          title={
            isSelected
              ? 'Selected for merge (click to uncheck)'
              : selectedCount >= 2
              ? '2 already selected. Clicking replaces the second.'
              : 'Select to merge duplicates'
          }
        />
      </td>
      <td style={{ fontWeight: 700, color: '#0f172a' }}>
        {inv.invoice_number ? `#${inv.invoice_number}` : '—'}
      </td>
      <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
        {inv.invoice_date || '—'}
      </td>
      <td>
        <span className="jd-table-loc-title">
          {inv.location_country === 'US' ? '🇺🇸' : '🇮🇳'} {inv.location_title}
        </span>
        {(inv.location_city || inv.location_state) && (
          <span className="jd-table-sub">
            {[inv.location_city, inv.location_state].filter(Boolean).join(', ')}
          </span>
        )}
      </td>
      <td>
        <button
          type="button"
          className={`jd-status-pill ${inv.payment_received ? 'paid' : 'pending'}`}
          onClick={() => onTogglePayment(inv)}
          title="Click to toggle payment status"
        >
          {inv.payment_received ? '✅ Paid' : '⏳ Pending'}
        </button>
      </td>
      <td>
        <span className="jd-books-pill">📦 {inv.books_sent || 0}</span>
      </td>
      <td style={{ fontWeight: 600 }}>
        {inv.amount !== null && inv.amount !== undefined
          ? `${currencySymbol}${Number(inv.amount).toFixed(2)}`
          : '—'}
      </td>
      <td>
        <div style={{ fontWeight: 500 }}>{inv.decision_maker_name || '—'}</div>
        {inv.decision_maker_phone && (
          <span className="jd-table-sub">📞 {inv.decision_maker_phone}</span>
        )}
      </td>
      <td>
        <div className="jd-table-remarks">{inv.notes || '—'}</div>
      </td>
      <td>
        {inv.pdf_url ? (
          <a
            href={getPdfViewUrl(inv.pdf_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="jd-table-pdf-link"
            title="View retained invoice PDF"
          >
            📄 PDF
          </a>
        ) : (
          '—'
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
          <button
            type="button"
            className="jd-loc-action-btn edit"
            onClick={() => onOpenEdit(inv)}
            title="Edit this invoice"
            style={{ padding: '3px 8px', fontSize: '0.76rem', borderRadius: '4px' }}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="jd-loc-action-btn del"
            onClick={() => onDelete(inv.id)}
            title="Delete this invoice"
            style={{ padding: '3px 6px', fontSize: '0.76rem' }}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  )
}
