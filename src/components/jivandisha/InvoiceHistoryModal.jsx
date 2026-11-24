import React from 'react'
import HistoryAddInvoiceForm from './HistoryAddInvoiceForm'
import HistoryInvoicesTable from './HistoryInvoicesTable'

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

  const locationSubtitle = [selectedLocationForHistory.city, selectedLocationForHistory.state]
    .filter(Boolean)
    .join(', ')

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
              {selectedLocationForHistory.title} • 📍 {locationSubtitle}
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

          <HistoryAddInvoiceForm
            newInvoiceData={newInvoiceData}
            setNewInvoiceData={setNewInvoiceData}
            handleAddNewInvoice={handleAddNewInvoice}
            uploadingHistoryPdf={uploadingHistoryPdf}
            handleHistoryPdfUpload={handleHistoryPdfUpload}
          />

          <HistoryInvoicesTable
            invoices={invoices}
            loadingInvoices={loadingInvoices}
            handleToggleInvoicePayment={handleToggleInvoicePayment}
            handleDeleteInvoice={handleDeleteInvoice}
          />
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
