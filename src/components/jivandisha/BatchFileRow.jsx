import React from 'react'
import { getPdfViewUrl } from './jivandishaHelpers'

export default function BatchFileRow({
  item,
  isBatchProcessing,
  handleRemoveBatchFile
}) {
  return (
    <div className={`jd-batch-file-item ${item.status}`}>
      <div className="jd-batch-file-info">
        <span className="jd-batch-file-icon">📄</span>
        <div className="jd-batch-file-names">
          <span className="jd-batch-filename" title={item.name}>
            {item.name}
          </span>
          <span className="jd-batch-filesize">
            {(item.size / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>

      <div className="jd-batch-file-status">
        {item.status === 'pending' && (
          <span className="jd-batch-status-chip pending">⏳ Ready</span>
        )}
        {item.status === 'processing' && (
          <span className="jd-batch-status-chip processing">🔄 Reading & Locating...</span>
        )}
        {item.status === 'success' && item.result && (
          <>
            <span className="jd-batch-status-chip success">✅ Location Added</span>
            <span
              className="jd-batch-extracted-chip"
              title={`${item.result.title} • ${item.result.city} • ${item.result.books_sent} books`}
            >
              <strong>{item.result.title}</strong> ({item.result.city || '—'}) • {item.result.books_sent} books
            </span>
            {item.result.pdfUrl && (
              <a
                href={getPdfViewUrl(item.result.pdfUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="jd-table-pdf-link"
                title="View retained invoice PDF"
              >
                👁️ View
              </a>
            )}
          </>
        )}
        {item.status === 'error' && (
          <span className="jd-batch-status-chip error" title={item.error}>
            ⚠️ {item.error}
          </span>
        )}

        {!isBatchProcessing && item.status !== 'processing' && (
          <button
            type="button"
            className="jd-pdf-btn-remove"
            onClick={() => handleRemoveBatchFile(item.id)}
            title="Remove file"
            style={{ padding: '2px 6px', fontSize: '0.72rem' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
