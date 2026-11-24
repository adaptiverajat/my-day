import { useState } from 'react'

export function useFinancesAssets(setError) {
  const [showAssetsSection, setShowAssetsSection] = useState(false)
  const [assets, setAssets] = useState([])
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [editingAssetId, setEditingAssetId] = useState(null)
  const [draggedAssetId, setDraggedAssetId] = useState(null)
  const [addingExcluded, setAddingExcluded] = useState(false)

  const loadAssets = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/finances/assets')
      const data = await res.json()
      if (data.success) setAssets(data.assets)
    } catch (err) {
      console.error('Error loading assets:', err)
    }
  }

  const handleSaveAsset = async () => {
    const name = document.getElementById('asset-name-input')?.value.trim()
    const amount = parseFloat(document.getElementById('asset-amount-input')?.value) || 0
    const category = document.getElementById('asset-category-input')?.value
    const type = document.getElementById('asset-type-input')?.value
    const excluded = document.getElementById('asset-excluded-input')?.value === 'true'
    const percentStr = document.getElementById('asset-percent-input')?.value.trim()
    const percent = percentStr === '' ? null : parseFloat(percentStr)

    if (!name) {
      setError('Asset name is required')
      return
    }

    try {
      const url = editingAssetId
        ? `http://localhost:3001/api/finances/assets/${editingAssetId}`
        : 'http://localhost:3001/api/finances/assets'
      const res = await fetch(url, {
        method: editingAssetId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, category, type, excluded, percent })
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message || 'Failed to save asset')
        return
      }
      await loadAssets()
      setShowAssetModal(false)
      setEditingAssetId(null)
      setAddingExcluded(false)
      setError('')
    } catch (err) {
      console.error('Error saving asset:', err)
      setError('Failed to save asset')
    }
  }

  const handleDeleteAsset = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      const res = await fetch(`http://localhost:3001/api/finances/assets/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) await loadAssets()
      else setError(data.message || 'Failed to delete asset')
    } catch (err) {
      console.error('Error deleting asset:', err)
      setError('Failed to delete asset')
    }
  }

  const handleToggleAssetExcluded = async (id, excluded) => {
    try {
      const asset = assets.find(a => a.id === id)
      if (!asset) return
      const res = await fetch(`http://localhost:3001/api/finances/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...asset, excluded })
      })
      const data = await res.json()
      if (data.success) await loadAssets()
      else setError(data.message || 'Failed to update asset')
    } catch (err) {
      console.error('Error toggling asset exclusion:', err)
      setError('Failed to update asset')
    }
  }

  const handleReorderAssets = async (reorderedAssetIds) => {
    try {
      const res = await fetch('http://localhost:3001/api/finances/assets/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: reorderedAssetIds })
      })
      const data = await res.json()
      if (data.success) await loadAssets()
    } catch (err) {
      console.error('Error reordering assets:', err)
      await loadAssets()
    }
  }

  return {
    showAssetsSection,
    setShowAssetsSection,
    assets,
    showAssetModal,
    setShowAssetModal,
    editingAssetId,
    setEditingAssetId,
    draggedAssetId,
    setDraggedAssetId,
    addingExcluded,
    setAddingExcluded,
    loadAssets,
    handleSaveAsset,
    handleDeleteAsset,
    handleToggleAssetExcluded,
    handleReorderAssets
  }
}
