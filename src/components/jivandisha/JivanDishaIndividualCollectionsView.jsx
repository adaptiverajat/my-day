import React, { useState, useMemo, useRef, useEffect } from 'react'
import { API_BASE_URL } from './jivandishaHelpers'
import {
  parseExcelIndividualCollectionSheet,
  downloadIndividualCollectionTemplate,
  exportIndividualCollectionsToExcel,
  normalizeDate,
  normalizeAmount,
  normalizeCount
} from './excelIndividualCollectionHelper'

export default function JivanDishaIndividualCollectionsView({
  mainTab,
  onCollectionsCountChange
}) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total_records: 0,
    total_count: 0,
    total_cost: 0,
    total_collection: 0,
    net_balance: 0
  })

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  // Manual Add Form State
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

  // Excel Upload & Preview State
  const [excelFile, setExcelFile] = useState(null)
  const [isReadingExcel, setIsReadingExcel] = useState(false)
  const [excelStatusMsg, setExcelStatusMsg] = useState(null)
  const [parsedRecords, setParsedRecords] = useState([])
  const [isSavingBulk, setIsSavingBulk] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Edit Modal State
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

  // Merge Duplicate State (Select 2 records to merge)
  const [selectedIds, setSelectedIds] = useState([])
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
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Load collections from server
  const loadCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections`)
      const data = await res.json()
      if (res.ok && data.success) {
        setCollections(data.collections || [])
        if (data.stats) setStats(data.stats)
        if (onCollectionsCountChange) {
          onCollectionsCountChange(data.collections?.length || 0)
        }
      }
    } catch (err) {
      console.error('Error loading individual collections:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mainTab === 'collections') {
      loadCollections()
    }
  }, [mainTab])

  // Handle Excel file selection / drop
  const processUploadedExcel = async (file) => {
    if (!file) return

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      setExcelStatusMsg({
        type: 'error',
        text: 'Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.'
      })
      return
    }

    setIsReadingExcel(true)
    setExcelStatusMsg(null)

    try {
      const records = await parseExcelIndividualCollectionSheet(file)
      if (!records || records.length === 0) {
        setExcelStatusMsg({
          type: 'error',
          text: `No valid rows with "Individual Name", "Count", "Date", "Cost", or "Collection" columns were found in "${file.name}". Try downloading the sample template.`
        })
        setParsedRecords([])
        setExcelFile(null)
      } else {
        setParsedRecords(records)
        setExcelFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB'
        })
        setExcelStatusMsg({
          type: 'success',
          text: `🎉 Successfully read ${records.length} records from "${file.name}". Please verify the entries below before saving to the database.`
        })
      }
    } catch (err) {
      console.error('Error reading Excel file:', err)
      setExcelStatusMsg({
        type: 'error',
        text: 'Failed to read Excel file: ' + (err.message || 'Unknown format error')
      })
    } finally {
      setIsReadingExcel(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processUploadedExcel(file)
  }

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processUploadedExcel(file)
  }

  // Verification table field updates
  const handleUpdateParsedField = (id, field, value) => {
    setParsedRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        return { ...r, [field]: value }
      })
    )
  }

  const handleToggleSelectParsed = (id) => {
    setParsedRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    )
  }

  const handleSelectAllParsed = (val) => {
    setParsedRecords((prev) => prev.map((r) => ({ ...r, selected: val })))
  }

  const handleRemoveParsedRow = (id) => {
    setParsedRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const handleClearExcelSheet = () => {
    setParsedRecords([])
    setExcelFile(null)
    setExcelStatusMsg(null)
  }

  // Detect duplicates in parsed Excel records against database
  const parsedRecordsWithDups = useMemo(() => {
    return parsedRecords.map((item, idx) => {
      const name = String(item.individual_name || '').trim().toLowerCase()
      const itemDate = item.date ? String(item.date).slice(0, 10).trim() : ''

      const dbDup = collections.some((dbItem) => {
        const dbName = String(dbItem.individual_name || '').trim().toLowerCase()
        const dbDate = dbItem.date ? String(dbItem.date).slice(0, 10).trim() : ''
        return name && dbName === name && itemDate && dbDate === itemDate
      })

      const sheetDup = parsedRecords.some((other, oIdx) => {
        if (oIdx === idx) return false
        const otherName = String(other.individual_name || '').trim().toLowerCase()
        const otherDate = other.date ? String(other.date).slice(0, 10).trim() : ''
        return name && otherName === name && itemDate && otherDate === itemDate
      })

      return {
        ...item,
        isDbDup: dbDup,
        isSheetDup: sheetDup
      }
    })
  }, [parsedRecords, collections])

  const selectedParsedRecords = useMemo(
    () => parsedRecordsWithDups.filter((r) => r.selected),
    [parsedRecordsWithDups]
  )

  const parsedTotals = useMemo(() => {
    return selectedParsedRecords.reduce(
      (acc, r) => {
        acc.count += Number(r.count) || 0
        acc.cost += Number(r.cost) || 0
        acc.collection += Number(r.collection) || 0
        return acc
      },
      { count: 0, cost: 0, collection: 0 }
    )
  }, [selectedParsedRecords])

  // Save verified Excel records to DB
  const handleSaveVerifiedRecords = async () => {
    if (selectedParsedRecords.length === 0) {
      alert('Please select at least one record to save.')
      return
    }

    // Check for empty names
    const emptyRow = selectedParsedRecords.find(
      (r) => !r.individual_name || !String(r.individual_name).trim()
    )
    if (emptyRow) {
      alert(`Row #${emptyRow.row_index || 1} has an empty Individual Name. Please fill it before saving.`)
      return
    }

    // Check for duplicate warnings
    const dupCount = selectedParsedRecords.filter((r) => r.isDbDup).length
    if (dupCount > 0) {
      const proceed = window.confirm(
        `⚠️ Warning: ${dupCount} of the selected records already exist for the same Individual Name and Date in your database. Do you still want to proceed with saving?`
      )
      if (!proceed) return
    }

    setIsSavingBulk(true)
    try {
      const payload = {
        records: selectedParsedRecords.map((r) => ({
          individual_name: String(r.individual_name).trim(),
          count: normalizeCount(r.count),
          date: normalizeDate(r.date),
          cost: normalizeAmount(r.cost),
          collection: normalizeAmount(r.collection),
          notes: r.notes || ''
        }))
      }

      const res = await fetch(`${API_BASE_URL}/individual-collections/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert(`✅ ${data.message || 'Records saved successfully!'}`)
        handleClearExcelSheet()
        await loadCollections()
      } else {
        alert('Failed to save records: ' + (data.message || 'Server error'))
      }
    } catch (err) {
      console.error('Error saving bulk records:', err)
      alert('Failed to save records: ' + err.message)
    } finally {
      setIsSavingBulk(false)
    }
  }

  // Handle single manual entry save
  const handleSaveManualEntry = async (e) => {
    if (e) e.preventDefault()
    if (!addForm.individual_name || !String(addForm.individual_name).trim()) {
      alert('Individual Name is required.')
      return
    }

    const trimmedName = String(addForm.individual_name).trim()
    const inputDate = addForm.date ? String(addForm.date).slice(0, 10).trim() : ''

    // Check duplicate in DB
    const existingDup = collections.find((c) => {
      const dbName = String(c.individual_name || '').trim().toLowerCase()
      const dbDate = c.date ? String(c.date).slice(0, 10).trim() : ''
      return dbName === trimmedName.toLowerCase() && dbDate === inputDate
    })

    if (existingDup) {
      const proceed = window.confirm(
        `⚠️ An individual collection for "${trimmedName}" on date "${inputDate}" already exists (Count: ${existingDup.count}, Collection: ₹${existingDup.collection}). Do you still want to save a new entry?`
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

  // Handle Edit Modal
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

  // Delete single record
  const handleDeleteRecord = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the collection record for "${name}"?`)
    if (!confirmDelete) return

    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections/${id}`, {
        method: 'DELETE'
      })
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

  // Selection toggle for merge / bulk delete
  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  const handleSelectAllRows = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCollections.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }

  // Merge selected 2 records
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

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const confirmBulk = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)
    if (!confirmBulk) return

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

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let list = [...collections]

    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim()
      list = list.filter(
        (c) =>
          (c.individual_name && c.individual_name.toLowerCase().includes(q)) ||
          (c.date && c.date.includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '')
      if (sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '')
      if (sortBy === 'name-asc') return (a.individual_name || '').localeCompare(b.individual_name || '')
      if (sortBy === 'name-desc') return (b.individual_name || '').localeCompare(a.individual_name || '')
      if (sortBy === 'count-desc') return (b.count || 0) - (a.count || 0)
      if (sortBy === 'collection-desc') return (b.collection || 0) - (a.collection || 0)
      if (sortBy === 'cost-desc') return (b.cost || 0) - (a.cost || 0)
      return 0
    })

    return list
  }, [collections, searchTerm, sortBy])

  // Totals of Count, Cost and Collections for the current list
  const listTotals = useMemo(() => {
    return filteredCollections.reduce(
      (acc, item) => {
        acc.count += Number(item.count || 0)
        acc.cost += Number(item.cost || 0)
        acc.collection += Number(item.collection || 0)
        return acc
      },
      { count: 0, cost: 0, collection: 0 }
    )
  }, [filteredCollections])
  const listNet = listTotals.collection - listTotals.cost

  if (mainTab !== 'collections') return null

  return (
    <div className="jd-invoices-view jd-individual-collections-view">
      {/* KPI Stats Cards Row */}
      <div className="jd-inv-kpi-grid">
        <div className="jd-inv-kpi-card">
          <div className="kpi-icon">👤</div>
          <div className="kpi-data">
            <span className="kpi-label">Total Individuals</span>
            <span className="kpi-value">{stats.total_records}</span>
            <span className="kpi-sub">Unique collection records</span>
          </div>
        </div>

        <div className="jd-inv-kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-data">
            <span className="kpi-label">Total Count</span>
            <span className="kpi-value">{stats.total_count.toLocaleString()}</span>
            <span className="kpi-sub">Total items / books</span>
          </div>
        </div>

        <div className="jd-inv-kpi-card">
          <div className="kpi-icon">💸</div>
          <div className="kpi-data">
            <span className="kpi-label">Total Cost</span>
            <span className="kpi-value" style={{ color: '#dc2626' }}>
              ₹{stats.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="kpi-sub">Total cost incurred</span>
          </div>
        </div>

        <div className="jd-inv-kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-data">
            <span className="kpi-label">Total Collection</span>
            <span className="kpi-value" style={{ color: '#059669' }}>
              ₹{stats.total_collection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="kpi-sub">Total amount collected</span>
          </div>
        </div>

        <div className="jd-inv-kpi-card">
          <div className="kpi-icon">⚖️</div>
          <div className="kpi-data">
            <span className="kpi-label">Net Balance</span>
            <span
              className="kpi-value"
              style={{ color: stats.net_balance >= 0 ? '#059669' : '#dc2626' }}
            >
              {stats.net_balance >= 0 ? '+' : ''}
              ₹{stats.net_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="kpi-sub">Collection minus Cost</span>
          </div>
        </div>
      </div>

      {/* Top Action & Excel Upload Card */}
      <div className="jd-table-card">
        <div className="jd-table-card-header">
          <div>
            <h3>📥 Excel Sheet Reader & Quick Actions</h3>
            <p className="jd-card-subtitle">
              Upload an Excel (.xlsx, .xls) or CSV file with columns: <strong>Individual Name</strong>,{' '}
              <strong>Count</strong>, <strong>Date</strong>, <strong>Cost</strong>, <strong>Collection</strong>.
            </p>
          </div>
          <div className="jd-table-actions">
            <button
              type="button"
              className="jd-btn"
              onClick={downloadIndividualCollectionTemplate}
              title="Download sample Excel template with exact column names"
            >
              📄 Download Sample Excel
            </button>
            <button
              type="button"
              className="jd-btn"
              onClick={() => exportIndividualCollectionsToExcel(collections)}
              title="Export all individual collections to Excel"
            >
              💾 Export All to Excel
            </button>
            <button
              type="button"
              className={`jd-btn ${showAddForm ? '' : 'primary'}`}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✕ Close Form' : '+ Add New Entry'}
            </button>
          </div>
        </div>

        <div className="jd-table-card-body" style={{ padding: '16px' }}>
          {/* Drag & Drop Excel Box */}
          <div
            className={`jd-excel-dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #93c5fd',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: dragActive ? '#eff6ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>
              {isReadingExcel ? 'Reading Excel sheet...' : 'Click to select or drag & drop Excel Sheet here'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Recognizes exact columns: <code>Individual Name</code>, <code>Count</code>, <code>Date</code>,{' '}
              <code>Cost</code>, <code>Collection</code>
            </div>
            {excelFile && (
              <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
                📁 Loaded: {excelFile.name} ({excelFile.size})
              </div>
            )}
          </div>

          {/* Excel Status Message */}
          {excelStatusMsg && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                backgroundColor: excelStatusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: excelStatusMsg.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${excelStatusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`
              }}
            >
              {excelStatusMsg.text}
            </div>
          )}

          {/* Manual Add Form Toggle */}
          {showAddForm && (
            <form
              onSubmit={handleSaveManualEntry}
              style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e293b' }}>
                ➕ Add New Individual Collection Record
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Individual Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. Ramesh Patel"
                    value={addForm.individual_name}
                    onChange={(e) => setAddForm({ ...addForm, individual_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. 50"
                    value={addForm.count}
                    onChange={(e) => setAddForm({ ...addForm, count: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. 2500.00"
                    value={addForm.cost}
                    onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Collection (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. 5000.00"
                    value={addForm.collection}
                    onChange={(e) => setAddForm({ ...addForm, collection: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  className="jd-search-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="Optional notes or details"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="jd-btn primary"
                  disabled={isSavingManual}
                >
                  {isSavingManual ? 'Saving...' : '💾 Save Entry to Database'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Verification & Preview Table (When Excel is loaded) */}
      {parsedRecords.length > 0 && (
        <div className="jd-table-card" style={{ border: '2px solid #3b82f6' }}>
          <div className="jd-table-card-header" style={{ background: '#eff6ff' }}>
            <div>
              <h3 style={{ color: '#1e40af' }}>
                📋 Verify Extracted Records ({parsedRecords.length} Rows Identified)
              </h3>
              <p className="jd-card-subtitle" style={{ color: '#1d4ed8' }}>
                Review and edit any row before persisting to MySQL database.
              </p>
            </div>
            <div className="jd-table-actions">
              <button
                type="button"
                className="jd-btn"
                onClick={handleClearExcelSheet}
                title="Discard imported Excel sheet"
              >
                ✕ Clear Sheet
              </button>
              <button
                type="button"
                className="jd-btn primary"
                disabled={isSavingBulk || selectedParsedRecords.length === 0}
                onClick={handleSaveVerifiedRecords}
                title="Save verified records to MySQL"
              >
                {isSavingBulk
                  ? 'Saving...'
                  : `💾 Save ${selectedParsedRecords.length} Verified Records to Database`}
              </button>
            </div>
          </div>

          {/* Verification Summary Banner */}
          <div
            style={{
              padding: '10px 16px',
              background: '#dbeafe',
              borderBottom: '1px solid #bfdbfe',
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#1e3a8a'
            }}
          >
            <span>Selected: {selectedParsedRecords.length} / {parsedRecords.length} rows</span>
            <span>📦 Total Count: {parsedTotals.count.toLocaleString()}</span>
            <span>💸 Total Cost: ₹{parsedTotals.cost.toFixed(2)}</span>
            <span>💰 Total Collection: ₹{parsedTotals.collection.toFixed(2)}</span>
            <span>
              ⚖️ Net: ₹{(parsedTotals.collection - parsedTotals.cost).toFixed(2)}
            </span>
          </div>

          <div className="jd-table-scroll-wrap" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="jd-tabular-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={parsedRecords.length > 0 && parsedRecords.every((r) => r.selected)}
                      onChange={(e) => handleSelectAllParsed(e.target.checked)}
                      title="Select / Deselect all"
                    />
                  </th>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ textAlign: 'left' }}>Individual Name *</th>
                  <th style={{ width: '100px', textAlign: 'left' }}>Count</th>
                  <th style={{ width: '150px', textAlign: 'left' }}>Date</th>
                  <th style={{ width: '130px', textAlign: 'left' }}>Cost (₹)</th>
                  <th style={{ width: '130px', textAlign: 'left' }}>Collection (₹)</th>
                  <th style={{ width: '120px', textAlign: 'left' }}>Net Balance</th>
                  <th style={{ width: '110px', textAlign: 'left' }}>Status</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {parsedRecordsWithDups.map((r, idx) => {
                  const net = (Number(r.collection) || 0) - (Number(r.cost) || 0)
                  return (
                    <tr
                      key={r.id}
                      style={{
                        backgroundColor: !r.selected ? '#f8fafc' : r.isDbDup ? '#fffbeb' : 'inherit'
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(r.selected)}
                          onChange={() => handleToggleSelectParsed(r.id)}
                        />
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>{idx + 1}</td>
                      <td style={{ textAlign: 'left' }}>
                        <input
                          type="text"
                          value={r.individual_name}
                          onChange={(e) => handleUpdateParsedField(r.id, 'individual_name', e.target.value)}
                          className="jd-search-input"
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            borderColor: !r.individual_name ? '#ef4444' : undefined
                          }}
                          placeholder="Individual Name"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={r.count}
                          onChange={(e) => handleUpdateParsedField(r.id, 'count', e.target.value)}
                          className="jd-search-input"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={r.date}
                          onChange={(e) => handleUpdateParsedField(r.id, 'date', e.target.value)}
                          className="jd-search-input"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.cost}
                          onChange={(e) => handleUpdateParsedField(r.id, 'cost', e.target.value)}
                          className="jd-search-input"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.collection}
                          onChange={(e) => handleUpdateParsedField(r.id, 'collection', e.target.value)}
                          className="jd-search-input"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: net >= 0 ? '#059669' : '#dc2626'
                        }}
                      >
                        {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
                      </td>
                      <td>
                        {r.isDbDup ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 600
                            }}
                            title="Same individual name & date already exists in DB"
                          >
                            ⚠️ DB Duplicate
                          </span>
                        ) : r.isSheetDup ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontWeight: 600
                            }}
                          >
                            Sheet Duplicate
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#dcfce7',
                              color: '#166534',
                              fontWeight: 600
                            }}
                          >
                            Ready
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="jd-btn"
                          style={{ padding: '3px 8px', color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => handleRemoveParsedRow(r.id)}
                          title="Remove row from preview"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Database Records Table Card */}
      <div className="jd-table-card">
        <div className="jd-table-card-header">
          <div>
            <h3>👤 Individual Collection Records ({filteredCollections.length})</h3>
            <p className="jd-card-subtitle">
              Stored records in MySQL database. Select 2 records to merge duplicates.
            </p>
          </div>
          <div className="jd-table-actions">
            {selectedIds.length === 2 && (
              <button
                type="button"
                className="jd-btn primary"
                onClick={handleOpenMergeModal}
                title="Merge the 2 selected duplicate records into a single record"
              >
                🔀 Merge 2 Selected Records
              </button>
            )}
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="jd-btn"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                title="Delete all selected records"
              >
                🗑️ Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              type="button"
              className="jd-btn"
              onClick={loadCollections}
              title="Refresh database records"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Totals of Count, Cost and Collections at Top of List */}
        <div className="jd-list-totals-banner">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📊 List Totals:
          </span>
          <div className="jd-totals-chip count" title="Total Count of Books / Items in current list">
            <span className="chip-label">Count</span>
            <span className="chip-val">📦 {listTotals.count.toLocaleString()}</span>
          </div>
          <div className="jd-totals-chip cost" title="Total Cost in current list">
            <span className="chip-label">Cost</span>
            <span className="chip-val">💸 ₹{listTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="jd-totals-chip collection" title="Total Collections in current list">
            <span className="chip-label">Collections</span>
            <span className="chip-val">💰 ₹{listTotals.collection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className={`jd-totals-chip net ${listNet >= 0 ? 'positive' : 'negative'}`} title="Net Collection Balance (Collection - Cost)">
            <span className="chip-label">Net Balance</span>
            <span className="chip-val">
              ⚖️ {listNet >= 0 ? '+' : ''}₹{listNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {searchTerm && (
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
              (Filtered: showing {filteredCollections.length} of {collections.length} entries)
            </span>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="jd-search-input"
              placeholder="🔍 Search by Individual Name, Date, Notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Sort By:</span>
            <select
              className="jd-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">📅 Date (Newest first)</option>
              <option value="date-asc">📅 Date (Oldest first)</option>
              <option value="name-asc">👤 Name (A → Z)</option>
              <option value="name-desc">👤 Name (Z → A)</option>
              <option value="count-desc">📦 Count (Highest first)</option>
              <option value="collection-desc">💰 Collection (Highest first)</option>
              <option value="cost-desc">💸 Cost (Highest first)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="jd-table-scroll-wrap">
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              Loading individual collections...
            </div>
          ) : filteredCollections.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
              <div style={{ fontWeight: 600 }}>No individual collection records found.</div>
              <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                Upload an Excel sheet with columns (Individual Name, Count, Date, Cost, Collection) or click "+ Add New Entry".
              </div>
            </div>
          ) : (
            <table className="jd-tabular-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredCollections.length > 0 &&
                        filteredCollections.every((c) => selectedIds.includes(c.id))
                      }
                      onChange={handleSelectAllRows}
                      title="Select all"
                    />
                  </th>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th style={{ textAlign: 'left' }}>Individual Name</th>
                  <th style={{ width: '110px', textAlign: 'left' }}>Count</th>
                  <th style={{ width: '130px', textAlign: 'left' }}>Date</th>
                  <th style={{ width: '140px', textAlign: 'left' }}>Cost (₹)</th>
                  <th style={{ width: '150px', textAlign: 'left' }}>Collection (₹)</th>
                  <th style={{ width: '140px', textAlign: 'left' }}>Net Balance</th>
                  <th style={{ textAlign: 'left' }}>Notes</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.map((item, idx) => {
                  const net = (Number(item.collection) || 0) - (Number(item.cost) || 0)
                  const isChecked = selectedIds.includes(item.id)

                  return (
                    <tr
                      key={item.id}
                      style={{ backgroundColor: isChecked ? '#eff6ff' : 'inherit' }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(item.id)}
                        />
                      </td>
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>{idx + 1}</td>
                      <td style={{ textAlign: 'left', fontWeight: 600, color: '#1e293b' }}>
                        {item.individual_name}
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <span
                          style={{
                            background: '#f1f5f9',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '0.82rem'
                          }}
                        >
                          📦 {item.count}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left', fontSize: '0.82rem', color: '#475569' }}>
                        {item.date ? `📅 ${item.date}` : '—'}
                      </td>
                      <td style={{ textAlign: 'left', fontWeight: 500, color: '#dc2626', fontSize: '0.82rem' }}>
                        ₹{Number(item.cost || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'left', fontWeight: 600, color: '#059669', fontSize: '0.85rem' }}>
                        ₹{Number(item.collection || 0).toFixed(2)}
                      </td>
                      <td
                        style={{
                          textAlign: 'left',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: net >= 0 ? '#059669' : '#dc2626'
                        }}
                      >
                        {net >= 0 ? '+' : ''}₹{net.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'left', fontSize: '0.78rem', color: '#64748b', maxWidth: '200px' }}>
                        {item.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="jd-btn"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleOpenEdit(item)}
                            title="Edit record"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="jd-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              color: '#dc2626',
                              borderColor: '#fca5a5'
                            }}
                            onClick={() => handleDeleteRecord(item.id, item.individual_name)}
                            title="Delete record"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={2} style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                    TOTAL
                  </td>
                  <td style={{ textAlign: 'left', color: '#1e293b', fontWeight: 700 }}>
                    {filteredCollections.length} Individuals
                  </td>
                  <td style={{ textAlign: 'left', color: '#2563eb', fontWeight: 700 }}>
                    📦 {listTotals.count.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'left' }}></td>
                  <td style={{ textAlign: 'left', color: '#dc2626', fontWeight: 700 }}>
                    ₹{listTotals.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'left', color: '#059669', fontWeight: 700 }}>
                    ₹{listTotals.collection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'left',
                      fontWeight: 700,
                      color: listNet >= 0 ? '#059669' : '#dc2626'
                    }}
                  >
                    {listNet >= 0 ? '+' : ''}₹{listNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingItem && (
        <div className="jd-modal-overlay">
          <div className="jd-modal-dialog" style={{ maxWidth: '520px' }}>
            <div className="jd-modal-header">
              <h3>✏️ Edit Individual Collection Record</h3>
              <button className="jd-modal-close" onClick={handleCloseEdit}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="jd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    Individual Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={editForm.individual_name}
                    onChange={(e) => setEditForm({ ...editForm, individual_name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={editForm.count}
                      onChange={(e) => setEditForm({ ...editForm, count: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={editForm.cost}
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                      Collection (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={editForm.collection}
                      onChange={(e) => setEditForm({ ...editForm, collection: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={3}
                    className="jd-search-input"
                    style={{ width: '100%', boxSizing: 'border-box', height: 'auto' }}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="jd-modal-footer">
                <button type="button" className="jd-btn" onClick={handleCloseEdit}>
                  Cancel
                </button>
                <button type="submit" className="jd-btn primary" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Duplicates Modal */}
      {showMergeModal && selectedRecordsForMerge.length === 2 && (
        <div className="jd-modal-overlay">
          <div className="jd-modal-dialog" style={{ maxWidth: '680px' }}>
            <div className="jd-modal-header">
              <h3>🔀 Merge Duplicate Individual Collections</h3>
              <button className="jd-modal-close" onClick={() => setShowMergeModal(false)}>
                ✕
              </button>
            </div>

            <div className="jd-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  color: '#92400e'
                }}
              >
                Select which record should serve as the <strong>Primary</strong>. The secondary record will be deleted from MySQL, and the combined counts, costs, and collections will be retained.
              </div>

              {/* Side-by-side selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {selectedRecordsForMerge.map((rec) => {
                  const isPrim = rec.id === primaryRecordId
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSwitchPrimary(rec.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: isPrim ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isPrim ? '#eff6ff' : '#f8fafc',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          {isPrim ? '⭐ Primary Record' : 'Duplicate (Will Delete)'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID #{rec.id}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>
                        <div><strong>Name:</strong> {rec.individual_name}</div>
                        <div><strong>Count:</strong> {rec.count}</div>
                        <div><strong>Date:</strong> {rec.date || '—'}</div>
                        <div><strong>Cost:</strong> ₹{rec.cost}</div>
                        <div><strong>Collection:</strong> ₹{rec.collection}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Final Merged Values Preview / Edit */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#1e293b' }}>
                  Confirm Final Merged Record Values:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                      Individual Name
                    </label>
                    <input
                      type="text"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={mergeForm.individual_name}
                      onChange={(e) => setMergeForm({ ...mergeForm, individual_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                      Combined Count
                    </label>
                    <input
                      type="number"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={mergeForm.count}
                      onChange={(e) => setMergeForm({ ...mergeForm, count: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={mergeForm.date}
                      onChange={(e) => setMergeForm({ ...mergeForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                      Total Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={mergeForm.cost}
                      onChange={(e) => setMergeForm({ ...mergeForm, cost: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>
                      Total Collection (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="jd-search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={mergeForm.collection}
                      onChange={(e) => setMergeForm({ ...mergeForm, collection: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="jd-modal-footer">
              <button
                type="button"
                className="jd-btn"
                onClick={() => setShowMergeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="jd-btn primary"
                disabled={isMerging}
                onClick={handleConfirmMerge}
              >
                {isMerging ? 'Merging...' : '🔀 Confirm Merge & Delete Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
