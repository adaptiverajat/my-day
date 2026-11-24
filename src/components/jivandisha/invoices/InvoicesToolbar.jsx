import React from 'react'

export default function InvoicesToolbar({
  invoiceSearchTerm,
  setInvoiceSearchTerm,
  invoiceFilterCountry,
  setInvoiceFilterCountry,
  invoiceFilterPayment,
  setInvoiceFilterPayment,
  invoiceSortBy,
  setInvoiceSortBy,
  scrollToExtractor,
  selectedInvoiceIds,
  setSelectedInvoiceIds,
  handleOpenInvoiceMergeModal
}) {
  return (
    <div className="jd-view-toolbar">
      <div className="jd-toolbar-search-wrap">
        <input
          type="text"
          className="jd-toolbar-search-input"
          placeholder="🔍 Search invoices by #, location, city, contact, remarks..."
          value={invoiceSearchTerm}
          onChange={(e) => setInvoiceSearchTerm(e.target.value)}
        />
      </div>

      <div className="jd-toolbar-filters">
        <select
          className="jd-toolbar-select"
          value={invoiceFilterCountry}
          onChange={(e) => setInvoiceFilterCountry(e.target.value)}
        >
          <option value="ALL">All Countries</option>
          <option value="IN">🇮🇳 India</option>
          <option value="US">🇺🇸 USA</option>
        </select>

        <select
          className="jd-toolbar-select"
          value={invoiceFilterPayment}
          onChange={(e) => setInvoiceFilterPayment(e.target.value)}
        >
          <option value="ALL">All Payments</option>
          <option value="PAID">Paid Only</option>
          <option value="PENDING">Pending Only</option>
        </select>

        <select
          className="jd-toolbar-select"
          value={invoiceSortBy}
          onChange={(e) => setInvoiceSortBy(e.target.value)}
        >
          <option value="DATE_DESC">Date (Newest First)</option>
          <option value="DATE_ASC">Date (Oldest First)</option>
          <option value="BOOKS_DESC">Books (Highest)</option>
          <option value="AMOUNT_DESC">Amount (Highest)</option>
          <option value="TITLE_ASC">Location (A-Z)</option>
        </select>

        <button
          type="button"
          className="jd-btn primary"
          onClick={scrollToExtractor}
          style={{ fontSize: '0.84rem', padding: '9px 16px' }}
        >
          📊 Import Excel Invoices
        </button>

        {selectedInvoiceIds.length > 0 && (
          <div className="jd-merge-toolbar-pill">
            <span className="jd-merge-count-badge">
              {selectedInvoiceIds.length}/2 Selected
            </span>
            {selectedInvoiceIds.length === 2 ? (
              <button
                type="button"
                className="jd-btn primary jd-btn-merge-action"
                onClick={handleOpenInvoiceMergeModal}
                title="Merge the 2 selected invoices into a single record"
              >
                🔀 Merge 2 Invoices
              </button>
            ) : (
              <span className="jd-merge-instruction">
                Select 1 more duplicate invoice
              </span>
            )}
            <button
              type="button"
              className="jd-btn"
              onClick={() => setSelectedInvoiceIds([])}
              style={{ fontSize: '0.74rem', padding: '3px 7px' }}
              title="Cancel selection"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
