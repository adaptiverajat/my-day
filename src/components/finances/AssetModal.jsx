import React from 'react'

export default function AssetModal({
  showAssetModal,
  setShowAssetModal,
  editingAssetId,
  setEditingAssetId,
  addingExcluded,
  setAddingExcluded,
  assets,
  handleSaveAsset,
  error
}) {
  if (!showAssetModal) return null

  const handleClose = () => {
    setShowAssetModal(false)
    setEditingAssetId(null)
    setAddingExcluded(false)
  }

  const currentAsset = editingAssetId ? assets.find(a => a.id === editingAssetId) : null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editingAssetId ? 'Edit Asset' : 'Add Asset'}</h3>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            id="asset-name-input"
            defaultValue={currentAsset ? currentAsset.name : ''}
            placeholder="Asset name (e.g. Car, House, Gold)"
          />
        </div>
        <div className="form-group">
          <label>Amount (₹):</label>
          <input
            type="number"
            id="asset-amount-input"
            defaultValue={currentAsset ? currentAsset.amount : 0}
            placeholder="Worth in INR"
          />
        </div>
        <div className="form-group">
          <label>Category:</label>
          <select id="asset-category-input" defaultValue={currentAsset ? currentAsset.category : 'movable'}>
            <option value="movable">Movable</option>
            <option value="immovable">Immovable</option>
          </select>
        </div>
        <div className="form-group">
          <label>Type:</label>
          <select id="asset-type-input" defaultValue={currentAsset ? currentAsset.type : 'asset'}>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="insurance">Insurance</option>
          </select>
        </div>
        <div className="form-group">
          <label>Excluded from net worth:</label>
          <select
            id="asset-excluded-input"
            defaultValue={
              currentAsset
                ? (currentAsset.excluded ? 'true' : 'false')
                : (addingExcluded ? 'true' : 'false')
            }
          >
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
            defaultValue={
              currentAsset && currentAsset.percent !== null && currentAsset.percent !== undefined
                ? currentAsset.percent
                : ''
            }
            placeholder="e.g. 15.5 (leave empty if not applicable)"
          />
        </div>
        <div className="form-notification-area">
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="modal-buttons">
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
          <button className="btn-save" onClick={handleSaveAsset}>
            {editingAssetId ? 'Update' : 'Add'} Asset
          </button>
        </div>
      </div>
    </div>
  )
}
