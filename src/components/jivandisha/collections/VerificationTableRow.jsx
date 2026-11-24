import React from 'react'

export default function VerificationTableRow({
  r,
  idx,
  onToggleSelect,
  onUpdateField,
  onRemoveRow
}) {
  const net = (Number(r.collection) || 0) - (Number(r.cost) || 0)

  return (
    <tr style={{ backgroundColor: !r.selected ? '#f8fafc' : r.isDbDup ? '#fffbeb' : 'inherit' }}>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={Boolean(r.selected)}
          onChange={() => onToggleSelect(r.id)}
        />
      </td>
      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>{idx + 1}</td>
      <td style={{ textAlign: 'left' }}>
        <input
          type="text"
          value={r.individual_name}
          onChange={(e) => onUpdateField(r.id, 'individual_name', e.target.value)}
          className="jd-search-input"
          style={{ width: '100%', textAlign: 'left', borderColor: !r.individual_name ? '#ef4444' : undefined }}
          placeholder="Individual Name"
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          value={r.count}
          onChange={(e) => onUpdateField(r.id, 'count', e.target.value)}
          className="jd-search-input"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="date"
          value={r.date}
          onChange={(e) => onUpdateField(r.id, 'date', e.target.value)}
          className="jd-search-input"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          min="0"
          value={r.cost}
          onChange={(e) => onUpdateField(r.id, 'cost', e.target.value)}
          className="jd-search-input"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          min="0"
          value={r.collection}
          onChange={(e) => onUpdateField(r.id, 'collection', e.target.value)}
          className="jd-search-input"
          style={{ width: '100%' }}
        />
      </td>
      <td style={{ fontWeight: 600, fontSize: '0.82rem', color: net >= 0 ? '#059669' : '#dc2626' }}>
        {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
      </td>
      <td>
        {r.isDbDup ? (
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }} title="Same individual name & date already exists in DB">
            ⚠️ DB Duplicate
          </span>
        ) : r.isSheetDup ? (
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
            Sheet Duplicate
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>
            Ready
          </span>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="jd-btn"
          style={{ padding: '3px 8px', color: '#dc2626', borderColor: '#fca5a5' }}
          onClick={() => onRemoveRow(r.id)}
          title="Remove row from preview"
        >
          🗑️
        </button>
      </td>
    </tr>
  )
}
