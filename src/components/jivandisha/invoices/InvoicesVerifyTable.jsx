import React from 'react'
import InvoicesVerifyTableRow from './InvoicesVerifyTableRow'

export default function InvoicesVerifyTable({
  excelFile,
  ordersWithDups,
  totalBooks,
  totalAmount,
  selectedCount,
  selectedDups,
  allSelected,
  excelCountry,
  isSavingBatch,
  fileInputRef,
  handleSelectAll,
  handleClearSheet,
  handleSaveOrdersToDb,
  handleToggleSelect,
  handleUpdateField,
  handleTogglePayment,
  handleRemoveRow
}) {
  return (
    <div>
      <div className="jd-excel-summary-bar">
        <div className="jd-excel-summary-left">
          <span className="jd-excel-file-badge">
            📄 {excelFile?.name || 'Uploaded Sheet'} ({ordersWithDups.length} identified)
          </span>
          <span className="jd-excel-kpi-pill">📦 {totalBooks} Books</span>
          <span className="jd-excel-kpi-pill">💰 {excelCountry === 'US' ? '$' : '₹'}{totalAmount.toFixed(2)}</span>
          <span className="jd-excel-kpi-pill">✓ {selectedCount} of {ordersWithDups.length} Selected</span>
          {selectedDups.length > 0 && (
            <span className="jd-excel-kpi-pill warn">⚠️ {selectedDups.length} Potential DB Duplicates</span>
          )}
        </div>

        <div className="jd-excel-summary-actions">
          <button type="button" className="jd-btn" onClick={() => handleSelectAll(!allSelected)} style={{ fontSize: '0.76rem', padding: '4px 10px' }}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button type="button" className="jd-btn" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '0.76rem', padding: '4px 10px' }}>
            🔄 Upload Different File
          </button>
          <button type="button" className="jd-btn" onClick={handleClearSheet} style={{ fontSize: '0.76rem', padding: '4px 10px', color: '#b91c1c' }}>
            ✕ Discard Sheet
          </button>
        </div>
      </div>

      <div className="jd-verify-table-wrap">
        <table className="jd-verify-table">
          <thead>
            <tr>
              <th style={{ width: '36px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  title="Select/Deselect all orders"
                />
              </th>
              <th style={{ width: '32px' }}>#</th>
              <th style={{ minWidth: '190px' }}>Location / Center</th>
              <th style={{ width: '110px' }}>Invoice #</th>
              <th style={{ width: '115px' }}>Date</th>
              <th style={{ width: '85px' }}>Books</th>
              <th style={{ width: '100px' }}>Amount</th>
              <th style={{ width: '110px' }}>Payment</th>
              <th style={{ minWidth: '140px' }}>City & State</th>
              <th style={{ minWidth: '140px' }}>Contact</th>
              <th style={{ minWidth: '150px' }}>Duplicate Check</th>
              <th style={{ width: '40px', textAlign: 'center' }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {ordersWithDups.map((order, idx) => (
              <InvoicesVerifyTableRow
                key={order.id}
                order={order}
                idx={idx}
                currency={order.country === 'US' ? '$' : '₹'}
                onToggleSelect={handleToggleSelect}
                onUpdateField={handleUpdateField}
                onTogglePayment={handleTogglePayment}
                onRemoveRow={handleRemoveRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="jd-verify-actions-footer">
        <div className="jd-verify-footer-left">
          <span>
            Showing <strong>{ordersWithDups.length}</strong> identified orders (<strong>{selectedCount}</strong> selected). Books: <strong>{totalBooks}</strong> | Amount: <strong>{excelCountry === 'US' ? '$' : '₹'}{totalAmount.toFixed(2)}</strong>.
          </span>
          {selectedDups.length > 0 && (
            <div style={{ color: '#b45309', fontWeight: 600, fontSize: '0.78rem', marginTop: '3px' }}>
              ⚠️ {selectedDups.length} selected orders match existing DB records with the same date & price.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="button" className="jd-btn" onClick={handleClearSheet} style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            Clear All
          </button>
          <button
            type="button"
            className="jd-btn primary"
            disabled={isSavingBatch || selectedCount === 0}
            onClick={() => handleSaveOrdersToDb(false)}
            style={{ padding: '8px 24px', fontSize: '0.86rem', background: '#059669', borderColor: '#047857' }}
          >
            {isSavingBatch ? '💾 Saving Orders to DB...' : `💾 Save Verified Orders (${selectedCount}) to Database`}
          </button>
        </div>
      </div>
    </div>
  )
}
