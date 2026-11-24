import React from 'react'
import { formatIndianNumber, formatIndianCounting } from './financesHelpers'

export default function FinancesAssetsSection({
  showAssetsSection,
  setShowAssetsSection,
  assets,
  draggedAssetId,
  setDraggedAssetId,
  handleToggleAssetExcluded,
  handleReorderAssets,
  handleDeleteAsset,
  showAssetModal,
  setShowAssetModal,
  editingAssetId,
  setEditingAssetId,
  addingExcluded,
  setAddingExcluded,
  handleSaveAsset,
  error
}) {
  return (
    <div className="finances-assets-section">
      <button 
        type="button"
        className="import-toggle-btn"
        onClick={() => setShowAssetsSection(!showAssetsSection)}
      >
        <span className="import-toggle-icon">{showAssetsSection ? '▼' : '▶'}</span>
        <span className="import-toggle-text">Assets</span>
      </button>

      {showAssetsSection && (
        <>
          {/* Active Assets (included in totals) */}
          <div className="assets-subsection-header">Assets (included in net worth)</div>
          <div 
            className="assets-grid assets-drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = parseInt(e.dataTransfer.getData('text/plain'), 10)
              if (!id) return
              const asset = assets.find(a => a.id === id)
              if (!asset) return
              if (asset.excluded) {
                handleToggleAssetExcluded(id, false)
                setDraggedAssetId(null)
                return
              }
              const dropTarget = e.target.closest('.asset-card')
              if (dropTarget) {
                const targetId = parseInt(dropTarget.dataset.assetId, 10)
                if (targetId && targetId !== id) {
                  const activeIds = assets.filter(a => !a.excluded).map(a => a.id)
                  const fromIndex = activeIds.indexOf(id)
                  const toIndex = activeIds.indexOf(targetId)
                  if (fromIndex !== -1 && toIndex !== -1) {
                    activeIds.splice(fromIndex, 1)
                    activeIds.splice(toIndex, 0, id)
                    handleReorderAssets(activeIds)
                  }
                }
              }
              setDraggedAssetId(null)
            }}
          >
            {assets.filter(a => !a.excluded).length === 0 && (
              <div className="no-assets">No assets added yet — drag here to include in net worth</div>
            )}
            {assets.filter(a => !a.excluded).map(asset => (
              <div 
                key={asset.id} 
                data-asset-id={asset.id}
                className={`asset-card asset-${asset.type} asset-${asset.category}${draggedAssetId === asset.id ? ' dragging' : ''}`}
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
                  <div className="asset-card-updated" title={new Date(asset.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>
                    Last Updated: {new Date(asset.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
            ))}
          </div>

          {/* Totals (only from non-excluded assets) */}
          <div className="assets-totals">
            {(() => {
              const activeAssets = assets.filter(a => !a.excluded && a.type !== 'insurance')
              const movableTotal = activeAssets
                .filter(a => a.category === 'movable')
                .reduce((sum, a) => sum + (a.type === 'liability' ? -Number(a.amount) : Number(a.amount)), 0)
              const immovableTotal = activeAssets
                .filter(a => a.category === 'immovable')
                .reduce((sum, a) => sum + (a.type === 'liability' ? -Number(a.amount) : Number(a.amount)), 0)
              const netWorth = movableTotal + immovableTotal
              return (
                <>
                  <div className="asset-total">
                    <span className="asset-total-label">Movable:</span>
                    <span className="asset-total-value">₹{formatIndianNumber(movableTotal)}</span>
                    {formatIndianCounting(movableTotal) && (
                      <span className="asset-total-indian">{formatIndianCounting(movableTotal)}</span>
                    )}
                  </div>
                  <div className="asset-total">
                    <span className="asset-total-label">Immovable:</span>
                    <span className="asset-total-value">₹{formatIndianNumber(immovableTotal)}</span>
                    {formatIndianCounting(immovableTotal) && (
                      <span className="asset-total-indian">{formatIndianCounting(immovableTotal)}</span>
                    )}
                  </div>
                  <div className="asset-total asset-total-networth">
                    <span className="asset-total-label">Net Worth:</span>
                    <span className="asset-total-value">₹{formatIndianNumber(netWorth)}</span>
                    {formatIndianCounting(netWorth) && (
                      <span className="asset-total-indian">{formatIndianCounting(netWorth)}</span>
                    )}
                  </div>
                </>
              )
            })()}
          </div>

          <button
            type="button"
            className="btn-add-asset"
            onClick={() => {
              setEditingAssetId(null)
              setAddingExcluded(false)
              setShowAssetModal(true)
            }}
          >
            Add Asset
          </button>

          {/* Excluded Assets (not included in totals) */}
          <div className="assets-subsection-header assets-subheader-excluded">Excluded Assets (not counted in net worth)</div>
          <div 
            className="assets-grid assets-drop-zone assets-drop-zone-excluded"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const id = parseInt(e.dataTransfer.getData('text/plain'), 10)
              if (!id) return
              const asset = assets.find(a => a.id === id)
              if (!asset) return
              if (!asset.excluded) {
                handleToggleAssetExcluded(id, true)
                setDraggedAssetId(null)
                return
              }
              const dropTarget = e.target.closest('.asset-card')
              if (dropTarget) {
                const targetId = parseInt(dropTarget.dataset.assetId, 10)
                if (targetId && targetId !== id) {
                  const excludedIds = assets.filter(a => a.excluded).map(a => a.id)
                  const fromIndex = excludedIds.indexOf(id)
                  const toIndex = excludedIds.indexOf(targetId)
                  if (fromIndex !== -1 && toIndex !== -1) {
                    excludedIds.splice(fromIndex, 1)
                    excludedIds.splice(toIndex, 0, id)
                    handleReorderAssets(excludedIds)
                  }
                }
              }
              setDraggedAssetId(null)
            }}
          >
            {assets.filter(a => a.excluded).length === 0 && (
              <div className="no-assets">No excluded assets — drag assets here to exclude from totals</div>
            )}
            {assets.filter(a => a.excluded).map(asset => (
              <div 
                key={asset.id} 
                data-asset-id={asset.id}
                className={`asset-card asset-${asset.type} asset-${asset.category} asset-excluded${draggedAssetId === asset.id ? ' dragging' : ''}`}
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
                  <div className="asset-card-updated" title={new Date(asset.updated_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>
                    Last Updated: {new Date(asset.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                  <span className="asset-tag tag-excluded">excluded</span>
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
            ))}
          </div>

          <div className="assets-totals">
            {(() => {
              const excludedAssets = assets.filter(a => a.excluded && a.type !== 'insurance')
              const assetsTotal = excludedAssets
                .filter(a => a.type === 'asset')
                .reduce((sum, a) => sum + Number(a.amount), 0)
              const liabilityTotal = excludedAssets
                .filter(a => a.type === 'liability')
                .reduce((sum, a) => sum + Number(a.amount), 0)
              return (
                <>
                  <div className="asset-total">
                    <span className="asset-total-label">Assets:</span>
                    <span className="asset-total-value asset-total-positive">₹{formatIndianNumber(assetsTotal)}</span>
                    {formatIndianCounting(assetsTotal) && (
                      <span className="asset-total-indian">{formatIndianCounting(assetsTotal)}</span>
                    )}
                  </div>
                  <div className="asset-total">
                    <span className="asset-total-label">Liabilities:</span>
                    <span className="asset-total-value asset-total-negative">₹{formatIndianNumber(liabilityTotal)}</span>
                    {formatIndianCounting(liabilityTotal) && (
                      <span className="asset-total-indian">{formatIndianCounting(liabilityTotal)}</span>
                    )}
                  </div>
                </>
              )
            })()}
          </div>

          <button
            type="button"
            className="btn-add-asset btn-add-excluded-asset"
            onClick={() => {
              setEditingAssetId(null)
              setAddingExcluded(true)
              setShowAssetModal(true)
            }}
          >
            Add Excluded Asset
          </button>
        </>
      )}

      {/* Asset Add/Edit Modal */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={() => { setShowAssetModal(false); setEditingAssetId(null); setAddingExcluded(false) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAssetId ? 'Edit Asset' : 'Add Asset'}</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                id="asset-name-input"
                defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.name : ''}
                placeholder="Asset name (e.g. Car, House, Gold)"
              />
            </div>
            <div className="form-group">
              <label>Amount (₹):</label>
              <input
                type="number"
                id="asset-amount-input"
                defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.amount : 0}
                placeholder="Worth in INR"
              />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select id="asset-category-input" defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.category : 'movable'}>
                <option value="movable">Movable</option>
                <option value="immovable">Immovable</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type:</label>
              <select id="asset-type-input" defaultValue={editingAssetId ? assets.find(a => a.id === editingAssetId)?.type : 'asset'}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Excluded from net worth:</label>
              <select id="asset-excluded-input" defaultValue={editingAssetId ? (assets.find(a => a.id === editingAssetId)?.excluded ? 'true' : 'false') : (addingExcluded ? 'true' : 'false')}>
                <option value="false">No (include in totals)</option>
                <option value="true">Yes (exclude from totals)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Percent (optional):</label>
              <input
                type="number"
                id="asset-percent-input"
                step="0.01"
                defaultValue={editingAssetId ? (assets.find(a => a.id === editingAssetId)?.percent !== null && assets.find(a => a.id === editingAssetId)?.percent !== undefined ? assets.find(a => a.id === editingAssetId)?.percent : '') : ''}
                placeholder="e.g. 15.5 (leave empty if not applicable)"
              />
            </div>
            <div className="form-notification-area">
              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => { setShowAssetModal(false); setEditingAssetId(null); setAddingExcluded(false) }}>Cancel</button>
              <button className="btn-save" onClick={handleSaveAsset}>
                {editingAssetId ? 'Update' : 'Add'} Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
