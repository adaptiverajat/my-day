import React from 'react'
import InvoiceEditFormFields from './InvoiceEditFormFields'
import InvoicePdfAttachmentField from './InvoicePdfAttachmentField'

export default function InvoicesEditModal({
  editingInvoice,
  editInvoiceForm,
  setEditInvoiceForm,
  isSavingEditInvoice,
  isUploadingEditPdf,
  editPdfInputRef,
  handleCloseEditInvoice,
  handleEditPdfUpload,
  handleRemoveEditPdf,
  handleSaveEditInvoice,
  locations
}) {
  if (!editingInvoice) return null

  return (
    <div className="jd-modal-overlay" onClick={handleCloseEditInvoice}>
      <div className="jd-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '640px', width: '95%' }}>
        <div className="jd-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>✏️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                Edit Invoice #{editingInvoice.invoice_number || editingInvoice.id}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Modify invoice details, payment status, location, or notes.
              </p>
            </div>
          </div>
          <button type="button" className="jd-modal-close" onClick={handleCloseEditInvoice} title="Close modal">✕</button>
        </div>

        <form onSubmit={handleSaveEditInvoice}>
          <div className="jd-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <InvoiceEditFormFields
              editInvoiceForm={editInvoiceForm}
              setEditInvoiceForm={setEditInvoiceForm}
              editingInvoice={editingInvoice}
              locations={locations}
            />

            <InvoicePdfAttachmentField
              pdfUrl={editInvoiceForm.pdf_url}
              pdfName={editInvoiceForm.pdf_name}
              isUploading={isUploadingEditPdf}
              fileInputRef={editPdfInputRef}
              onUpload={handleEditPdfUpload}
              onRemove={handleRemoveEditPdf}
            />
          </div>

          <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className="jd-btn" onClick={handleCloseEditInvoice} disabled={isSavingEditInvoice}>✕ Cancel</button>
            <button type="submit" className="jd-btn primary" disabled={isSavingEditInvoice} style={{ padding: '8px 22px', fontSize: '0.86rem' }}>
              {isSavingEditInvoice ? '💾 Saving Changes...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
