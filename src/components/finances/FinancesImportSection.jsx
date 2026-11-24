import React from 'react'

export default function FinancesImportSection({
  showImportSection,
  setShowImportSection,
  handleParseDocument,
  handleTextImport,
  isParsing,
  error,
  setError
}) {
  return (
    <div className="finances-upload-section">
      <button 
        type="button"
        className="import-toggle-btn"
        onClick={() => setShowImportSection(!showImportSection)}
        aria-label={showImportSection ? 'Collapse import section' : 'Expand import section'}
      >
        <span className="import-toggle-icon">{showImportSection ? '▼' : '▶'}</span>
        <span className="import-toggle-text">Import Financial Data</span>
      </button>
      {showImportSection && (
        <>
          <div className="upload-options">
            <div className="upload-option">
              <label>Upload PDF:</label>
              <input type="file" accept=".pdf" id="pdf-input" />
              <button 
                type="button"
                className="btn-import"
                onClick={() => {
                  const fileInput = document.getElementById('pdf-input')
                  const file = fileInput?.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      handleParseDocument('pdf', event.target.result)
                    }
                    reader.readAsDataURL(file)
                  } else {
                    setError('Please select a PDF file first')
                  }
                }}
              >
                Import PDF
              </button>
            </div>
            <div className="upload-option">
              <label>Paste Text:</label>
              <textarea 
                placeholder="Paste financial data here..."
                rows={4}
                id="text-input"
              />
              <button 
                type="button"
                className="btn-import"
                onClick={() => {
                  const textInput = document.getElementById('text-input')
                  if (textInput && textInput.value.trim()) {
                    handleTextImport(textInput.value)
                  } else {
                    setError('Please enter some text first')
                  }
                }}
              >
                Import Text
              </button>
            </div>
          </div>
          {isParsing && <div className="parsing-indicator">Parsing document with AI...</div>}
          {error && <div className="form-error">{error}</div>}
        </>
      )}
    </div>
  )
}
