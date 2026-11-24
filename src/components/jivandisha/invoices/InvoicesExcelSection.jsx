import React from 'react'
import { generateSampleExcelTemplate } from '../excelInvoiceHelper'
import InvoicesExcelDropzone from './InvoicesExcelDropzone'
import InvoicesVerifyTable from './InvoicesVerifyTable'

export default function InvoicesExcelSection({
  excelCountry,
  setExcelCountry,
  excelStatusMsg,
  parsedOrders,
  excelFile,
  ordersWithDups,
  totalBooks,
  totalAmount,
  selectedCount,
  selectedDups,
  allSelected,
  isReadingExcel,
  isSavingBatch,
  dragActive,
  setDragActive,
  fileInputRef,
  processUploadedFile,
  handleSelectAll,
  handleClearSheet,
  handleSaveOrdersToDb,
  handleToggleSelect,
  handleUpdateField,
  handleTogglePayment,
  handleRemoveRow
}) {
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true) }
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false) }
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processUploadedFile(file)
  }

  return (
    <div className="jd-excel-card" id="add-invoice-card">
      <div className="jd-extractor-header">
        <div className="jd-extractor-title-area">
          <span className="jd-extractor-badge-icon" style={{ background: '#059669' }}>📊</span>
          <div style={{ textAlign: 'left' }}>
            <h3 className="jd-extractor-heading" style={{ textAlign: 'left' }}>Import Invoices from Excel Sheet</h3>
            <p className="jd-extractor-subheading" style={{ textAlign: 'left' }}>
              Read multiple invoice order values from an Excel (.xlsx, .xls) or CSV sheet.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="jd-extractor-country-pills">
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Default Country:</span>
            <button
              type="button"
              className={`jd-country-pill ${excelCountry === 'IN' ? 'active' : ''}`}
              onClick={() => setExcelCountry('IN')}
            >
              🇮🇳 India
            </button>
            <button
              type="button"
              className={`jd-country-pill ${excelCountry === 'US' ? 'active' : ''}`}
              onClick={() => setExcelCountry('US')}
            >
              🇺🇸 USA
            </button>
          </div>

          <button
            type="button"
            className="jd-btn"
            onClick={() => generateSampleExcelTemplate(excelCountry)}
            title="Download pre-formatted Excel template"
            style={{ fontSize: '0.78rem', padding: '5px 12px', background: '#ffffff' }}
          >
            📥 Download Sample Template (.xlsx)
          </button>
        </div>
      </div>

      {excelStatusMsg && (
        <div style={{ padding: '0 20px', marginTop: '12px' }}>
          <div className={`jd-parse-msg-banner ${excelStatusMsg.type}`}>
            {excelStatusMsg.type === 'success' && '✅ '}
            {excelStatusMsg.type === 'info' && 'ℹ️ '}
            {excelStatusMsg.type === 'error' && '⚠️ '}
            <span>{excelStatusMsg.text}</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processUploadedFile(file)
        }}
        style={{ display: 'none' }}
      />

      {parsedOrders.length === 0 ? (
        <InvoicesExcelDropzone
          dragActive={dragActive}
          isReadingExcel={isReadingExcel}
          fileInputRef={fileInputRef}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
        />
      ) : (
        <InvoicesVerifyTable
          excelFile={excelFile}
          ordersWithDups={ordersWithDups}
          totalBooks={totalBooks}
          totalAmount={totalAmount}
          selectedCount={selectedCount}
          selectedDups={selectedDups}
          allSelected={allSelected}
          excelCountry={excelCountry}
          isSavingBatch={isSavingBatch}
          fileInputRef={fileInputRef}
          handleSelectAll={handleSelectAll}
          handleClearSheet={handleClearSheet}
          handleSaveOrdersToDb={handleSaveOrdersToDb}
          handleToggleSelect={handleToggleSelect}
          handleUpdateField={handleUpdateField}
          handleTogglePayment={handleTogglePayment}
          handleRemoveRow={handleRemoveRow}
        />
      )}
    </div>
  )
}
