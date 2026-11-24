import React from 'react'
import { getPdfViewUrl } from './jivandishaHelpers'

export default function LocationModal({
  modalOpen,
  setModalOpen,
  editingLocation,
  formData,
  setFormData,
  handleSaveLocation,
  handleRemovePdf,
  uploadingPdf,
  handlePdfUpload,
  setBatchModalOpen,
  pdfStatusMsg,
  cityInputRef,
  isSearchingCity,
  handleCityChange,
  citySuggestions,
  setCitySuggestions,
  showCityDropdown,
  setShowCityDropdown,
  handleSelectCitySuggestion
}) {
  if (!modalOpen) return null

  return (
    <div className="jd-modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="jd-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="jd-modal-header">
          <h3>{editingLocation ? '✏️ Edit Location Details' : '📍 Add New Location Details'}</h3>
          <button className="jd-modal-close" onClick={() => setModalOpen(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveLocation}>
          <div className="jd-modal-body">
            {/* PDF Invoice Upload & Extraction Card */}
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
                      onClick={(e) => {
                        e.target.value = null
                      }}
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

            {/* 2-Column Grid Row 1: Country & Title */}
            <div className="jd-form-grid-2">
              <div className="jd-form-row-h">
                <label>Country *</label>
                <div className="jd-form-input-box">
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      const newCountry = e.target.value
                      setFormData({ ...formData, country: newCountry })
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

            {/* 2-Column Grid Row 2: City & State */}
            <div className="jd-form-grid-2">
              <div className="jd-form-row-h">
                <label>
                  City * {isSearchingCity && <span className="jd-form-hint">(...)</span>}
                </label>
                <div className="jd-form-input-box jd-autocomplete-wrapper">
                  <input
                    ref={cityInputRef}
                    type="text"
                    required
                    placeholder="Type city (e.g. Mumbai, New York)"
                    value={formData.city}
                    onChange={handleCityChange}
                    onFocus={() => {
                      if (citySuggestions.length > 0) setShowCityDropdown(true)
                    }}
                    autoComplete="off"
                  />

                  {/* Autocomplete Dropdown List */}
                  {showCityDropdown && citySuggestions.length > 0 && (
                    <ul className="jd-autocomplete-dropdown">
                      {citySuggestions.map((item, idx) => (
                        <li
                          key={idx}
                          className="jd-autocomplete-item"
                          onMouseDown={() => handleSelectCitySuggestion(item)}
                        >
                          <span className="jd-ac-city">🏙️ {item.city}</span>
                          {item.state && <span className="jd-ac-state">{item.state}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="jd-form-row-h">
                <label>State / Region</label>
                <div className="jd-form-input-box">
                  <input
                    type="text"
                    placeholder="Auto-populated from city"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="jd-contacts-section">
              <div className="jd-form-row-h">
                <label>👔 Decision Maker</label>
                <div className="jd-form-input-box">
                  <input
                    type="text"
                    placeholder="Name (e.g. Ramesh Sharma)"
                    value={formData.decision_maker_name}
                    onChange={(e) =>
                      setFormData({ ...formData, decision_maker_name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g. +91 98765 12345)"
                    value={formData.decision_maker_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, decision_maker_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="jd-form-row-h">
                <label>📦 Inventory Keeper</label>
                <div className="jd-form-input-box">
                  <input
                    type="text"
                    placeholder="Name (e.g. Suresh Patel)"
                    value={formData.inventory_keeper_name}
                    onChange={(e) =>
                      setFormData({ ...formData, inventory_keeper_name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone (e.g. +91 98765 67890)"
                    value={formData.inventory_keeper_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, inventory_keeper_phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* 2-Column Grid Row 3: Invoice # & Invoiced Date */}
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

            {/* 2-Column Grid Row 4: Books Sent & Payment Status */}
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

            {/* 2-Column Grid Row 5: Street Address & Email */}
            <div className="jd-form-grid-2">
              <div className="jd-form-row-h">
                <label>Street Address</label>
                <div className="jd-form-input-box">
                  <input
                    type="text"
                    placeholder="e.g. 5th Main Road, Gandhi Nagar"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="jd-form-row-h">
                <label>Email Address</label>
                <div className="jd-form-input-box">
                  <input
                    type="email"
                    placeholder="info@bookstore.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 2-Column Grid Row 6: Coordinates */}
            <div className="jd-form-grid-2">
              <div className="jd-form-row-h">
                <label>Coordinates *</label>
                <div className="jd-form-input-box">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Lat"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    title="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Lng"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    title="Longitude"
                  />
                </div>
              </div>
            </div>

            {/* Full Width Row: Business Notes */}
            <div className="jd-form-row-h top-align">
              <label>Business Notes</label>
              <div className="jd-form-input-box">
                <textarea
                  placeholder="Tracking number, shipment courier, distributor terms, manager notes, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="jd-modal-footer">
            <button
              type="button"
              className="jd-btn"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="jd-btn primary">
              {editingLocation ? 'Save Changes' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
