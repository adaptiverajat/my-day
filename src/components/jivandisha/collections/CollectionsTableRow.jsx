import React from 'react'

export default function CollectionsTableRow({
  item,
  idx,
  isChecked,
  onToggleSelect,
  onOpenEdit,
  onDelete
}) {
  const net = (Number(item.collection) || 0) - (Number(item.cost) || 0)

  return (
    <tr style={{ backgroundColor: isChecked ? '#eff6ff' : 'inherit' }}>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggleSelect(item.id)}
        />
      </td>
      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>{idx + 1}</td>
      <td style={{ textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>
        {item.individual_name}
      </td>
      <td style={{ textAlign: 'left' }}>
        <span
          style={{
            background: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: 600,
            fontSize: '0.82rem'
          }}
        >
          📦 {item.count}
        </span>
      </td>
      <td style={{ textAlign: 'left', fontSize: '0.82rem', color: '#475569' }}>
        {item.date ? `📅 ${item.date}` : '—'}
      </td>
      <td style={{ textAlign: 'left', fontWeight: 500, color: '#dc2626', fontSize: '0.82rem' }}>
        ₹{Number(item.cost || 0).toFixed(2)}
      </td>
      <td style={{ textAlign: 'left', fontWeight: 600, color: '#059669', fontSize: '0.85rem' }}>
        ₹{Number(item.collection || 0).toFixed(2)}
      </td>
      <td
        style={{
          textAlign: 'left',
          fontWeight: 600,
          fontSize: '0.82rem',
          color: net >= 0 ? '#059669' : '#dc2626'
        }}
      >
        {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
      </td>
      <td style={{ textAlign: 'left', fontSize: '0.78rem', color: '#64748b', maxWidth: '200px' }}>
        {item.notes || '—'}
      </td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', gap: '6px' }}>
          <button
            type="button"
            className="jd-btn"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={() => onOpenEdit(item)}
            title="Edit record"
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="jd-btn"
            style={{
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: '#dc2626',
              borderColor: '#fca5a5'
            }}
            onClick={() => onDelete(item.id, item.individual_name)}
            title="Delete record"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  )
}
