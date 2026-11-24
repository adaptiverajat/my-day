import React from 'react'
import JivanDishaLocationItem from './JivanDishaLocationItem'

export default function JivanDishaSidebar({
  sidebarOpen,
  filteredLocations = [],
  searchTerm,
  setSearchTerm,
  filterCountry,
  setFilterCountry,
  filterPayment,
  setFilterPayment,
  loading,
  onRefresh,
  loadLocations,
  onFocusLocation,
  handleFlyTo,
  onOpenHistory,
  handleOpenHistory,
  onOpenEdit,
  handleOpenEdit,
  onDeleteLocation,
  handleDeleteLocation
}) {
  const focusFn = onFocusLocation || handleFlyTo
  const refreshFn = onRefresh || loadLocations
  const historyFn = onOpenHistory || handleOpenHistory
  const editFn = onOpenEdit || handleOpenEdit
  const deleteFn = onDeleteLocation || handleDeleteLocation

  return (
    <aside className={`jd-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="jd-sidebar-header">
        <h2>Locations ({filteredLocations.length})</h2>
        <button
          className="jd-btn"
          onClick={() => refreshFn && refreshFn()}
          title="Refresh data"
        >
          🔄
        </button>
      </div>

      <div className="jd-sidebar-search">
        <input
          type="text"
          className="jd-search-input"
          placeholder="🔍 Search title, city, contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="jd-filter-row">
          <select
            className="jd-select"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="ALL">All Countries</option>
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 USA</option>
          </select>

          <select
            className="jd-select"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">✅ Paid</option>
            <option value="PENDING">⏳ Payment Pending</option>
          </select>
        </div>
      </div>

      <div className="jd-sidebar-list">
        {loading ? (
          <div className="jd-empty-list">Loading locations...</div>
        ) : filteredLocations.length === 0 ? (
          <div className="jd-empty-list">
            No locations match your filter.
            <br />
            <small>Click on either map to place your first pin!</small>
          </div>
        ) : (
          filteredLocations.map((loc) => (
            <JivanDishaLocationItem
              key={loc.id}
              loc={loc}
              focusFn={focusFn}
              historyFn={historyFn}
              editFn={editFn}
              deleteFn={deleteFn}
            />
          ))
        )}
      </div>
    </aside>
  )
}
