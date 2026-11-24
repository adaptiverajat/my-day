import React from 'react'
import { getFollowUpStatusInfo } from './jivandishaHelpers'

export default function ContactsTableRow({
  loc,
  idx,
  isSelected,
  selectedCount,
  onToggleSelect,
  onOpenFollowUp,
  onOpenEdit
}) {
  const fuInfo = getFollowUpStatusInfo(loc.next_follow_up_date)

  return (
    <tr className={isSelected ? 'jd-row-selected' : ''}>
      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(loc.id)}
          title={
            isSelected
              ? 'Selected for merge (click to uncheck)'
              : selectedCount >= 2
              ? '2 already selected. Clicking replaces the second.'
              : 'Select to merge duplicates'
          }
        />
      </td>
      <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{idx + 1}</td>
      <td>
        <div className="jd-table-loc-title">
          {loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title}
        </div>
        {loc.address && <span className="jd-table-sub">{loc.address}</span>}
      </td>
      <td>
        <strong>{[loc.city, loc.state].filter(Boolean).join(', ') || '—'}</strong>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{loc.decision_maker_name || '—'}</div>
        {loc.decision_maker_phone && (
          <span className="jd-table-sub">📞 {loc.decision_maker_phone}</span>
        )}
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{loc.inventory_keeper_name || '—'}</div>
        {loc.inventory_keeper_phone && (
          <span className="jd-table-sub">📞 {loc.inventory_keeper_phone}</span>
        )}
      </td>
      <td>
        {loc.contact_person && <div>👤 {loc.contact_person}</div>}
        {loc.contact_email ? (
          <a href={`mailto:${loc.contact_email}`} className="jd-table-sub">
            ✉️ {loc.contact_email}
          </a>
        ) : (
          !loc.contact_person && '—'
        )}
      </td>
      <td>
        <span className={`jd-fu-badge ${fuInfo.className}`}>{fuInfo.label}</span>
      </td>
      <td>
        <div className="jd-table-remarks">{loc.remarks || '—'}</div>
      </td>
      <td>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="jd-btn primary"
            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
            onClick={() => onOpenFollowUp(loc)}
            title="Set next follow-up date and remarks"
          >
            📅 Follow-Up
          </button>
          <button
            type="button"
            className="jd-btn"
            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
            onClick={() => onOpenEdit(loc)}
            title="Edit location details"
          >
            ✏️ Edit
          </button>
        </div>
      </td>
    </tr>
  )
}
