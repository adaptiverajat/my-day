import React from 'react'
import AppLogoMenu from '../AppLogoMenu'
import JivanDishaTabs from './JivanDishaTabs'
import JivanDishaHeaderActions from './JivanDishaHeaderActions'

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

      <JivanDishaTabs
        mainTab={mainTab}
        setMainTab={setMainTab}
        locationsCount={locationsCount}
        displayInvoicesCount={displayInvoicesCount}
        individualCollectionsCount={individualCollectionsCount}
        handleRefreshInvoices={handleRefreshInvoices}
        handleRefreshCollections={handleRefreshCollections}
      />

      <JivanDishaHeaderActions
        mainTab={mainTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleAddLocation={handleAddLocation}
        handleBatchImport={handleBatchImport}
        handleExport={handleExport}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleRefreshInvoices={handleRefreshInvoices}
        handleRefreshContacts={handleRefreshContacts}
        handleRefreshCollections={handleRefreshCollections}
        handleBackToCalendar={handleBackToCalendar}
      />
    </header>
  )
}
