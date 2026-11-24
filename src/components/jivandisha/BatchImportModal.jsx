import React from 'react'
import { getPdfViewUrl } from './jivandishaHelpers'

export default function BatchImportModal({
  batchModalOpen,
  setBatchModalOpen,
  isBatchProcessing,
  batchCountry,
  setBatchCountry,
  batchFiles,
  batchProcessedCount,
  batchSuccessCount,
  batchPendingCount,
  handleBatchFileSelect,
  handleRemoveBatchFile,
  handleClearBatchFiles,
  runBatchImport
}) {
  if (!batchModalOpen) return null

  return (
    <div
      className="jd-modal-overlay"
      onClick={() => {
        if (!isBatchProcessing) setBatchModalOpen(false)
      }}
    >
      <div
        className="jd-modal-card jd-batch-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jd-modal-header">
          <div>
            <h3>📑 Batch Import Multiple Invoice PDFs</h3>
            <p className="jd-subtitle" style={{ marginTop: '2px' }}>
              Upload multiple invoice PDFs. Each invoice will be automatically parsed, retained, and added as a new map location.
            </p>
          </div>
          <button
            className="jd-modal-close"
            onClick={() => {
              if (!isBatchProcessing) setBatchModalOpen(false)
            }}
            disabled={isBatchProcessing}
            title={isBatchProcessing ? 'Processing in progress...' : 'Close modal'}
          >
            &times;
          </button>
        </div>

        <div className="jd-modal-body">
          {/* Intro Options */}
          <div className="jd-batch-intro-box">
            <div className="jd-batch-intro-text">
              ✨ <strong>Automated Location Creation:</strong> Recipient title, city, books sent, date, invoice number, and notes will be extracted from each PDF. City coordinates will be resolved automatically.
            </div>
            <div className="jd-batch-intro-options">
              <label>Default Country:</label>
              <select
                value={batchCountry}
                onChange={(e) => setBatchCountry(e.target.value)}
                disabled={isBatchProcessing}
              >
                <option value="IN">🇮🇳 India</option>
                <option value="US">🇺🇸 USA</option>
              </select>
            </div>
          </div>

          {/* Dropzone */}
          <div className="jd-batch-dropzone-area">
            <label className="jd-batch-file-picker-btn">
              <input
                type="file"
                multiple
                accept="application/pdf,.pdf"
                onClick={(e) => {
                  e.target.value = null
                }}
                onChange={handleBatchFileSelect}
                disabled={isBatchProcessing}
                style={{ display: 'none' }}
              />
              <span>📂 Choose Multiple Invoice PDFs</span>
            </label>
            <span className="jd-batch-dropzone-subtext">
              Hold Ctrl (or Shift) to select multiple PDF files at once from your computer
            </span>
          </div>

          {/* Progress Summary Card */}
          {batchFiles.length > 0 && (
            <div className="jd-batch-progress-card">
              <div className="jd-batch-progress-header">
                <span>
                  {isBatchProcessing
                    ? `⏳ Processing ${batchProcessedCount + 1} of ${batchFiles.length} files...`
                    : batchSuccessCount > 0
                    ? `🎉 Finished: ${batchSuccessCount} of ${batchFiles.length} locations added`
                    : `${batchFiles.length} PDF file${batchFiles.length > 1 ? 's' : ''} ready to import`}
                </span>
                <span>
                  {Math.round((batchSuccessCount / batchFiles.length) * 100)}%
                </span>
              </div>
              <div className="jd-batch-progress-track">
                <div
                  className="jd-batch-progress-fill"
                  style={{
                    width: `${(batchSuccessCount / batchFiles.length) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Selected Files List */}
          {batchFiles.length > 0 && (
            <div className="jd-batch-file-list">
              {batchFiles.map((item) => (
                <div
                  key={item.id}
                  className={`jd-batch-file-item ${item.status}`}
                >
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
                      <span className="jd-batch-status-chip pending">
                        ⏳ Ready
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="jd-batch-status-chip processing">
                        🔄 Reading & Locating...
                      </span>
                    )}
                    {item.status === 'success' && item.result && (
                      <>
                        <span className="jd-batch-status-chip success">
                          ✅ Location Added
                        </span>
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
              ))}
            </div>
          )}
        </div>

        <div className="jd-modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {batchFiles.length > 0 && !isBatchProcessing && (
              <button
                type="button"
                className="jd-btn"
                onClick={handleClearBatchFiles}
              >
                Clear All
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="jd-btn"
              onClick={() => setBatchModalOpen(false)}
              disabled={isBatchProcessing}
            >
              {batchSuccessCount > 0 ? 'Close & View on Map' : 'Cancel'}
            </button>

            {batchFiles.length > 0 && !isBatchProcessing && batchPendingCount > 0 && (
              <button
                type="button"
                className="jd-btn primary"
                onClick={runBatchImport}
                style={{ background: '#7c3aed', borderColor: '#6d28d9' }}
              >
                🚀 Start Batch Import ({batchPendingCount} file{batchPendingCount > 1 ? 's' : ''})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
