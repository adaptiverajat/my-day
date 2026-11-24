import React from 'react'

export default function LocationInvoiceFields({
  formData,
  setFormData,
  setCitySuggestions,
  setShowCityDropdown
}) {
  return (
    <>
      <div className="jd-form-grid-2">
        <div className="jd-form-row-h">
          <label>Country *</label>
          <div className="jd-form-input-box">
            <select
              value={formData.country}
              onChange={(e) => {
                setFormData({ ...formData, country: e.target.value })
                setCitySuggestions([])
                setShowCityDropdown(false)
              }}
            >
              <option value="IN">🇮🇳 India</option>
              <option value="US">🇺🇸 USA</option>
            </select>
          </div>
        </div>

        <div className="jd-form-row-h">
          <label>Title / Business *</label>
          <div className="jd-form-input-box">
            <input
              type="text"
              required
              placeholder="e.g. Sapna Book House / NYC Barnes & Noble"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className="jd-form-grid-2">
        <div className="jd-form-row-h">
          <label>Invoice #</label>
          <div className="jd-form-input-box">
            <input
              type="text"
              placeholder="e.g. JD20260611002"
              value={formData.invoice_number || ''}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            />
          </div>
        </div>

        <div className="jd-form-row-h">
          <label>Date Invoiced</label>
          <div className="jd-form-input-box">
            <input
              type="date"
              value={formData.invoice_date}
              onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="jd-form-grid-2">
        <div className="jd-form-row-h">
          <label>Books Sent</label>
          <div className="jd-form-input-box">
            <input
              type="number"
              min="0"
              placeholder="e.g. 100"
              value={formData.books_sent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  books_sent: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
                })
              }
            />
          </div>
        </div>

        <div className="jd-form-row-h">
          <label>Payment Status</label>
          <div className="jd-form-input-box">
            <div
              className={`jd-checkbox-card ${formData.payment_received ? 'checked' : ''}`}
              style={{ width: '100%', padding: '6px 10px' }}
              onClick={() =>
                setFormData((prev) => ({ ...prev, payment_received: !prev.payment_received }))
              }
            >
              <input
                type="checkbox"
                checked={formData.payment_received}
                onChange={(e) =>
                  setFormData({ ...formData, payment_received: e.target.checked })
                }
                onClick={(e) => e.stopPropagation()}
              />
              <div className="jd-checkbox-info">
                <span className="jd-checkbox-title">
                  {formData.payment_received ? '✅ Payment Received' : '⏳ Payment Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
