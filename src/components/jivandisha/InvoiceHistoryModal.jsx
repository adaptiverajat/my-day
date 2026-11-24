import React from 'react'
import { getPdfViewUrl } from './jivandishaHelpers'

export default function InvoiceHistoryModal({
  historyModalOpen,
  setHistoryModalOpen,
  selectedLocationForHistory,
  invoices,
  historyTotalBooks,
  historyPaidCount,
  uploadingHistoryPdf,
  handleHistoryPdfUpload,
  newInvoiceData,
  setNewInvoiceData,
  handleAddNewInvoice,
  loadingInvoices,
  handleToggleInvoicePayment,
  handleDeleteInvoice
}) {
  if (!historyModalOpen || !selectedLocationForHistory) return null

  return (
    <div className="jd-modal-overlay" onClick={() => setHistoryModalOpen(false)}>
      <div
        className="jd-modal-card jd-history-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jd-modal-header">
          <div>
            <h3>📜 Past Invoices & Shipments</h3>
            <p className="jd-subtitle" style={{ marginTop: '2px' }}>
              {selectedLocationForHistory.title} • 📍{' '}
              {[selectedLocationForHistory.city, selectedLocationForHistory.state]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
          <button
            className="jd-modal-close"
            onClick={() => setHistoryModalOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className="jd-modal-body">
          {/* Summary Stats */}
          <div className="jd-history-summary-grid">
            <div className="jd-history-stat-card">
              <div className="jd-stat-number">{invoices.length}</div>
              <div className="jd-stat-label">Total Invoices</div>
            </div>
            <div className="jd-history-stat-card">
              <div className="jd-stat-number">{historyTotalBooks}</div>
              <div className="jd-stat-label">Total Books Sent</div>
            </div>
            <div className="jd-history-stat-card">
              <div className="jd-stat-number">
                {historyPaidCount} / {invoices.length}
              </div>
              <div className="jd-stat-label">Paid Invoices</div>
            </div>
          </div>

          {/* Add New Invoice Box */}
          <div className="jd-add-invoice-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0 }}>➕ Record New Invoice / Shipment</h4>
              <label className={`jd-history-upload-btn ${uploadingHistoryPdf ? 'loading' : ''}`} title="Upload invoice PDF to auto-fill and retain">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onClick={(e) => {
                    e.target.value = null
                  }}
                  onChange={handleHistoryPdfUpload}
                  disabled={uploadingHistoryPdf}
                  style={{ display: 'none' }}
                />
                {uploadingHistoryPdf ? '⏳ Reading PDF...' : newInvoiceData.pdf_url ? `✅ ${newInvoiceData.pdf_name || 'PDF Attached'}` : '📄 Attach / Auto-Read PDF'}
              </label>
            </div>
            <form onSubmit={handleAddNewInvoice}>
              <div className="jd-add-inv-row">
                <div className="jd-form-group" style={{ minWidth: '120px' }}>
                  <label>Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.invoice_date}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, invoice_date: e.target.value })
                    }
                  />
                </div>

                <div className="jd-form-group" style={{ minWidth: '100px' }}>
                  <label>Books Sent *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={newInvoiceData.books_sent || ''}
                    onChange={(e) =>
                      setNewInvoiceData({
                        ...newInvoiceData,
                        books_sent: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
                      })
                    }
                  />
                </div>

                <div className="jd-form-group" style={{ minWidth: '110px' }}>
                  <label>Invoice # / Ref</label>
                  <input
                    type="text"
                    placeholder="INV-001"
                    value={newInvoiceData.invoice_number}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, invoice_number: e.target.value })
                    }
                  />
                </div>

                <div className="jd-form-group" style={{ minWidth: '140px' }}>
                  <label>Notes</label>
                  <input
                    type="text"
                    placeholder="Courier / notes"
                    value={newInvoiceData.notes}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newInvoiceData.payment_received}
                      onChange={(e) =>
                        setNewInvoiceData({
                          ...newInvoiceData,
                          payment_received: e.target.checked
                        })
                      }
                    />
                    Paid
                  </label>
                </div>

                <button type="submit" className="jd-btn primary" style={{ height: '34px' }}>
                  + Add Invoice
                </button>
              </div>
            </form>
          </div>

          {/* Invoices List / Table */}
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
                        <span
                          className={`jd-metric-badge ${
                            inv.payment_received ? 'paid' : 'pending'
                          }`}
                        >
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
                          className={`jd-table-btn ${
                            inv.payment_received ? 'toggle-pending' : 'toggle-pay'
                          }`}
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
        </div>

        <div className="jd-modal-footer">
          <button
            type="button"
            className="jd-btn"
            onClick={() => setHistoryModalOpen(false)}
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  )
}
