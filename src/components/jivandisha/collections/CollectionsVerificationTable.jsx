import React from 'react'
import VerificationTableRow from './VerificationTableRow'

export default function CollectionsVerificationTable({
  parsedRecords,
  parsedRecordsWithDups,
  selectedParsedRecords,
  parsedTotals,
  isSavingBulk,
  handleClearExcelSheet,
  handleSaveVerifiedRecords,
  handleSelectAllParsed,
  handleToggleSelectParsed,
  handleUpdateParsedField,
  handleRemoveParsedRow
}) {
  if (parsedRecords.length === 0) return null

  return (
    <div className="jd-table-card" style={{ border: '2px solid #3b82f6' }}>
      <div className="jd-table-card-header" style={{ background: '#eff6ff' }}>
        <div>
          <h3 style={{ color: '#1e40af' }}>
            📋 Verify Extracted Records ({parsedRecords.length} Rows Identified)
          </h3>
          <p className="jd-card-subtitle" style={{ color: '#1d4ed8' }}>
            Review and edit any row before persisting to MySQL database.
          </p>
        </div>
        <div className="jd-table-actions">
          <button type="button" className="jd-btn" onClick={handleClearExcelSheet} title="Discard imported Excel sheet">
            ✕ Clear Sheet
          </button>
          <button
            type="button"
            className="jd-btn primary"
            disabled={isSavingBulk || selectedParsedRecords.length === 0}
            onClick={handleSaveVerifiedRecords}
            title="Save verified records to MySQL"
          >
            {isSavingBulk ? 'Saving...' : `💾 Save ${selectedParsedRecords.length} Verified Records to Database`}
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '10px 16px',
          background: '#dbeafe',
          borderBottom: '1px solid #bfdbfe',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          fontSize: '0.84rem',
          fontWeight: 600,
          color: '#1e3a8a'
        }}
      >
        <span>Selected: {selectedParsedRecords.length} / {parsedRecords.length} rows</span>
        <span>📦 Total Count: {parsedTotals.count.toLocaleString()}</span>
        <span>💸 Total Cost: ₹{parsedTotals.cost.toFixed(2)}</span>
        <span>💰 Total Collection: ₹{parsedTotals.collection.toFixed(2)}</span>
        <span>⚖️ Net: ₹{(parsedTotals.collection - parsedTotals.cost).toFixed(2)}</span>
      </div>

      <div className="jd-table-scroll-wrap" style={{ maxHeight: '420px', overflowY: 'auto' }}>
        <table className="jd-tabular-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={parsedRecords.length > 0 && parsedRecords.every((r) => r.selected)}
                  onChange={(e) => handleSelectAllParsed(e.target.checked)}
                  title="Select / Deselect all"
                />
              </th>
              <th style={{ width: '45px', textAlign: 'center' }}>#</th>
              <th style={{ textAlign: 'left' }}>Individual Name *</th>
              <th style={{ width: '100px', textAlign: 'left' }}>Count</th>
              <th style={{ width: '150px', textAlign: 'left' }}>Date</th>
              <th style={{ width: '130px', textAlign: 'left' }}>Cost (₹)</th>
              <th style={{ width: '130px', textAlign: 'left' }}>Collection (₹)</th>
              <th style={{ width: '120px', textAlign: 'left' }}>Net Balance</th>
              <th style={{ width: '110px', textAlign: 'left' }}>Status</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {parsedRecordsWithDups.map((r, idx) => (
              <VerificationTableRow
                key={r.id}
                r={r}
                idx={idx}
                onToggleSelect={handleToggleSelectParsed}
                onUpdateField={handleUpdateParsedField}
                onRemoveRow={handleRemoveParsedRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
