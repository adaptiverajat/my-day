import React from 'react'
import { formatIndianNumber, formatIndianCounting } from './financesHelpers'

export default function AssetCard({
  asset,
  draggedAssetId,
  setDraggedAssetId,
  setEditingAssetId,
  setShowAssetModal,
  handleDeleteAsset
}) {
  return (
    <div
      data-asset-id={asset.id}
      className={`asset-card asset-${asset.type} asset-${asset.category}${asset.excluded ? ' asset-excluded' : ''}${draggedAssetId === asset.id ? ' dragging' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', asset.id)
        setDraggedAssetId(asset.id)
      }}
      onDragEnd={() => setDraggedAssetId(null)}
    >
      <div className="asset-card-name" title={asset.name}>
        {asset.name.length > 20 ? asset.name.slice(0, 20) + '...' : asset.name}
      </div>
      {asset.updated_at && (
        <div
          className="asset-card-updated"
          title={new Date(asset.updated_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        >
          Last Updated: {new Date(asset.updated_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      )}
      <div className="asset-card-amount">
        {asset.type === 'liability' ? '-' : ''}₹{formatIndianNumber(Math.abs(Number(asset.amount)))}
      </div>
      {formatIndianCounting(asset.amount) && (
        <div className="asset-card-indian">{formatIndianCounting(asset.amount)}</div>
      )}
      <div className="asset-card-tags">
        <span className={`asset-tag tag-${asset.category}`}>{asset.category}</span>
        <span className={`asset-tag tag-${asset.type}`}>{asset.type}</span>
        {asset.excluded && <span className="asset-tag tag-excluded">excluded</span>}
        {asset.percent !== null && asset.percent !== undefined && (
          <span className="asset-tag tag-percent">{asset.percent}%</span>
        )}
      </div>
      <div className="asset-card-actions">
        <button
          type="button"
          className="btn-edit-asset"
          onClick={() => {
            setEditingAssetId(asset.id)
            setShowAssetModal(true)
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn-remove-expense"
          onClick={() => handleDeleteAsset(asset.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
