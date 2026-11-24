import { useState, useMemo } from 'react'
import { API_BASE_URL } from '../jivandishaHelpers'
import { normalizeCount, normalizeAmount } from '../excelIndividualCollectionHelper'

export function useCollectionsMerge({ collections, selectedIds, setSelectedIds, loadCollections }) {
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [primaryRecordId, setPrimaryRecordId] = useState(null)
  const [mergeForm, setMergeForm] = useState({
    individual_name: '',
    count: 0,
    date: '',
    cost: '',
    collection: '',
    notes: ''
  })
  const [isMerging, setIsMerging] = useState(false)

  const selectedRecordsForMerge = useMemo(() => {
    if (selectedIds.length !== 2) return []
    return selectedIds.map((id) => collections.find((c) => c.id === id)).filter(Boolean)
  }, [selectedIds, collections])

  const handleOpenMergeModal = () => {
    if (selectedRecordsForMerge.length !== 2) {
      alert('Please select exactly 2 records to merge.')
      return
    }
    const [recA, recB] = selectedRecordsForMerge
    setPrimaryRecordId(recA.id)
    setMergeForm({
      individual_name: recA.individual_name || recB.individual_name || '',
      count: (Number(recA.count) || 0) + (Number(recB.count) || 0),
      date: recA.date || recB.date || '',
      cost: (Number(recA.cost || 0) + Number(recB.cost || 0)).toFixed(2),
      collection: (Number(recA.collection || 0) + Number(recB.collection || 0)).toFixed(2),
      notes: [recA.notes, recB.notes].filter(Boolean).join(' | ')
    })
    setShowMergeModal(true)
  }

  const handleSwitchPrimary = (newPrimaryId) => {
    setPrimaryRecordId(newPrimaryId)
    const newPrimary = selectedRecordsForMerge.find((r) => r.id === newPrimaryId)
    const newDup = selectedRecordsForMerge.find((r) => r.id !== newPrimaryId)
    if (newPrimary && newDup) {
      setMergeForm((prev) => ({
        ...prev,
        individual_name: newPrimary.individual_name || prev.individual_name,
        date: newPrimary.date || newDup.date || prev.date
      }))
    }
  }

  const handleConfirmMerge = async () => {
    if (!primaryRecordId) return
    const dupRec = selectedRecordsForMerge.find((r) => r.id !== primaryRecordId)
    if (!dupRec) return

    setIsMerging(true)
    try {
      const payload = {
        primary_id: primaryRecordId,
        duplicate_id: dupRec.id,
        merged_fields: {
          individual_name: String(mergeForm.individual_name).trim(),
          count: normalizeCount(mergeForm.count),
          date: mergeForm.date || null,
          cost: normalizeAmount(mergeForm.cost),
          collection: normalizeAmount(mergeForm.collection),
          notes: mergeForm.notes || ''
        }
      }
      const res = await fetch(`${API_BASE_URL}/individual-collections/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok && data.success) {
        alert('✅ Records merged successfully!')
        setShowMergeModal(false)
        setSelectedIds([])
        await loadCollections()
      } else {
        alert('Failed to merge records: ' + (data.message || 'Server error'))
      }
    } catch (err) {
      console.error('Error merging records:', err)
      alert('Failed to merge records: ' + err.message)
    } finally {
      setIsMerging(false)
    }
  }

  return {
    showMergeModal,
    setShowMergeModal,
    primaryRecordId,
    mergeForm,
    setMergeForm,
    isMerging,
    selectedRecordsForMerge,
    handleOpenMergeModal,
    handleSwitchPrimary,
    handleConfirmMerge
  }
}
