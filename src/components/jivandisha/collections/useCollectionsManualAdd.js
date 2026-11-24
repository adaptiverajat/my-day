import { useState } from 'react'
import { API_BASE_URL } from '../jivandishaHelpers'
import { normalizeCount, normalizeAmount } from '../excelIndividualCollectionHelper'

export function useCollectionsManualAdd({ collections, loadCollections }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({
    individual_name: '',
    count: 0,
    date: new Date().toISOString().slice(0, 10),
    cost: '',
    collection: '',
    notes: ''
  })
  const [isSavingManual, setIsSavingManual] = useState(false)

  const handleSaveManualEntry = async (e) => {
    if (e) e.preventDefault()
    if (!addForm.individual_name || !String(addForm.individual_name).trim()) {
      alert('Individual Name is required.')
      return
    }

    const trimmedName = String(addForm.individual_name).trim()
    const inputDate = addForm.date ? String(addForm.date).slice(0, 10).trim() : ''

    const existingDup = collections.find((c) => {
      const dbName = String(c.individual_name || '').trim().toLowerCase()
      const dbDate = c.date ? String(c.date).slice(0, 10).trim() : ''
      return dbName === trimmedName.toLowerCase() && dbDate === inputDate
    })

    if (existingDup) {
      const proceed = window.confirm(
        `⚠️ An individual collection for "${trimmedName}" on date "${inputDate}" already exists. Save a new entry?`
      )
      if (!proceed) return
    }

    setIsSavingManual(true)
    try {
      const payload = {
        individual_name: trimmedName,
        count: normalizeCount(addForm.count),
        date: addForm.date || null,
        cost: normalizeAmount(addForm.cost),
        collection: normalizeAmount(addForm.collection),
        notes: addForm.notes || ''
      }

      const res = await fetch(`${API_BASE_URL}/individual-collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('✅ Individual collection entry saved successfully!')
        setAddForm({
          individual_name: '',
          count: 0,
          date: new Date().toISOString().slice(0, 10),
          cost: '',
          collection: '',
          notes: ''
        })
        setShowAddForm(false)
        await loadCollections()
      } else {
        alert('Failed to save entry: ' + (data.message || 'Server error'))
      }
    } catch (err) {
      console.error('Error saving entry:', err)
      alert('Failed to save entry: ' + err.message)
    } finally {
      setIsSavingManual(false)
    }
  }

  return {
    showAddForm,
    setShowAddForm,
    addForm,
    setAddForm,
    isSavingManual,
    handleSaveManualEntry
  }
}
