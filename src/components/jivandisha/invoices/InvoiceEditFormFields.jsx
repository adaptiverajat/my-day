import React from 'react'

export default function InvoiceEditFormFields({
  editInvoiceForm,
  setEditInvoiceForm,
  editingInvoice,
  locations
}) {
  return (
    <>
      <div className="jd-merge-field-group">
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Center / Location *</label>
        <select
          className="jd-modal-input"
          value={editInvoiceForm.location_id}
          onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, location_id: e.target.value })}
          required
        >
          <option value="">-- Select Center / Location --</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title} {loc.city ? `(${loc.city})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="jd-merge-field-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Invoice Number</label>
          <input
            type="text"
            className="jd-modal-input"
            placeholder="e.g. INV-2026-101"
            value={editInvoiceForm.invoice_number}
            onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, invoice_number: e.target.value })}
          />
        </div>
        <div className="jd-merge-field-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Invoice Date *</label>
          <input
            type="date"
            className="jd-modal-input"
            value={editInvoiceForm.invoice_date}
            onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, invoice_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div className="jd-merge-field-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Books Sent</label>
          <input
            type="number"
            min="0"
            className="jd-modal-input"
            value={editInvoiceForm.books_sent}
            onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, books_sent: e.target.value })}
          />
        </div>
        <div className="jd-merge-field-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            Amount ({editingInvoice?.location_country === 'US' ? '$' : '₹'})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="jd-modal-input"
            placeholder="0.00"
            value={editInvoiceForm.amount}
            onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, amount: e.target.value })}
          />
        </div>
        <div className="jd-merge-field-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Payment Status</label>
          <button
            type="button"
            className={`jd-status-pill ${editInvoiceForm.payment_received ? 'paid' : 'pending'}`}
            onClick={() => setEditInvoiceForm({ ...editInvoiceForm, payment_received: !editInvoiceForm.payment_received })}
            style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
          >
            {editInvoiceForm.payment_received ? '✅ Paid' : '⏳ Pending'}
          </button>
        </div>
      </div>

      <div className="jd-merge-field-group">
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Remarks / Notes</label>
        <textarea
          className="jd-modal-input"
          rows={3}
          placeholder="e.g. Dispatched via DTDC..."
          value={editInvoiceForm.notes}
          onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, notes: e.target.value })}
          style={{ resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>
    </>
  )
}
