import React from 'react'

export default function CollectionsTotalsBanner({
  listTotals,
  listNet,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  filteredCount,
  totalCount
}) {
  return (
    <>
      <div className="jd-list-totals-banner">
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📊 List Totals:
        </span>
        <div className="jd-totals-chip count" title="Total Count of Books / Items in current list">
          <span className="chip-label">Count</span>
          <span className="chip-val">📦 {listTotals.count.toLocaleString()}</span>
        </div>
        <div className="jd-totals-chip cost" title="Total Cost in current list">
          <span className="chip-label">Cost</span>
          <span className="chip-val">💸 ₹{listTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="jd-totals-chip collection" title="Total Collections in current list">
          <span className="chip-label">Collections</span>
          <span className="chip-val">💰 ₹{listTotals.collection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className={`jd-totals-chip net ${listNet >= 0 ? 'positive' : 'negative'}`} title="Net Collection Balance (Collection - Cost)">
          <span className="chip-label">Net Balance</span>
          <span className="chip-val">
            ⚖️ {listNet >= 0 ? '+' : ''}₹{listNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {searchTerm && (
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
            (Filtered: showing {filteredCount} of {totalCount} entries)
          </span>
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="jd-search-input"
            placeholder="🔍 Search by Individual Name, Date, Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Sort By:</span>
          <select className="jd-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">📅 Date (Newest first)</option>
            <option value="date-asc">📅 Date (Oldest first)</option>
            <option value="name-asc">👤 Name (A → Z)</option>
            <option value="name-desc">👤 Name (Z → A)</option>
            <option value="count-desc">📦 Count (Highest first)</option>
            <option value="collection-desc">💰 Collection (Highest first)</option>
            <option value="cost-desc">💸 Cost (Highest first)</option>
          </select>
        </div>
      </div>
    </>
  )
}
