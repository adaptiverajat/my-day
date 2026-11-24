import React from 'react'

export default function CollectionsTableFooter({ filteredCount, listTotals, listNet }) {
  const numFmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <tfoot>
      <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
        <td colSpan={2} style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>TOTAL</td>
        <td style={{ textAlign: 'left', color: '#1e293b' }}>{filteredCount} Individuals</td>
        <td style={{ textAlign: 'left', color: '#2563eb' }}>📦 {listTotals.count.toLocaleString()}</td>
        <td style={{ textAlign: 'left' }}></td>
        <td style={{ textAlign: 'left', color: '#dc2626' }}>₹{numFmt(listTotals.cost)}</td>
        <td style={{ textAlign: 'left', color: '#059669' }}>₹{numFmt(listTotals.collection)}</td>
        <td style={{ textAlign: 'left', color: listNet >= 0 ? '#059669' : '#dc2626' }}>
          {listNet >= 0 ? '+' : ''}₹{numFmt(listNet)}
        </td>
        <td colSpan={2}></td>
      </tr>
    </tfoot>
  )
}
