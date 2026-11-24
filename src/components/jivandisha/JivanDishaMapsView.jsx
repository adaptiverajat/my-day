import React from 'react'

export default function JivanDishaMapsView({
  totalInvoicesCount,
  totalBooksAllInvoices,
  totalAmountAllInvoices,
  paidInvoicesCount,
  pendingInvoicesCount,
  viewMode,
  indiaCount,
  usaCount,
  indiaContainerRef,
  usaContainerRef
}) {
  return (
    <div className="jd-maps-wrapper">
      {/* KPI Summary Cards on Maps View */}
      <div className="jd-kpi-grid" style={{ marginBottom: '14px', flexShrink: 0 }}>
        <div className="jd-kpi-card blue">
          <div className="jd-kpi-icon-wrap">📄</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Total Invoices</span>
            <span className="jd-kpi-value">{totalInvoicesCount}</span>
            <span className="jd-kpi-sub">Across all operational centers</span>
          </div>
        </div>
        <div className="jd-kpi-card purple">
          <div className="jd-kpi-icon-wrap">📦</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Total Books Sent</span>
            <span className="jd-kpi-value">{totalBooksAllInvoices.toLocaleString()}</span>
            <span className="jd-kpi-sub">Literature copies shipped</span>
          </div>
        </div>
        <div className="jd-kpi-card emerald">
          <div className="jd-kpi-icon-wrap">💰</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Total Invoiced Amount</span>
            <span className="jd-kpi-value">
              {totalAmountAllInvoices > 0
                ? `₹${totalAmountAllInvoices.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
            <span className="jd-kpi-sub">{paidInvoicesCount} Paid • {pendingInvoicesCount} Pending</span>
          </div>
        </div>
        <div className="jd-kpi-card amber">
          <div className="jd-kpi-icon-wrap">⏳</div>
          <div className="jd-kpi-content">
            <span className="jd-kpi-title">Payment Pending</span>
            <span className="jd-kpi-value">{pendingInvoicesCount}</span>
            <span className="jd-kpi-sub">Awaiting payment receipt</span>
          </div>
        </div>
      </div>

      {/* Maps Section */}
      <div className={`jd-maps-container ${viewMode}`}>
        {/* India Map Card */}
        <div className="jd-map-card india">
          <div className="jd-map-card-header">
            <div className="jd-map-card-title">
              <span>🇮🇳 India Operations</span>
              <span className="jd-map-count-badge">{indiaCount} points</span>
            </div>
            <div className="jd-map-hint">
              <span>💡 Click anywhere on map to add location</span>
            </div>
          </div>
          <div ref={indiaContainerRef} className="jd-map-view" />
        </div>

        {/* USA Map Card */}
        <div className="jd-map-card usa">
          <div className="jd-map-card-header">
            <div className="jd-map-card-title">
              <span>🇺🇸 USA Operations</span>
              <span className="jd-map-count-badge">{usaCount} points</span>
            </div>
            <div className="jd-map-hint">
              <span>💡 Click anywhere on map to add location</span>
            </div>
          </div>
          <div ref={usaContainerRef} className="jd-map-view" />
        </div>
      </div>
    </div>
  )
}
