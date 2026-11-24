import React from 'react'
import { getPdfViewUrl } from './jivandishaHelpers'

export default function LocationPdfSection({
  formData,
  handleRemovePdf,
  uploadingPdf,
  handlePdfUpload,
  setModalOpen,
  setBatchModalOpen,
  pdfStatusMsg
}) {
  return (
    <div className="jd-pdf-upload-card">
      <div className="jd-pdf-card-header">
        <div className="jd-pdf-card-title-group">
          <span className="jd-pdf-badge-icon">📄</span>
          <div>
            <div className="jd-pdf-title-text">
              Invoice PDF Auto-Read & Permanent Retention
            </div>
            <div className="jd-pdf-desc-text">
              Upload invoice PDF to extract books sent, date, contacts & city automatically. File is retained permanently.
            </div>
          </div>
        </div>

        {formData.invoice_pdf_url && (
          <div className="jd-pdf-actions-cluster">
            <a
              href={getPdfViewUrl(formData.invoice_pdf_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="jd-pdf-btn-view"
            >
              👁️ View PDF
            </a>
            <button
              type="button"
              className="jd-pdf-btn-remove"
              onClick={handleRemovePdf}
              title="Remove PDF"
            >
              ✕ Remove
            </button>
          </div>
        )}
      </div>

      {!formData.invoice_pdf_url ? (
        <div className="jd-pdf-dropzone">
          <label className={`jd-pdf-file-picker ${uploadingPdf ? 'loading' : ''}`}>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onClick={(e) => { e.target.value = null }}
              onChange={handlePdfUpload}
              disabled={uploadingPdf}
              style={{ display: 'none' }}
            />
            {uploadingPdf ? '⏳ Reading & Parsing PDF...' : '📂 Choose Invoice PDF to Auto-Fill'}
          </label>
          <span className="jd-pdf-subhint">
            PDF will be saved permanently on server and accessible from invoice history
          </span>
          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontSize: '0.74rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 600,
                padding: 0
              }}
              onClick={() => {
                setModalOpen(false)
                setBatchModalOpen(true)
              }}
            >
              📑 Have several invoices? Switch to Batch PDF Import ❯
            </button>
          </div>
        </div>
      ) : (
        <div className="jd-pdf-attached-bar">
          <span className="jd-pdf-retained-chip">🔒 Retained</span>
          <span className="jd-pdf-file-name">{formData.invoice_pdf_name || 'Invoice.pdf'}</span>
        </div>
      )}

      {pdfStatusMsg && (
        <div className={`jd-pdf-status-alert ${pdfStatusMsg.type}`}>
          {pdfStatusMsg.type === 'info' && '⏳ '}
          {pdfStatusMsg.type === 'success' && '✨ '}
          {pdfStatusMsg.type === 'error' && '⚠️ '}
          {pdfStatusMsg.text}
        </div>
      )}
    </div>
  )
}
