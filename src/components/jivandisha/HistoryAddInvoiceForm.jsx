import React from 'react'

export default function HistoryAddInvoiceForm({
  newInvoiceData,
  setNewInvoiceData,
  handleAddNewInvoice,
  uploadingHistoryPdf,
  handleHistoryPdfUpload
}) {
  return (
    <div className="jd-add-invoice-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ margin: 0 }}>➕ Record New Invoice / Shipment</h4>
        <label className={`jd-history-upload-btn ${uploadingHistoryPdf ? 'loading' : ''}`} title="Upload invoice PDF to auto-fill and retain">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onClick={(e) => { e.target.value = null }}
            onChange={handleHistoryPdfUpload}
            disabled={uploadingHistoryPdf}
            style={{ display: 'none' }}
          />
          {uploadingHistoryPdf
            ? '⏳ Reading PDF...'
            : newInvoiceData.pdf_url
            ? `✅ ${newInvoiceData.pdf_name || 'PDF Attached'}`
            : '📄 Attach / Auto-Read PDF'}
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
  )
}
