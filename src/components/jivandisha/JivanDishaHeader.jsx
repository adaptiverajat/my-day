import React from 'react'
import AppLogoMenu from '../AppLogoMenu'

export default function JivanDishaHeader({
  dbConnected,
  totalBooks,
  mainTab,
  setMainTab,
  locationsCount = 0,
  invoicesCount,
  allInvoicesCount,
  individualCollectionsCount = 0,
  viewMode,
  setViewMode,
  onOpenAddLocation,
  onOpenAddLocationModal,
  onOpenBatchImport,
  onOpenBatchModal,
  onExportJSON,
  handleExportJSON,
  sidebarOpen,
  setSidebarOpen,
  onRefreshInvoices,
  loadAllInvoices,
  onRefreshContacts,
  loadLocations,
  onRefreshCollections,
  loadIndividualCollections,
  onBackToCalendar,
  navigate
}) {
  const displayInvoicesCount = invoicesCount !== undefined ? invoicesCount : (allInvoicesCount !== undefined ? allInvoicesCount : 0)
  const handleRefreshInvoices = onRefreshInvoices || loadAllInvoices
  const handleRefreshContacts = onRefreshContacts || loadLocations
  const handleRefreshCollections = onRefreshCollections || loadIndividualCollections
  const handleBackToCalendar = onBackToCalendar || (() => navigate?.('/'))
  const handleAddLocation = onOpenAddLocation || onOpenAddLocationModal
  const handleBatchImport = onOpenBatchImport || onOpenBatchModal
  const handleExport = onExportJSON || handleExportJSON

  return (
    <header className="jd-header">
      <AppLogoMenu
        title="JivanDisha"
        currentScreen="jivandisha"
        badge={
          <span className={`jd-status-badge ${dbConnected ? 'online' : 'local'}`}>
            {dbConnected ? '🟢 MySQL Connected' : '🟠 Local Offline Mode'}
          </span>
        }
        subtitle={`Book Orders & Operations Map • 📚 Total Books Sent: ${totalBooks}`}
      />

      {/* Main Tab Switcher */}
      <div className="jd-main-tabs">
        <button
          type="button"
          className={`jd-main-tab-btn ${mainTab === 'maps' ? 'active' : ''}`}
          onClick={() => setMainTab('maps')}
          title="Interactive Operations Map"
        >
          <span className="tab-icon">🗺️</span>
          <span className="tab-label">Maps</span>
          <span className="tab-count-badge">{locationsCount}</span>
        </button>
        <button
          type="button"
          className={`jd-main-tab-btn ${mainTab === 'invoices' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('invoices')
            handleRefreshInvoices?.()
          }}
          title="Invoices Tabular View & Auto-Parser"
        >
          <span className="tab-icon">📄</span>
          <span className="tab-label">Invoices</span>
          <span className="tab-count-badge">{displayInvoicesCount}</span>
        </button>
        <button
          type="button"
          className={`jd-main-tab-btn ${mainTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setMainTab('contacts')}
          title="Contacts, Follow-up Dates & Remarks"
        >
          <span className="tab-icon">👥</span>
          <span className="tab-label">Contacts & Follow-ups</span>
          <span className="tab-count-badge">{locationsCount}</span>
        </button>
        <button
          type="button"
          className={`jd-main-tab-btn ${mainTab === 'collections' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('collections')
            handleRefreshCollections?.()
          }}
          title="Individual Collection Records & Excel Import"
        >
          <span className="tab-icon">👤</span>
          <span className="tab-label">Individual Collection</span>
          <span className="tab-count-badge">{individualCollectionsCount}</span>
        </button>
      </div>

      <div className="jd-header-actions">
        {mainTab === 'maps' && (
          <>
            {/* View mode switcher */}
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

            {/* Add Pin Manually Button */}
            <button
              className="jd-btn primary"
              onClick={handleAddLocation}
            >
              + Add Location
            </button>

            {/* Import Multiple PDFs Button */}
            <button
              className="jd-btn jd-btn-batch-import"
              onClick={handleBatchImport}
              title="Import multiple invoice PDFs to create multiple locations at once"
            >
              📑 Import Multiple PDFs
            </button>

            {/* Export JSON */}
            <button className="jd-btn" onClick={handleExport} title="Download JSON backup">
              💾 Export JSON
            </button>

            {/* Toggle Sidebar */}
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
          <button
            className="jd-btn"
            onClick={handleRefreshInvoices}
            title="Refresh Invoices List"
          >
            🔄 Refresh Invoices
          </button>
        )}

        {mainTab === 'contacts' && (
          <button
            className="jd-btn"
            onClick={handleRefreshContacts}
            title="Refresh Contacts List"
          >
            🔄 Refresh Contacts
          </button>
        )}

        {mainTab === 'collections' && (
          <button
            className="jd-btn"
            onClick={handleRefreshCollections}
            title="Refresh Individual Collections List"
          >
            🔄 Refresh Collections
          </button>
        )}

        {/* Back to Calendar */}
        <button className="jd-btn nav-back" onClick={handleBackToCalendar}>
          ← Calendar
        </button>
      </div>
    </header>
  )
}
