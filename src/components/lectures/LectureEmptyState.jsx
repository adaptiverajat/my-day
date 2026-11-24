import React from 'react';

export default function LectureEmptyState({ onOpenImport, onOpenAdd }) {
  return (
    <div className="empty-lectures-state">
      <div className="empty-state-icon">🎧</div>
      <h3 className="empty-state-title">No Lectures in Schedule Yet</h3>
      <p className="empty-state-desc">Import lectures directly from an Excel sheet or add them manually.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button type="button" className="lec-btn success" onClick={onOpenImport}>
          📥 Upload Excel
        </button>
        <button type="button" className="lec-btn primary" onClick={onOpenAdd}>
          ➕ Add Manually
        </button>
      </div>
    </div>
  );
}
