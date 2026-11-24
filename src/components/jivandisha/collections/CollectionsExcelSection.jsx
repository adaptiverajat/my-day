import React from 'react'
import { downloadIndividualCollectionTemplate, exportIndividualCollectionsToExcel } from '../excelIndividualCollectionHelper'
import CollectionsAddForm from './CollectionsAddForm'

export default function CollectionsExcelSection({
  collections,
  dragActive,
  setDragActive,
  fileInputRef,
  isReadingExcel,
  excelFile,
  excelStatusMsg,
  processUploadedExcel,
  showAddForm,
  setShowAddForm,
  addForm,
  setAddForm,
  isSavingManual,
  handleSaveManualEntry
}) {
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processUploadedExcel(file)
  }

  return (
    <div className="jd-table-card">
      <div className="jd-table-card-header">
        <div>
          <h3>📥 Excel Sheet Reader & Quick Actions</h3>
          <p className="jd-card-subtitle">
            Upload an Excel (.xlsx, .xls) or CSV file with columns: <strong>Individual Name</strong>,{' '}
            <strong>Count</strong>, <strong>Date</strong>, <strong>Cost</strong>, <strong>Collection</strong>.
          </p>
        </div>
        <div className="jd-table-actions">
          <button
            type="button"
            className="jd-btn"
            onClick={downloadIndividualCollectionTemplate}
            title="Download sample Excel template with exact column names"
          >
            📄 Download Sample Excel
          </button>
          <button
            type="button"
            className="jd-btn"
            onClick={() => exportIndividualCollectionsToExcel(collections)}
            title="Export all individual collections to Excel"
          >
            💾 Export All to Excel
          </button>
          <button
            type="button"
            className={`jd-btn ${showAddForm ? '' : 'primary'}`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Close Form' : '+ Add New Entry'}
          </button>
        </div>
      </div>

      <div className="jd-table-card-body" style={{ padding: '16px' }}>
        <div
          className={`jd-excel-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #93c5fd',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#eff6ff' : '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) processUploadedExcel(file)
            }}
          />
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
            {isReadingExcel ? 'Reading Excel sheet...' : 'Click to select or drag & drop Excel Sheet here'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Recognizes exact columns: <code>Individual Name</code>, <code>Count</code>, <code>Date</code>,{' '}
            <code>Cost</code>, <code>Collection</code>
          </div>
          {excelFile && (
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
              📁 Loaded: {excelFile.name} ({excelFile.size})
            </div>
          )}
        </div>

        {excelStatusMsg && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              backgroundColor: excelStatusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: excelStatusMsg.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${excelStatusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {excelStatusMsg.text}
          </div>
        )}

        {showAddForm && (
          <CollectionsAddForm
            addForm={addForm}
            setAddForm={setAddForm}
            isSavingManual={isSavingManual}
            handleSaveManualEntry={handleSaveManualEntry}
            onClose={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  )
}
