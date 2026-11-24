import React from 'react'

export default function ContactsKpiCards({
  totalLocationsCount,
  contactsDueTodayCount,
  contactsOverdueCount,
  contactsUpcomingCount
}) {
  return (
    <div className="jd-kpi-grid">
      <div className="jd-kpi-card blue">
        <div className="jd-kpi-icon-wrap">👥</div>
        <div className="jd-kpi-content">
          <span className="jd-kpi-title">Total Contacts / Centers</span>
          <span className="jd-kpi-value">{totalLocationsCount}</span>
          <span className="jd-kpi-sub">Active operations points</span>
        </div>
      </div>
      <div className="jd-kpi-card amber">
        <div className="jd-kpi-icon-wrap">🔔</div>
        <div className="jd-kpi-content">
          <span className="jd-kpi-title">Due Today</span>
          <span className="jd-kpi-value">{contactsDueTodayCount}</span>
          <span className="jd-kpi-sub">Needs immediate contact</span>
        </div>
      </div>
      <div className="jd-kpi-card rose">
        <div className="jd-kpi-icon-wrap">⚠️</div>
        <div className="jd-kpi-content">
          <span className="jd-kpi-title">Overdue Follow-ups</span>
          <span className="jd-kpi-value">{contactsOverdueCount}</span>
          <span className="jd-kpi-sub">Pending past scheduled date</span>
        </div>
      </div>
      <div className="jd-kpi-card emerald">
        <div className="jd-kpi-icon-wrap">📅</div>
        <div className="jd-kpi-content">
          <span className="jd-kpi-title">Upcoming</span>
          <span className="jd-kpi-value">{contactsUpcomingCount}</span>
          <span className="jd-kpi-sub">Scheduled future calls</span>
        </div>
      </div>
    </div>
  )
}
