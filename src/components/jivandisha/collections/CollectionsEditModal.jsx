import React from 'react'

export default function CollectionsEditModal({
  editingItem,
  editForm,
  setEditForm,
  isSavingEdit,
  handleCloseEdit,
  handleSaveEdit
}) {
  if (!editingItem) return null

  return (
    <div className="jd-modal-overlay">
      <div className="jd-modal-dialog" style={{ maxWidth: '520px' }}>
        <div className="jd-modal-header">
          <h3>✏️ Edit Individual Collection Record</h3>
          <button className="jd-modal-close" onClick={handleCloseEdit}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSaveEdit}>
          <div className="jd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                Individual Name *
              </label>
              <input
                type="text"
                required
                className="jd-search-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={editForm.individual_name}
                onChange={(e) => setEditForm({ ...editForm, individual_name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Count
                </label>
                <input
                  type="number"
                  min="0"
                  className="jd-search-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={editForm.count}
                  onChange={(e) => setEditForm({ ...editForm, count: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Date
                </label>
                <input
                  type="date"
                  className="jd-search-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="jd-search-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={editForm.cost}
                  onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                  Collection (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="jd-search-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={editForm.collection}
                  onChange={(e) => setEditForm({ ...editForm, collection: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                Notes / Remarks
              </label>
              <textarea
                rows={3}
                className="jd-search-input"
                style={{ width: '100%', boxSizing: 'border-box', height: 'auto' }}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="jd-modal-footer">
            <button type="button" className="jd-btn" onClick={handleCloseEdit}>
              Cancel
            </button>
            <button type="submit" className="jd-btn primary" disabled={isSavingEdit}>
              {isSavingEdit ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
