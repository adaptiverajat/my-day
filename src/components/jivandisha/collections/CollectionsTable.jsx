import React from 'react'
import CollectionsTableRow from './CollectionsTableRow'
import CollectionsTotalsBanner from './CollectionsTotalsBanner'
import CollectionsTableFooter from './CollectionsTableFooter'

export default function CollectionsTable({
  filteredCollections,
  totalCollectionsCount,
  selectedIds,
  isBulkDeleting,
  loading,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  listTotals,
  listNet,
  handleOpenMergeModal,
  handleBulkDelete,
  loadCollections,
  handleSelectAllRows,
  handleToggleSelectRow,
  handleOpenEdit,
  handleDeleteRecord
}) {
  return (
    <div className="jd-table-card">
      <div className="jd-table-card-header">
        <div>
          <h3>👤 Individual Collection Records ({filteredCollections.length})</h3>
          <p className="jd-card-subtitle">
            Stored records in MySQL database. Select 2 records to merge duplicates.
          </p>
        </div>
        <div className="jd-table-actions">
          {selectedIds.length === 2 && (
            <button
              type="button"
              className="jd-btn primary"
              onClick={handleOpenMergeModal}
              title="Merge the 2 selected duplicate records into a single record"
            >
              🔀 Merge 2 Selected Records
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="jd-btn"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              title="Delete all selected records"
            >
              🗑️ Delete Selected ({selectedIds.length})
            </button>
          )}
          <button type="button" className="jd-btn" onClick={loadCollections} title="Refresh database records">
            🔄 Refresh
          </button>
        </div>
      </div>

      <CollectionsTotalsBanner
        listTotals={listTotals}
        listNet={listNet}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filteredCount={filteredCollections.length}
        totalCount={totalCollectionsCount}
      />

      <div className="jd-table-scroll-wrap">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            Loading individual collections...
          </div>
        ) : filteredCollections.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
            <div style={{ fontWeight: 600 }}>No individual collection records found.</div>
            <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
              Upload an Excel sheet with columns (Individual Name, Count, Date, Cost, Collection) or click "+ Add New Entry".
            </div>
          </div>
        ) : (
          <table className="jd-tabular-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={filteredCollections.length > 0 && filteredCollections.every((c) => selectedIds.includes(c.id))}
                    onChange={(e) => handleSelectAllRows(e, filteredCollections)}
                    title="Select all"
                  />
                </th>
                <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                <th style={{ textAlign: 'left' }}>Individual Name</th>
                <th style={{ width: '110px', textAlign: 'left' }}>Count</th>
                <th style={{ width: '130px', textAlign: 'left' }}>Date</th>
                <th style={{ width: '140px', textAlign: 'left' }}>Cost (₹)</th>
                <th style={{ width: '150px', textAlign: 'left' }}>Collection (₹)</th>
                <th style={{ width: '140px', textAlign: 'left' }}>Net Balance</th>
                <th style={{ textAlign: 'left' }}>Notes</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((item, idx) => (
                <CollectionsTableRow
                  key={item.id}
                  item={item}
                  idx={idx}
                  isChecked={selectedIds.includes(item.id)}
                  onToggleSelect={handleToggleSelectRow}
                  onOpenEdit={handleOpenEdit}
                  onDelete={handleDeleteRecord}
                />
              ))}
            </tbody>
            <CollectionsTableFooter
              filteredCount={filteredCollections.length}
              listTotals={listTotals}
              listNet={listNet}
            />
          </table>
        )}
      </div>
    </div>
  )
}
