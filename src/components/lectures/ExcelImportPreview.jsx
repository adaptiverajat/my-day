import React from 'react';

export default function ExcelImportPreview({
  parsedData,
  fileName,
  importMode,
  setImportMode,
  onReset
}) {
  return (
    <div className="import-preview-container">
      <div className="import-preview-header">
        <div>
          <strong>{parsedData.validCount}</strong> valid lectures identified from file:{' '}
          <span style={{ color: '#2563eb' }}>{fileName}</span>
        </div>
        <button type="button" className="lec-btn danger" onClick={onReset}>
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
  );
}
