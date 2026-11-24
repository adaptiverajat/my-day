import React, { useState, useRef } from 'react';
import { parseLecturesExcelFile } from './excelLectureHelper';
import ExcelImportPreview from './ExcelImportPreview';

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importMode, setImportMode] = useState('append');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;
    setError('');
    setLoading(true);
    setFile(selectedFile);
    try {
      const result = await parseLecturesExcelFile(selectedFile);
      setParsedData(result);
    } catch (err) {
      console.error('Error parsing excel:', err);
      setError(err.message || 'Failed to parse Excel file');
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!parsedData?.lectures?.length) {
      setError('No parsed lecture records to import');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/lectures/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectures: parsedData.lectures, mode: importMode })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to save lectures');
      onImportSuccess?.(data.importedCount);
      onClose();
    } catch (err) {
      console.error('Error saving lectures:', err);
      setError(err.message || 'Failed to save lectures');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="lecture-modal-overlay" onClick={onClose}>
      <div className="lecture-modal-box modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 Import Lectures from Excel</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!parsedData ? (
            <div
              className="excel-upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); processFile(e.dataTransfer.files?.[0]); }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => processFile(e.target.files?.[0])}
              />
              <div className="dropzone-icon">📊</div>
              <div className="dropzone-text">Click to browse or drag & drop Excel file here</div>
              <div className="dropzone-hint">
                Supported columns: <strong>ID, Title, Year, Duration (hh:mm:ss), Section No., Section, Sub-section</strong>
              </div>
            </div>
          ) : (
            <ExcelImportPreview
              parsedData={parsedData}
              fileName={file?.name}
              importMode={importMode}
              setImportMode={setImportMode}
              onReset={handleReset}
            />
          )}

          {error && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="lec-btn" onClick={onClose} disabled={loading}>Cancel</button>
          {parsedData && (
            <button
              type="button"
              className="lec-btn primary"
              onClick={handleSaveToDatabase}
              disabled={loading || parsedData.validCount === 0}
            >
              {loading ? 'Saving...' : `Save ${parsedData.validCount} Lectures to Database`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
