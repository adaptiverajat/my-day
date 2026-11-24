import React from 'react'
import InvoicesMergeValuesForm from './InvoicesMergeValuesForm'

export default function InvoicesMergeModal({
  showInvoiceMergeModal,
  setShowInvoiceMergeModal,
  selectedInvoicesForMerge,
  primaryInvoiceId,
  handleSwitchPrimaryInvoice,
  mergeInvoiceForm,
  setMergeInvoiceForm,
  handleConfirmMergeInvoices,
  isMergingInvoices,
  locations
}) {
  if (!showInvoiceMergeModal || selectedInvoicesForMerge.length !== 2) return null

  const [invA, invB] = selectedInvoicesForMerge
  const isA = primaryInvoiceId === invA.id
  const primary = isA ? invA : invB
  const duplicate = isA ? invB : invA

  const renderCard = (inv, isPrim) => (
    <div
      className={`jd-merge-record-card ${isPrim ? 'is-primary' : 'is-duplicate'}`}
      onClick={() => handleSwitchPrimaryInvoice(inv.id)}
    >
      <div className="jd-merge-record-header">
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}>
          <input
            type="radio"
            name="primary_invoice_choice"
            checked={isPrim}
            onChange={() => handleSwitchPrimaryInvoice(inv.id)}
          />
          Invoice #{inv.invoice_number || inv.id}
        </label>
        <span className={`jd-merge-role-badge ${isPrim ? 'keep' : 'delete'}`}>
          {isPrim ? '✓ Primary (Keep)' : '⚠️ Duplicate (Delete)'}
        </span>
      </div>
      <div className="jd-merge-card-details">
        <div className="jd-merge-card-row"><span>Location:</span><span>{inv.location_title || '—'}</span></div>
        <div className="jd-merge-card-row"><span>Date:</span><span>{inv.invoice_date || '—'}</span></div>
        <div className="jd-merge-card-row"><span>Books Sent:</span><span>📦 {inv.books_sent || 0}</span></div>
        <div className="jd-merge-card-row"><span>Amount:</span><span>{inv.amount !== null ? `${inv.location_country === 'US' ? '$' : '₹'}${Number(inv.amount).toFixed(2)}` : '—'}</span></div>
        <div className="jd-merge-card-row"><span>Status:</span><span>{inv.payment_received ? '✅ Paid' : '⏳ Pending'}</span></div>
        <div className="jd-merge-card-row"><span>Contact:</span><span>{inv.decision_maker_name || '—'}</span></div>
        <div className="jd-merge-card-row"><span>Remarks:</span><span>{inv.notes || '—'}</span></div>
      </div>
    </div>
  )

  return (
    <div className="jd-modal-overlay" onClick={() => setShowInvoiceMergeModal(false)}>
      <div className="jd-modal-card jd-merge-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '820px', width: '95%' }}>
        <div className="jd-modal-header" style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🔀</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#5b21b6', fontWeight: 700 }}>Merge 2 Duplicate Invoices</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#6d28d9' }}>
                Choose which invoice to keep as primary. The duplicate invoice will be permanently removed.
              </p>
            </div>
          </div>
          <button type="button" className="jd-modal-close" onClick={() => setShowInvoiceMergeModal(false)} title="Close modal">✕</button>
        </div>

        <div className="jd-merge-modal-content">
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              1. Select the Primary Record to Keep (click to select):
            </div>
            <div className="jd-merge-records-grid">
              {renderCard(invA, isA)}
              {renderCard(invB, !isA)}
            </div>
          </div>

          <InvoicesMergeValuesForm
            mergeInvoiceForm={mergeInvoiceForm}
            setMergeInvoiceForm={setMergeInvoiceForm}
            invA={invA}
            invB={invB}
            locations={locations}
          />

          <div className="jd-merge-warning-banner">
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Permanent DB Change:</strong> Clicking <em>Confirm & Merge Invoices</em> will update Primary Invoice <strong>#{primary.invoice_number || primary.id}</strong> and permanently delete Duplicate Invoice <strong>#{duplicate.invoice_number || duplicate.id}</strong>.
            </div>
          </div>
        </div>

        <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', padding: '12px 20px' }}>
          <button type="button" className="jd-btn" onClick={() => setShowInvoiceMergeModal(false)} disabled={isMergingInvoices}>✕ Cancel</button>
          <button type="button" className="jd-btn primary jd-btn-merge-action" onClick={handleConfirmMergeInvoices} disabled={isMergingInvoices} style={{ padding: '8px 20px', fontSize: '0.86rem' }}>
            {isMergingInvoices ? 'Merging Invoices...' : '🔀 Confirm & Merge Invoices (Delete Duplicate)'}
          </button>
        </div>
      </div>
    </div>
  )
}
