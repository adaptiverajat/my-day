import { useState, useMemo, useRef } from 'react'
import { API_BASE_URL } from '../jivandishaHelpers'
import {
  parseExcelIndividualCollectionSheet,
  normalizeDate,
  normalizeAmount,
  normalizeCount
} from '../excelIndividualCollectionHelper'
import { detectCollectionDuplicates, computeParsedTotals } from './collectionsExcelHelper'

export function useCollectionsExcel({ collections, loadCollections }) {
  const [excelFile, setExcelFile] = useState(null)
  const [isReadingExcel, setIsReadingExcel] = useState(false)
  const [excelStatusMsg, setExcelStatusMsg] = useState(null)
  const [parsedRecords, setParsedRecords] = useState([])
  const [isSavingBulk, setIsSavingBulk] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const processUploadedExcel = async (file) => {
    if (!file) return
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      setExcelStatusMsg({ type: 'error', text: 'Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.' })
      return
    }
    setIsReadingExcel(true)
    setExcelStatusMsg(null)
    try {
      const records = await parseExcelIndividualCollectionSheet(file)
      if (!records || records.length === 0) {
        setExcelStatusMsg({ type: 'error', text: `No valid rows with required columns found in "${file.name}".` })
        setParsedRecords([])
        setExcelFile(null)
      } else {
        setParsedRecords(records)
        setExcelFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
        setExcelStatusMsg({ type: 'success', text: `🎉 Successfully read ${records.length} records from "${file.name}".` })
      }
    } catch (err) {
      console.error('Error reading Excel file:', err)
      setExcelStatusMsg({ type: 'error', text: 'Failed to read Excel file: ' + (err.message || 'Unknown format error') })
    } finally {
      setIsReadingExcel(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpdateParsedField = (id, field, value) => {
    setParsedRecords((prev) => prev.map((r) => (r.id !== id ? r : { ...r, [field]: value })))
  }
  const handleToggleSelectParsed = (id) => {
    setParsedRecords((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)))
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

  const parsedRecordsWithDups = useMemo(
    () => detectCollectionDuplicates(parsedRecords, collections),
    [parsedRecords, collections]
  )

  const selectedParsedRecords = useMemo(() => parsedRecordsWithDups.filter((r) => r.selected), [parsedRecordsWithDups])

  const parsedTotals = useMemo(() => computeParsedTotals(selectedParsedRecords), [selectedParsedRecords])

  const handleSaveVerifiedRecords = async () => {
    if (selectedParsedRecords.length === 0) {
      alert('Please select at least one record to save.')
      return
    }
    const emptyRow = selectedParsedRecords.find((r) => !r.individual_name || !String(r.individual_name).trim())
    if (emptyRow) {
      alert(`Row #${emptyRow.row_index || 1} has an empty Individual Name. Please fill it before saving.`)
      return
    }
    const dupCount = selectedParsedRecords.filter((r) => r.isDbDup).length
    if (dupCount > 0 && !window.confirm(`⚠️ ${dupCount} selected record(s) already exist in DB. Proceed?`)) return

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

  return {
    excelFile, isReadingExcel, excelStatusMsg, parsedRecords, isSavingBulk, dragActive, setDragActive,
    fileInputRef, processUploadedExcel, handleUpdateParsedField, handleToggleSelectParsed,
    handleSelectAllParsed, handleRemoveParsedRow, handleClearExcelSheet, parsedRecordsWithDups,
    selectedParsedRecords, parsedTotals, handleSaveVerifiedRecords
  }
}
