import { useState, useRef, useMemo } from 'react'
import { parseExcelInvoiceSheet } from '../excelInvoiceHelper'
import { detectInvoiceDuplicates, saveInvoicesBatchApi } from './invoicesExcelHelper'

export function useInvoicesExcel({ allInvoices, locations, loadAllInvoices, loadLocations }) {
  const [excelCountry, setExcelCountry] = useState('IN')
  const [excelFile, setExcelFile] = useState(null)
  const [parsedOrders, setParsedOrders] = useState([])
  const [isReadingExcel, setIsReadingExcel] = useState(false)
  const [excelStatusMsg, setExcelStatusMsg] = useState(null)
  const [isSavingBatch, setIsSavingBatch] = useState(false)
  const [showBatchDuplicateModal, setShowBatchDuplicateModal] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const processUploadedFile = async (file) => {
    if (!file) return
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      setExcelStatusMsg({ type: 'error', text: 'Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.' })
      return
    }
    setIsReadingExcel(true)
    setExcelStatusMsg(null)
    try {
      const orders = await parseExcelInvoiceSheet(file, excelCountry, locations)
      if (!orders || orders.length === 0) {
        setExcelStatusMsg({ type: 'error', text: `No invoice order rows could be identified in "${file.name}".` })
        setParsedOrders([])
        setExcelFile(null)
      } else {
        setParsedOrders(orders)
        setExcelFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
        setExcelStatusMsg({ type: 'success', text: `🎉 Identified ${orders.length} order entries from "${file.name}".` })
      }
    } catch (err) {
      console.error('Error parsing Excel sheet:', err)
      setExcelStatusMsg({ type: 'error', text: 'Failed to read Excel file: ' + (err.message || 'Unknown format error') })
    } finally {
      setIsReadingExcel(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const ordersWithDups = useMemo(
    () => detectInvoiceDuplicates(parsedOrders, allInvoices),
    [parsedOrders, allInvoices]
  )

  const selectedOrders = useMemo(() => ordersWithDups.filter((o) => o.selected), [ordersWithDups])
  const selectedCount = selectedOrders.length
  const totalBooks = useMemo(() => selectedOrders.reduce((sum, o) => sum + (Number(o.books_sent) || 0), 0), [selectedOrders])
  const totalAmount = useMemo(() => selectedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0), [selectedOrders])
  const selectedDups = useMemo(() => selectedOrders.filter((o) => o.dbDuplicate), [selectedOrders])
  const allSelected = ordersWithDups.length > 0 && ordersWithDups.every((o) => o.selected)

  const handleUpdateField = (id, field, value) => {
    setParsedOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const updated = { ...o, [field]: value }
        if (field === 'location_title') {
          const cleanLower = String(value).trim().toLowerCase()
          const matched = locations.find((l) => l.title && l.title.trim().toLowerCase() === cleanLower)
          updated.location_id = matched ? String(matched.id) : ''
          updated.is_matched_location = Boolean(matched)
          if (matched && !updated.city) updated.city = matched.city || ''
          if (matched && !updated.state) updated.state = matched.state || ''
        }
        return updated
      })
    )
  }

  const handleToggleSelect = (id) => setParsedOrders((prev) => prev.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o)))
  const handleSelectAll = (selectVal) => setParsedOrders((prev) => prev.map((o) => ({ ...o, selected: selectVal })))
  const handleTogglePayment = (id) => setParsedOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_received: !o.payment_received } : o)))
  const handleRemoveRow = (id) => setParsedOrders((prev) => prev.filter((o) => o.id !== id))
  const handleClearSheet = () => { setParsedOrders([]); setExcelFile(null); setExcelStatusMsg(null) }

  const handleSaveOrdersToDb = async (forceSave = false) => {
    if (selectedOrders.length === 0) return alert('Please select at least one order to save.')
    const missingLoc = selectedOrders.find((o) => !o.location_title || !String(o.location_title).trim())
    if (missingLoc) return alert(`Row #${missingLoc.row_index || 1} has an empty Location.`)
    if (!forceSave && selectedDups.length > 0) return setShowBatchDuplicateModal(true)

    setIsSavingBatch(true)
    try {
      const data = await saveInvoicesBatchApi(selectedOrders, excelCountry)
      if (data && data.success) {
        if (loadAllInvoices) await loadAllInvoices()
        if (loadLocations) await loadLocations()
        setShowBatchDuplicateModal(false)
        setParsedOrders([])
        setExcelFile(null)
        alert(`🎉 Successfully saved ${data.count} invoice orders to the database!`)
      } else {
        alert(data.message || 'Failed to save batch invoices.')
      }
    } catch (err) {
      alert('Error saving invoices: ' + err.message)
    } finally {
      setIsSavingBatch(false)
    }
  }

  const handleSaveOnlyClean = async () => {
    const cleanOnly = selectedOrders.filter((o) => !o.dbDuplicate)
    if (cleanOnly.length === 0) return alert('No clean orders left to save.')
    setShowBatchDuplicateModal(false)
    setIsSavingBatch(true)
    try {
      const data = await saveInvoicesBatchApi(cleanOnly, excelCountry)
      if (data && data.success) {
        if (loadAllInvoices) await loadAllInvoices()
        if (loadLocations) await loadLocations()
        const cleanIds = new Set(cleanOnly.map((o) => o.id))
        setParsedOrders((prev) => prev.filter((o) => !cleanIds.has(o.id)))
        alert(`🎉 Successfully saved ${data.count} non-duplicate invoice orders to the database!`)
      } else {
        alert(data.message || 'Failed to save clean invoices.')
      }
    } catch (err) {
      alert('Error saving clean invoices: ' + err.message)
    } finally {
      setIsSavingBatch(false)
    }
  }

  return {
    excelCountry, setExcelCountry, excelFile, parsedOrders, isReadingExcel, excelStatusMsg, isSavingBatch,
    showBatchDuplicateModal, setShowBatchDuplicateModal, dragActive, setDragActive, fileInputRef,
    processUploadedFile, ordersWithDups, selectedOrders, selectedCount, totalBooks, totalAmount,
    selectedDups, allSelected, handleUpdateField, handleToggleSelect, handleSelectAll,
    handleTogglePayment, handleRemoveRow, handleClearSheet, handleSaveOrdersToDb, handleSaveOnlyClean
  }
}
