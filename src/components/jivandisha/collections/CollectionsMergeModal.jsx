import React from 'react'

function MergeField({ label, type = 'text', value, onChange, step }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>{label}</label>
      <input
        type={type}
        step={step}
        className="jd-search-input"
        style={{ width: '100%', boxSizing: 'border-box' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export default function CollectionsMergeModal({
  showMergeModal,
  setShowMergeModal,
  selectedRecordsForMerge,
  primaryRecordId,
  handleSwitchPrimary,
  mergeForm,
  setMergeForm,
  isMerging,
  handleConfirmMerge
}) {
  if (!showMergeModal || selectedRecordsForMerge.length !== 2) return null

  return (
    <div className="jd-modal-overlay">
      <div className="jd-modal-dialog" style={{ maxWidth: '680px' }}>
        <div className="jd-modal-header">
          <h3>🔀 Merge Duplicate Individual Collections</h3>
          <button className="jd-modal-close" onClick={() => setShowMergeModal(false)}>✕</button>
        </div>

        <div className="jd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            background: '#fef3c7', border: '1px solid #fde68a', padding: '10px 14px',
            borderRadius: '6px', fontSize: '0.82rem', color: '#92400e'
          }}>
            Select which record should serve as the <strong>Primary</strong>. The secondary record will be deleted from MySQL, and the combined counts, costs, and collections will be retained.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {selectedRecordsForMerge.map((rec) => {
              const isPrim = rec.id === primaryRecordId
              return (
                <div
                  key={rec.id}
                  onClick={() => handleSwitchPrimary(rec.id)}
                  style={{
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    border: isPrim ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: isPrim ? '#eff6ff' : '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                      {isPrim ? '⭐ Primary Record' : 'Duplicate (Will Delete)'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID #{rec.id}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>
                    <div><strong>Name:</strong> {rec.individual_name}</div>
                    <div><strong>Count:</strong> {rec.count}</div>
                    <div><strong>Date:</strong> {rec.date || '—'}</div>
                    <div><strong>Cost:</strong> ₹{rec.cost}</div>
                    <div><strong>Collection:</strong> ₹{rec.collection}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#1e293b' }}>
              Confirm Final Merged Record Values:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <MergeField label="Individual Name" value={mergeForm.individual_name} onChange={(v) => setMergeForm({ ...mergeForm, individual_name: v })} />
              <MergeField label="Combined Count" type="number" value={mergeForm.count} onChange={(v) => setMergeForm({ ...mergeForm, count: v })} />
              <MergeField label="Date" type="date" value={mergeForm.date} onChange={(v) => setMergeForm({ ...mergeForm, date: v })} />
              <MergeField label="Total Cost (₹)" type="number" step="0.01" value={mergeForm.cost} onChange={(v) => setMergeForm({ ...mergeForm, cost: v })} />
              <MergeField label="Total Collection (₹)" type="number" step="0.01" value={mergeForm.collection} onChange={(v) => setMergeForm({ ...mergeForm, collection: v })} />
            </div>
          </div>
        </div>

        <div className="jd-modal-footer">
          <button type="button" className="jd-btn" onClick={() => setShowMergeModal(false)}>Cancel</button>
          <button type="button" className="jd-btn primary" disabled={isMerging} onClick={handleConfirmMerge}>
            {isMerging ? 'Merging...' : '🔀 Confirm Merge & Delete Duplicate'}
          </button>
        </div>
      </div>
    </div>
  )
}
