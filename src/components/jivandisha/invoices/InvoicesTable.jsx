import React from 'react'
import InvoicesListTotals from './InvoicesListTotals'
import InvoicesTableRow from './InvoicesTableRow'

export default function InvoicesTable({
  filteredAllInvoices,
  allInvoices,
  loadingAllInvoices,
  invoiceListTotals,
  invoiceSearchTerm,
  invoiceFilterCountry,
  invoiceFilterPayment,
  selectedInvoiceIds,
  setSelectedInvoiceIds,
  handleToggleSelectInvoice,
  handleToggleInvoicePaymentInList,
  handleOpenEditInvoice,
  handleDeleteInvoiceFromList
}) {
  return (
    <div className="jd-table-card">
      <InvoicesListTotals
        invoiceListTotals={invoiceListTotals}
        invoiceSearchTerm={invoiceSearchTerm}
        invoiceFilterCountry={invoiceFilterCountry}
        invoiceFilterPayment={invoiceFilterPayment}
        filteredCount={filteredAllInvoices.length}
        totalCount={allInvoices.length}
      />

      <div className="jd-table-scroll-wrap">
        <table className="jd-tabular-table">
          <thead>
            <tr>
              <th style={{ width: '44px', textAlign: 'center' }}>
                {selectedInvoiceIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceIds([])}
                    title="Clear selection"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b' }}
                  >
                    ✕
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Merge</span>
                )}
              </th>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Location / Center</th>
              <th>Status</th>
              <th>Books Sent</th>
              <th>Amount</th>
              <th>Decision Maker</th>
              <th>Remarks</th>
              <th>PDF</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingAllInvoices ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  🔄 Loading invoices...
                </td>
              </tr>
            ) : filteredAllInvoices.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '42px', color: '#64748b' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📂</div>
                  <div style={{ fontWeight: 600, color: '#334155' }}>No invoices found matching criteria</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Try adjusting your filters or import invoices from an Excel sheet below.
                  </div>
                </td>
              </tr>
            ) : (
              filteredAllInvoices.map((inv) => (
                <InvoicesTableRow
                  key={inv.id}
                  inv={inv}
                  isSelected={selectedInvoiceIds.includes(inv.id)}
                  selectedCount={selectedInvoiceIds.length}
                  onToggleSelect={handleToggleSelectInvoice}
                  onTogglePayment={handleToggleInvoicePaymentInList}
                  onOpenEdit={handleOpenEditInvoice}
                  onDelete={handleDeleteInvoiceFromList}
                />
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
              <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                TOTAL ({filteredAllInvoices.length} Invoices)
              </td>
              <td style={{ fontWeight: 700, color: '#2563eb' }}>
                📦 {invoiceListTotals.books.toLocaleString()}
              </td>
              <td style={{ fontWeight: 700, color: '#059669' }}>
                ₹{invoiceListTotals.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td colSpan={4}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
