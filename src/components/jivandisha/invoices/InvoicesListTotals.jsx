import React from 'react'

export default function InvoicesListTotals({
  invoiceListTotals,
  invoiceSearchTerm,
  invoiceFilterCountry,
  invoiceFilterPayment,
  filteredCount,
  totalCount
}) {
  return (
    <div className="jd-list-totals-banner">
      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        📊 Invoices Totals:
      </span>

      <div className="jd-totals-chip count" title="Total Books Sent across listed invoices">
        <span className="chip-label">Total Books</span>
        <span className="chip-val">📦 {invoiceListTotals.books.toLocaleString()}</span>
      </div>

      <div className="jd-totals-chip collection" title="Total Invoices / Collection Amount">
        <span className="chip-label">Total Collection / Invoices</span>
        <span className="chip-val">
          💰 ₹{invoiceListTotals.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="jd-totals-chip" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }} title="Total Amount Received / Paid">
        <span className="chip-label" style={{ color: '#166534' }}>Paid Collection</span>
        <span className="chip-val" style={{ color: '#15803d' }}>
          ✅ ₹{invoiceListTotals.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <small style={{ fontSize: '0.74rem', marginLeft: '5px', fontWeight: 500, color: '#166534' }}>
            ({invoiceListTotals.paidCount} paid)
          </small>
        </span>
      </div>

      <div className="jd-totals-chip" style={{ borderColor: '#fde68a', background: '#fffbeb' }} title="Total Amount Pending">
        <span className="chip-label" style={{ color: '#92400e' }}>Pending Collection</span>
        <span className="chip-val" style={{ color: '#b45309' }}>
          ⏳ ₹{invoiceListTotals.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <small style={{ fontSize: '0.74rem', marginLeft: '5px', fontWeight: 500, color: '#92400e' }}>
            ({invoiceListTotals.pendingCount} pending)
          </small>
        </span>
      </div>

      {(invoiceSearchTerm || invoiceFilterCountry !== 'ALL' || invoiceFilterPayment !== 'ALL') && (
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
          (Filtered: showing {filteredCount} of {totalCount} invoices)
        </span>
      )}
    </div>
  )
}
