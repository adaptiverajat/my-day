import React from 'react'
import { getPdfViewUrl } from '../jivandishaHelpers'

export default function InvoicePdfAttachmentField({
  pdfUrl,
  pdfName,
  isUploading,
  fileInputRef,
  onUpload,
  onRemove
}) {
  return (
    <div className="jd-merge-field-group">
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Retained Invoice PDF</label>
      {pdfUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <a href={getPdfViewUrl(pdfUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
            📄 {pdfName || 'View Attached Invoice PDF'}
          </a>
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
            ✕ Remove PDF
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
            }}
          />
          <button type="button" className="jd-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
            {isUploading ? '⏳ Uploading PDF...' : '📎 Upload / Attach PDF'}
          </button>
        </div>
      )}
    </div>
  )
}
