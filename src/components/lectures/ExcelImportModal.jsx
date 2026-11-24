import React, { useState, useRef } from 'react';
import { parseLecturesExcelFile } from './excelLectureHelper';

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
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

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setError('');
    setLoading(true);
    setFile(droppedFile);

    try {
      const result = await parseLecturesExcelFile(droppedFile);
      setParsedData(result);
    } catch (err) {
      console.error('Error parsing excel:', err);
      setError(err.message || 'Failed to parse Excel file');
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSaveToDatabase = async () => {
    if (!parsedData || !parsedData.lectures || parsedData.lectures.length === 0) {
      setError('No parsed lecture records to import');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/lectures/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectures: parsedData.lectures,
          mode: importMode
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save lectures to database');
      }

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
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="dropzone-icon">📊</div>
              <div className="dropzone-text">Click to browse or drag & drop Excel file here</div>
              <div className="dropzone-hint">
                Supported columns: <strong>ID, Title, Year, Duration (hh:mm:ss), Section No., Section, Sub-section</strong>
              </div>
            </div>
          ) : (
            <div className="import-preview-container">
              <div className="import-preview-header">
                <div>
                  <strong>{parsedData.validCount}</strong> valid lectures identified from file:{' '}
                  <span style={{ color: '#2563eb' }}>{file?.name}</span>
                </div>
                <button type="button" className="lec-btn danger" onClick={handleReset}>
                  Choose Different File
                </button>
              </div>

              <div className="import-preview-table-wrapper">
                <table className="lectures-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>Title</th>
                      <th style={{ width: '70px' }}>Year</th>
                      <th style={{ width: '110px' }}>Duration</th>
                      <th style={{ width: '90px' }}>Sec No.</th>
                      <th>Section</th>
                      <th>Sub-section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.lectures.map((lec, idx) => (
                      <tr key={lec.tempId || idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{lec.lecture_id}</strong></td>
                        <td>{lec.title}</td>
                        <td style={{ textAlign: 'center' }}>{lec.year || '—'}</td>
                        <td style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600 }}>
                          {lec.duration}
                        </td>
                        <td style={{ textAlign: 'center' }}>{lec.section_no || '—'}</td>
                        <td><span className="badge-section">{lec.section || 'General'}</span></td>
                        <td style={{ color: '#64748b' }}>{lec.sub_section || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-options-row">
                <span style={{ fontWeight: 600, color: '#334155' }}>Import Action:</span>
                <label className="import-option-label">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                  />
                  Append to existing lectures
                </label>
                <label className="import-option-label">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  Replace all existing lectures
                </label>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="lec-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          {parsedData && (
            <button
              type="button"
              className="lec-btn primary"
              onClick={handleSaveToDatabase}
              disabled={loading || parsedData.validCount === 0}
            >
              {loading ? 'Saving to Database...' : `Save ${parsedData.validCount} Lectures to Database`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
