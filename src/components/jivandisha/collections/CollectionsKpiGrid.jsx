import React from 'react'

export default function CollectionsKpiGrid({ stats }) {
  return (
    <div className="jd-inv-kpi-grid">
      <div className="jd-inv-kpi-card">
        <div className="kpi-icon">👤</div>
        <div className="kpi-data">
          <span className="kpi-label">Total Individuals</span>
          <span className="kpi-value">{stats.total_records}</span>
          <span className="kpi-sub">Unique collection records</span>
        </div>
      </div>

      <div className="jd-inv-kpi-card">
        <div className="kpi-icon">📦</div>
        <div className="kpi-data">
          <span className="kpi-label">Total Count</span>
          <span className="kpi-value">{stats.total_count.toLocaleString()}</span>
          <span className="kpi-sub">Total items / books</span>
        </div>
      </div>

      <div className="jd-inv-kpi-card">
        <div className="kpi-icon">💸</div>
        <div className="kpi-data">
          <span className="kpi-label">Total Cost</span>
          <span className="kpi-value" style={{ color: '#dc2626' }}>
            ₹{stats.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="kpi-sub">Total cost incurred</span>
        </div>
      </div>

      <div className="jd-inv-kpi-card">
        <div className="kpi-icon">💰</div>
        <div className="kpi-data">
          <span className="kpi-label">Total Collection</span>
          <span className="kpi-value" style={{ color: '#059669' }}>
            ₹{stats.total_collection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="kpi-sub">Total amount collected</span>
        </div>
      </div>

      <div className="jd-inv-kpi-card">
        <div className="kpi-icon">⚖️</div>
        <div className="kpi-data">
          <span className="kpi-label">Net Balance</span>
          <span className="kpi-value" style={{ color: stats.net_balance >= 0 ? '#059669' : '#dc2626' }}>
            {stats.net_balance >= 0 ? '+' : ''}
            ₹{stats.net_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="kpi-sub">Collection minus Cost</span>
        </div>
      </div>
    </div>
  )
}
