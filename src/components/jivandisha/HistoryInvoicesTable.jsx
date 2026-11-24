import React from 'react'
import { getPdfViewUrl } from './jivandishaHelpers'

export default function HistoryInvoicesTable({
  invoices,
  loadingInvoices,
  handleToggleInvoicePayment,
  handleDeleteInvoice
}) {
  return (
    <div className="jd-history-table-wrapper">
      {loadingInvoices ? (
        <div className="jd-empty-history">Loading invoice history...</div>
      ) : invoices.length === 0 ? (
        <div className="jd-empty-history">
          No past invoices recorded yet for this location.
          <br />
          <small>Use the form above to add your first invoice!</small>
        </div>
      ) : (
        <table className="jd-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Books Sent</th>
              <th>Status</th>
              <th>PDF Invoice</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td><strong>{inv.invoice_date || 'N/A'}</strong></td>
                <td>{inv.invoice_number || '—'}</td>
                <td>
                  <span className="jd-metric-badge books">
                    📦 {inv.books_sent || 0}
                  </span>
                </td>
                <td>
                  <span className={`jd-metric-badge ${inv.payment_received ? 'paid' : 'pending'}`}>
                    {inv.payment_received ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </td>
                <td>
                  {inv.pdf_url ? (
                    <a
                      href={getPdfViewUrl(inv.pdf_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jd-table-pdf-link"
                      title={`Open ${inv.pdf_name || 'Invoice PDF'}`}
                    >
                      📄 View PDF
                    </a>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>
                <td style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {inv.notes || '—'}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className={`jd-table-btn ${inv.payment_received ? 'toggle-pending' : 'toggle-pay'}`}
                    onClick={() => handleToggleInvoicePayment(inv)}
                    title="Toggle payment status"
                    style={{ marginRight: '6px' }}
                  >
                    {inv.payment_received ? 'Mark Pending' : 'Mark Paid'}
                  </button>
                  <button
                    className="jd-table-btn del"
                    onClick={() => handleDeleteInvoice(inv.id)}
                    title="Delete invoice"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
