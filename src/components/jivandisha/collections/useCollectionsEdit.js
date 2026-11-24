import { useState } from 'react'
import { API_BASE_URL } from '../jivandishaHelpers'
import { normalizeCount, normalizeAmount } from '../excelIndividualCollectionHelper'

export function useCollectionsEdit({ loadCollections }) {
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({
    individual_name: '',
    count: 0,
    date: '',
    cost: '',
    collection: '',
    notes: ''
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setEditForm({
      individual_name: item.individual_name || '',
      count: item.count || 0,
      date: item.date || '',
      cost: item.cost !== null && item.cost !== undefined ? String(item.cost) : '',
      collection: item.collection !== null && item.collection !== undefined ? String(item.collection) : '',
      notes: item.notes || ''
    })
  }

  const handleCloseEdit = () => {
    setEditingItem(null)
  }

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault()
    if (!editingItem) return
    if (!editForm.individual_name || !String(editForm.individual_name).trim()) {
      alert('Individual Name is required.')
      return
    }

    setIsSavingEdit(true)
    try {
      const payload = {
        individual_name: String(editForm.individual_name).trim(),
        count: normalizeCount(editForm.count),
        date: editForm.date || null,
        cost: normalizeAmount(editForm.cost),
        collection: normalizeAmount(editForm.collection),
        notes: editForm.notes || ''
      }

      const res = await fetch(`${API_BASE_URL}/individual-collections/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        handleCloseEdit()
        await loadCollections()
      } else {
        alert('Failed to update record: ' + (data.message || 'Server error'))
      }
    } catch (err) {
      console.error('Error updating record:', err)
      alert('Failed to update record: ' + err.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  return {
    editingItem,
    editForm,
    setEditForm,
    isSavingEdit,
    handleOpenEdit,
    handleCloseEdit,
    handleSaveEdit
  }
}
