import React from 'react'

export default function JivanDishaTabs({
  mainTab,
  setMainTab,
  locationsCount = 0,
  displayInvoicesCount = 0,
  individualCollectionsCount = 0,
  handleRefreshInvoices,
  handleRefreshCollections
}) {
  return (
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
  )
}
