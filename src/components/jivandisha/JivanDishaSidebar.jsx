import React from 'react'

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

      {/* Search & Filters */}
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

      {/* Location Cards List */}
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
          filteredLocations.map((loc) => {
            const isPaid = Boolean(loc.payment_received)
            return (
              <div
                key={loc.id}
                className="jd-location-item"
                onClick={() => focusFn && focusFn(loc)}
              >
                <div className="jd-loc-item-header">
                  <span className="jd-loc-title">{loc.title}</span>
                  <span className="jd-loc-country">{loc.country === 'US' ? '🇺🇸' : '🇮🇳'}</span>
                </div>

                {(loc.city || loc.state) && (
                  <div className="jd-loc-city">
                    📍 {[loc.city, loc.state].filter(Boolean).join(', ')}
                  </div>
                )}

                <div className="jd-loc-metrics-row">
                  <span className={`jd-metric-badge ${isPaid ? 'paid' : 'pending'}`}>
                    {isPaid ? '✅ Paid' : '⏳ Pending'}
                  </span>
                  <span className="jd-metric-badge books">
                    📦 {loc.books_sent || 0} books
                  </span>
                  {loc.invoice_date && (
                    <span className="jd-metric-badge date">
                      📅 {loc.invoice_date}
                    </span>
                  )}
                  {loc.invoice_pdf_url && (
                    <span className="jd-metric-badge pdf" title="Invoice PDF permanently retained">
                      📄 PDF
                    </span>
                  )}
                </div>

                {/* Contacts summary */}
                {(loc.decision_maker_name || loc.inventory_keeper_name) && (
                  <div style={{ fontSize: '0.72rem', color: '#475569', margin: '4px 0' }}>
                    {loc.decision_maker_name && <div>👔 {loc.decision_maker_name}</div>}
                    {loc.inventory_keeper_name && <div>📦 {loc.inventory_keeper_name}</div>}
                  </div>
                )}

                {loc.notes && <div className="jd-loc-notes">{loc.notes}</div>}

                <div className="jd-loc-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="jd-loc-action-btn history"
                    onClick={() => historyFn && historyFn(loc)}
                    title="View invoice history"
                  >
                    📜 History
                  </button>
                  <button
                    className="jd-loc-action-btn"
                    onClick={() => focusFn && focusFn(loc)}
                  >
                    🎯 Jump
                  </button>
                  <button
                    className="jd-loc-action-btn"
                    onClick={() => editFn && editFn(loc)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="jd-loc-action-btn delete"
                    onClick={() => deleteFn && deleteFn(loc.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
