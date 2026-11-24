import React from 'react'
import AssetCard from './AssetCard'
import AssetModal from './AssetModal'
import { ActiveAssetTotals, ExcludedAssetTotals } from './AssetTotals'

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
  const createDropHandler = (isTargetExcluded) => (e) => {
    e.preventDefault()
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (!id) return
    const asset = assets.find(a => a.id === id)
    if (!asset) return
    if (asset.excluded !== isTargetExcluded) {
      handleToggleAssetExcluded(id, isTargetExcluded)
      setDraggedAssetId(null)
      return
    }
    const dropTarget = e.target.closest('.asset-card')
    if (dropTarget) {
      const targetId = parseInt(dropTarget.dataset.assetId, 10)
      if (targetId && targetId !== id) {
        const groupIds = assets.filter(a => a.excluded === isTargetExcluded).map(a => a.id)
        const fromIndex = groupIds.indexOf(id)
        const toIndex = groupIds.indexOf(targetId)
        if (fromIndex !== -1 && toIndex !== -1) {
          groupIds.splice(fromIndex, 1)
          groupIds.splice(toIndex, 0, id)
          handleReorderAssets(groupIds)
        }
      }
    }
    setDraggedAssetId(null)
  }

  const cardProps = {
    draggedAssetId,
    setDraggedAssetId,
    setEditingAssetId,
    setShowAssetModal,
    handleDeleteAsset
  }

  const openAddModal = (excluded) => () => {
    setEditingAssetId(null)
    setAddingExcluded(excluded)
    setShowAssetModal(true)
  }

  const activeAssets = assets.filter(a => !a.excluded)
  const excludedAssets = assets.filter(a => a.excluded)

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
          <div className="assets-subsection-header">Assets (included in net worth)</div>
          <div
            className="assets-grid assets-drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={createDropHandler(false)}
          >
            {activeAssets.length === 0 && (
              <div className="no-assets">No assets added yet — drag here to include in net worth</div>
            )}
            {activeAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} {...cardProps} />
            ))}
          </div>

          <ActiveAssetTotals assets={assets} />

          <button type="button" className="btn-add-asset" onClick={openAddModal(false)}>
            Add Asset
          </button>

          <div className="assets-subsection-header assets-subheader-excluded">
            Excluded Assets (not counted in net worth)
          </div>
          <div
            className="assets-grid assets-drop-zone assets-drop-zone-excluded"
            onDragOver={(e) => e.preventDefault()}
            onDrop={createDropHandler(true)}
          >
            {excludedAssets.length === 0 && (
              <div className="no-assets">No excluded assets — drag assets here to exclude from totals</div>
            )}
            {excludedAssets.map(asset => (
              <AssetCard key={asset.id} asset={asset} {...cardProps} />
            ))}
          </div>

          <ExcludedAssetTotals assets={assets} />

          <button type="button" className="btn-add-asset btn-add-excluded-asset" onClick={openAddModal(true)}>
            Add Excluded Asset
          </button>
        </>
      )}

      <AssetModal
        showAssetModal={showAssetModal}
        setShowAssetModal={setShowAssetModal}
        editingAssetId={editingAssetId}
        setEditingAssetId={setEditingAssetId}
        addingExcluded={addingExcluded}
        setAddingExcluded={setAddingExcluded}
        assets={assets}
        handleSaveAsset={handleSaveAsset}
        error={error}
      />
    </div>
  )
}
