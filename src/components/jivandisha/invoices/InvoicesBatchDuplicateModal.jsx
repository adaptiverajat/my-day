import React from 'react'

export default function InvoicesBatchDuplicateModal({
  showBatchDuplicateModal,
  setShowBatchDuplicateModal,
  selectedDups,
  selectedCount,
  isSavingBatch,
  handleSaveOnlyClean,
  handleSaveOrdersToDb
}) {
  if (!showBatchDuplicateModal) return null

  return (
    <div className="jd-modal-overlay" onClick={() => setShowBatchDuplicateModal(false)}>
      <div
        className="jd-modal-card jd-duplicate-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '720px' }}
      >
        <div className="jd-modal-header" style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#92400e', fontWeight: 700 }}>
                Duplicate Invoice Records Detected in Batch
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#b45309' }}>
                {selectedDups.length} of the {selectedCount} selected orders match an existing invoice in the database.
              </p>
            </div>
          </div>
          <button type="button" className="jd-modal-close" onClick={() => setShowBatchDuplicateModal(false)} title="Close modal">
            ✕
          </button>
        </div>

        <div className="jd-modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '0.82rem', color: '#334155' }}>
            The following entries match existing invoices already in the system:
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #fde68a', borderRadius: '8px', background: '#fffdf5' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', color: '#92400e', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px' }}>Sheet Order</th>
                  <th style={{ padding: '6px 10px' }}>Date</th>
                  <th style={{ padding: '6px 10px' }}>Price</th>
                  <th style={{ padding: '6px 10px' }}>Existing DB Match</th>
                </tr>
              </thead>
              <tbody>
                {selectedDups.map((dup) => (
                  <tr key={dup.id} style={{ borderBottom: '1px solid #fef3c7' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>
                      #{dup.invoice_number || 'New'} - {dup.location_title}
                    </td>
                    <td style={{ padding: '6px 10px' }}>{dup.invoice_date}</td>
                    <td style={{ padding: '6px 10px', fontWeight: 600, color: '#991b1b' }}>
                      {dup.country === 'US' ? '$' : '₹'}{parseFloat(dup.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '6px 10px', color: '#b45309' }}>
                      Invoice #{dup.dbDuplicate?.invoice_number || 'N/A'} for {dup.dbDuplicate?.location_title}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="jd-duplicate-prompt-banner">
            <span style={{ fontSize: '1.1rem' }}>❓</span>
            <div>
              <strong>Decision Required:</strong> Would you like to proceed and save all {selectedCount} orders including duplicates, save only non-duplicates ({selectedCount - selectedDups.length}), or cancel to review?
            </div>
          </div>
        </div>

        <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="jd-btn" onClick={() => setShowBatchDuplicateModal(false)} style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
            ✕ Cancel / Review Table
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedCount - selectedDups.length > 0 && (
              <button
                type="button"
                className="jd-btn"
                onClick={handleSaveOnlyClean}
                disabled={isSavingBatch}
                style={{ padding: '7px 14px', fontSize: '0.82rem', background: '#ffffff', borderColor: '#059669', color: '#059669', fontWeight: 600 }}
              >
                Save Only Clean ({selectedCount - selectedDups.length})
              </button>
            )}

            <button
              type="button"
              className="jd-btn primary"
              onClick={() => handleSaveOrdersToDb(true)}
              disabled={isSavingBatch}
              style={{ background: '#d97706', borderColor: '#b45309', padding: '7px 16px', fontSize: '0.82rem' }}
            >
              {isSavingBatch ? 'Saving...' : `Proceed & Save All (${selectedCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
