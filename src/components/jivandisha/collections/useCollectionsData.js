import { useState, useMemo, useEffect } from 'react'
import { API_BASE_URL } from '../jivandishaHelpers'
import { filterAndSortCollections, computeCollectionTotals } from './collectionsFilterHelper'

export function useCollectionsData({ mainTab, onCollectionsCountChange }) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total_records: 0, total_count: 0, total_cost: 0, total_collection: 0, net_balance: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const loadCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections`)
      const data = await res.json()
      if (res.ok && data.success) {
        setCollections(data.collections || [])
        if (data.stats) setStats(data.stats)
        if (onCollectionsCountChange) onCollectionsCountChange(data.collections?.length || 0)
      }
    } catch (err) {
      console.error('Error loading individual collections:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mainTab === 'collections') loadCollections()
  }, [mainTab])

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSelectAllRows = (e, filteredList) => {
    setSelectedIds(e.target.checked ? filteredList.map((c) => c.id) : [])
  }

  const handleDeleteRecord = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the collection record for "${name}"?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        setSelectedIds((prev) => prev.filter((x) => x !== id))
        await loadCollections()
      } else {
        alert('Failed to delete record: ' + (data.message || 'Server error'))
      }
    } catch (err) {
      console.error('Error deleting record:', err)
      alert('Failed to delete record: ' + err.message)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)) return
    setIsBulkDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSelectedIds([])
        await loadCollections()
      } else {
        alert('Failed to delete records: ' + (data.message || 'Server error'))
      }
    } catch (err) {
      console.error('Error bulk deleting:', err)
      alert('Failed to bulk delete: ' + err.message)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const filteredCollections = useMemo(
    () => filterAndSortCollections(collections, searchTerm, sortBy),
    [collections, searchTerm, sortBy]
  )

  const listTotals = useMemo(
    () => computeCollectionTotals(filteredCollections),
    [filteredCollections]
  )

  const listNet = listTotals.collection - listTotals.cost

  return {
    collections, loading, stats, searchTerm, setSearchTerm, sortBy, setSortBy,
    selectedIds, setSelectedIds, isBulkDeleting, loadCollections,
    handleToggleSelectRow, handleSelectAllRows, handleDeleteRecord, handleBulkDelete,
    filteredCollections, listTotals, listNet
  }
}
