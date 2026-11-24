import React from 'react'

const QuickBtn = ({ onClick, children }) => (
  <button type="button" className="jd-merge-quick-btn" onClick={onClick}>{children}</button>
)

export default function InvoicesMergeValuesForm({
  mergeInvoiceForm,
  setMergeInvoiceForm,
  invA,
  invB,
  locations
}) {
  const sumBooks = (Number(invA.books_sent) || 0) + (Number(invB.books_sent) || 0)
  const sumAmount = invA.amount !== null && invB.amount !== null ? (Number(invA.amount) + Number(invB.amount)).toFixed(2) : null

  return (
    <div className="jd-merge-preview-section">
      <div className="jd-merge-preview-title">
        <span>✏️</span>
        <span>2. Review & Customize Consolidated Record Values:</span>
      </div>

      <div className="jd-merge-preview-grid">
        <div className="jd-merge-field-group">
          <label>Invoice Number</label>
          <input
            type="text"
            className="jd-merge-field-input"
            value={mergeInvoiceForm.invoice_number}
            onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_number: e.target.value })}
          />
          <div className="jd-merge-quick-options">
            {invA.invoice_number && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_number: invA.invoice_number })}>Use #{invA.invoice_number}</QuickBtn>}
            {invB.invoice_number && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_number: invB.invoice_number })}>Use #{invB.invoice_number}</QuickBtn>}
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Invoice Date</label>
          <input
            type="date"
            className="jd-merge-field-input"
            value={mergeInvoiceForm.invoice_date}
            onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_date: e.target.value })}
          />
          <div className="jd-merge-quick-options">
            {invA.invoice_date && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_date: invA.invoice_date })}>#{invA.invoice_number || 'A'}: {invA.invoice_date}</QuickBtn>}
            {invB.invoice_date && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_date: invB.invoice_date })}>#{invB.invoice_number || 'B'}: {invB.invoice_date}</QuickBtn>}
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Books Sent</label>
          <input
            type="number"
            min="0"
            className="jd-merge-field-input"
            value={mergeInvoiceForm.books_sent}
            onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: e.target.value })}
          />
          <div className="jd-merge-quick-options">
            <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: sumBooks })}>Sum: {sumBooks}</QuickBtn>
            <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: Number(invA.books_sent) || 0 })}>Keep #{invA.invoice_number || 'A'} ({invA.books_sent || 0})</QuickBtn>
            <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: Number(invB.books_sent) || 0 })}>Keep #{invB.invoice_number || 'B'} ({invB.books_sent || 0})</QuickBtn>
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="jd-merge-field-input"
            value={mergeInvoiceForm.amount}
            onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: e.target.value })}
          />
          <div className="jd-merge-quick-options">
            {sumAmount !== null && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: sumAmount })}>Sum: {sumAmount}</QuickBtn>}
            {invA.amount !== null && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: Number(invA.amount).toFixed(2) })}>#{invA.invoice_number || 'A'}: {Number(invA.amount).toFixed(2)}</QuickBtn>}
            {invB.amount !== null && <QuickBtn onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: Number(invB.amount).toFixed(2) })}>#{invB.invoice_number || 'B'}: {Number(invB.amount).toFixed(2)}</QuickBtn>}
          </div>
        </div>

        <div className="jd-merge-field-group">
          <label>Payment Status</label>
          <button
            type="button"
            className={`jd-status-pill ${mergeInvoiceForm.payment_received ? 'paid' : 'pending'}`}
            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, payment_received: !mergeInvoiceForm.payment_received })}
            style={{ padding: '8px 12px', fontSize: '0.8rem', width: 'fit-content' }}
          >
            {mergeInvoiceForm.payment_received ? '✅ Paid' : '⏳ Pending'}
          </button>
        </div>

        <div className="jd-merge-field-group">
          <label>Associated Center / Location</label>
          <select
            className="jd-merge-field-input"
            value={mergeInvoiceForm.location_id}
            onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, location_id: e.target.value })}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title} {loc.city ? `(${loc.city})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="jd-merge-field-group">
        <label>Remarks / Notes</label>
        <textarea
          className="jd-merge-field-textarea"
          value={mergeInvoiceForm.notes}
          onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, notes: e.target.value })}
          placeholder="Consolidated remarks..."
        />
      </div>
    </div>
  )
}
