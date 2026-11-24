import React from 'react'

export default function InvoicesExcelDropzone({
  dragActive,
  isReadingExcel,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop
}) {
  return (
    <div>
      <div
        className={`jd-excel-upload-zone ${dragActive ? 'dragover' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="jd-excel-upload-icon">{isReadingExcel ? '🔄' : '📊'}</span>
        <div className="jd-excel-upload-title">
          {isReadingExcel
            ? 'Reading & identifying orders from Excel spreadsheet...'
            : 'Click to Browse or Drag & Drop Excel Sheet Here'}
        </div>
        <div className="jd-excel-upload-subtitle">
          Upload your order entries spreadsheet. The system automatically reads multiple rows, parses dates, amounts, books, payment status, and matches existing locations.
        </div>
        <div className="jd-excel-upload-formats">
          📄 Accepts .xlsx, .xls, and .csv files with multiple rows
        </div>
      </div>

      <div className="jd-excel-columns-guide">
        <div>
          <strong>Supported Column Headers:</strong> The reader automatically recognizes fuzzy headers across languages and styles:
        </div>
        <div className="jd-excel-guide-pills">
          <span className="jd-excel-col-pill">Location / Center</span>
          <span className="jd-excel-col-pill">Invoice #</span>
          <span className="jd-excel-col-pill">Date</span>
          <span className="jd-excel-col-pill">Books Sent</span>
          <span className="jd-excel-col-pill">Amount</span>
          <span className="jd-excel-col-pill">Payment Status</span>
          <span className="jd-excel-col-pill">City</span>
          <span className="jd-excel-col-pill">State</span>
          <span className="jd-excel-col-pill">Country</span>
          <span className="jd-excel-col-pill">Contact Person</span>
          <span className="jd-excel-col-pill">Phone</span>
          <span className="jd-excel-col-pill">Notes / Remarks</span>
        </div>
      </div>
    </div>
  )
}
