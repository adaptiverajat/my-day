import React from 'react'

export default function JivanDishaHeaderActions({
  mainTab,
  viewMode,
  setViewMode,
  handleAddLocation,
  handleBatchImport,
  handleExport,
  sidebarOpen,
  setSidebarOpen,
  handleRefreshInvoices,
  handleRefreshContacts,
  handleRefreshCollections,
  handleBackToCalendar
}) {
  return (
    <div className="jd-header-actions">
      {mainTab === 'maps' && (
        <>
          <div className="jd-view-mode-group">
            <button
              className={`jd-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
              title="View India & USA side-by-side"
            >
              Side-by-Side
            </button>
            <button
              className={`jd-mode-btn ${viewMode === 'focus-india' ? 'active' : ''}`}
              onClick={() => setViewMode('focus-india')}
              title="Focus on India"
            >
              🇮🇳 India
            </button>
            <button
              className={`jd-mode-btn ${viewMode === 'focus-usa' ? 'active' : ''}`}
              onClick={() => setViewMode('focus-usa')}
              title="Focus on USA"
            >
              🇺🇸 USA
            </button>
          </div>

          <button className="jd-btn primary" onClick={handleAddLocation}>
            + Add Location
          </button>

          <button
            className="jd-btn jd-btn-batch-import"
            onClick={handleBatchImport}
            title="Import multiple invoice PDFs to create multiple locations at once"
          >
            📑 Import Multiple PDFs
          </button>

          <button className="jd-btn" onClick={handleExport} title="Download JSON backup">
            💾 Export JSON
          </button>

          <button
            className="jd-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Locations Sidebar"
          >
            {sidebarOpen ? 'Hide List ❯' : '❮ Show List'}
          </button>
        </>
      )}

      {mainTab === 'invoices' && (
        <button className="jd-btn" onClick={handleRefreshInvoices} title="Refresh Invoices List">
          🔄 Refresh Invoices
        </button>
      )}

      {mainTab === 'contacts' && (
        <button className="jd-btn" onClick={handleRefreshContacts} title="Refresh Contacts List">
          🔄 Refresh Contacts
        </button>
      )}

      {mainTab === 'collections' && (
        <button className="jd-btn" onClick={handleRefreshCollections} title="Refresh Individual Collections List">
          🔄 Refresh Collections
        </button>
      )}

      <button className="jd-btn nav-back" onClick={handleBackToCalendar}>
        ← Calendar
      </button>
    </div>
  )
}
