import React from 'react'

export default function CollectionsAddForm({
  addForm,
  setAddForm,
  isSavingManual,
  handleSaveManualEntry,
  onClose
}) {
  return (
    <form
      onSubmit={handleSaveManualEntry}
      style={{
        marginTop: '16px',
        padding: '16px',
        background: '#f1f5f9',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e293b' }}>
        ➕ Add New Individual Collection Record
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Individual Name *
          </label>
          <input
            type="text"
            required
            className="jd-search-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. Ramesh Patel"
            value={addForm.individual_name}
            onChange={(e) => setAddForm({ ...addForm, individual_name: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Count
          </label>
          <input
            type="number"
            min="0"
            className="jd-search-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. 50"
            value={addForm.count}
            onChange={(e) => setAddForm({ ...addForm, count: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Date
          </label>
          <input
            type="date"
            className="jd-search-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            value={addForm.date}
            onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Cost (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="jd-search-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. 2500.00"
            value={addForm.cost}
            onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Collection (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="jd-search-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            placeholder="e.g. 5000.00"
            value={addForm.collection}
            onChange={(e) => setAddForm({ ...addForm, collection: e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
          Notes / Remarks (Optional)
        </label>
        <input
          type="text"
          className="jd-search-input"
          style={{ width: '100%', boxSizing: 'border-box' }}
          placeholder="Optional notes or details"
          value={addForm.notes}
          onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button type="button" className="jd-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="jd-btn primary" disabled={isSavingManual}>
          {isSavingManual ? 'Saving...' : '💾 Save Entry to Database'}
        </button>
      </div>
    </form>
  )
}
