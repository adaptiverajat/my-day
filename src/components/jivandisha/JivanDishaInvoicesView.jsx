import React, { useState, useRef, useMemo } from 'react'
import { getPdfViewUrl, API_BASE_URL, uploadInvoicePdf } from './jivandishaHelpers'
import { parseExcelInvoiceSheet, generateSampleExcelTemplate } from './excelInvoiceHelper'

export default function JivanDishaInvoicesView({
  mainTab,
  allInvoices = [],
  locations = [],
  loadAllInvoices,
  loadLocations,
  invoiceSearchTerm,
  setInvoiceSearchTerm,
  invoiceFilterCountry,
  setInvoiceFilterCountry,
  invoiceFilterPayment,
  setInvoiceFilterPayment,
  invoiceSortBy,
  setInvoiceSortBy,
  filteredAllInvoices = [],
  loadingAllInvoices,
  handleToggleInvoicePaymentInList,
  handleDeleteInvoiceFromList
}) {
  // Summary Totals for Current Invoices List View (Book Count & Total Amount/Collection)
  const invoiceListTotals = useMemo(() => {
    return (filteredAllInvoices || []).reduce(
      (acc, inv) => {
        acc.books += Number(inv.books_sent || 0)
        const amt = Number(inv.amount || 0)
        acc.amount += amt
        if (inv.payment_received) {
          acc.paidAmount += amt
          acc.paidCount += 1
        } else {
          acc.pendingAmount += amt
          acc.pendingCount += 1
        }
        return acc
      },
      { books: 0, amount: 0, paidAmount: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 }
    )
  }, [filteredAllInvoices])

  // Excel Sheet Reading & Verification State
  const [excelCountry, setExcelCountry] = useState('IN')
  const [excelFile, setExcelFile] = useState(null)
  const [parsedOrders, setParsedOrders] = useState([])
  const [isReadingExcel, setIsReadingExcel] = useState(false)
  const [excelStatusMsg, setExcelStatusMsg] = useState(null)
  const [isSavingBatch, setIsSavingBatch] = useState(false)
  const [showBatchDuplicateModal, setShowBatchDuplicateModal] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Merge Duplicate Invoices State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([])
  const [showInvoiceMergeModal, setShowInvoiceMergeModal] = useState(false)
  const [primaryInvoiceId, setPrimaryInvoiceId] = useState(null)
  const [isMergingInvoices, setIsMergingInvoices] = useState(false)
  const [mergeInvoiceForm, setMergeInvoiceForm] = useState({
    location_id: '',
    invoice_number: '',
    invoice_date: '',
    books_sent: 0,
    amount: '',
    payment_received: false,
    notes: '',
    pdf_url: '',
    pdf_name: ''
  })

  // Edit Invoice State & Handlers
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [editInvoiceForm, setEditInvoiceForm] = useState({
    location_id: '',
    invoice_number: '',
    invoice_date: '',
    books_sent: 0,
    amount: '',
    payment_received: false,
    notes: '',
    pdf_url: '',
    pdf_name: ''
  })
  const [isSavingEditInvoice, setIsSavingEditInvoice] = useState(false)
  const [isUploadingEditPdf, setIsUploadingEditPdf] = useState(false)
  const editPdfInputRef = useRef(null)

  const handleOpenEditInvoice = (inv) => {
    setEditingInvoice(inv)
    setEditInvoiceForm({
      location_id: inv.location_id ? String(inv.location_id) : '',
      invoice_number: inv.invoice_number || '',
      invoice_date: inv.invoice_date || '',
      books_sent: inv.books_sent || 0,
      amount: inv.amount !== null && inv.amount !== undefined ? String(inv.amount) : '',
      payment_received: Boolean(inv.payment_received),
      notes: inv.notes || '',
      pdf_url: inv.pdf_url || '',
      pdf_name: inv.pdf_name || ''
    })
  }

  const handleCloseEditInvoice = () => {
    setEditingInvoice(null)
  }

  const handleEditPdfUpload = async (file) => {
    if (!file) return
    setIsUploadingEditPdf(true)
    try {
      const loc = locations.find((l) => String(l.id) === String(editInvoiceForm.location_id))
      const country = loc?.country || 'IN'
      const res = await uploadInvoicePdf(file, country)
      if (res && res.success) {
        setEditInvoiceForm((prev) => ({
          ...prev,
          pdf_url: res.url,
          pdf_name: res.name || file.name
        }))
      }
    } catch (err) {
      console.error('Error uploading invoice PDF:', err)
      alert('PDF upload failed: ' + err.message)
    } finally {
      setIsUploadingEditPdf(false)
    }
  }

  const handleRemoveEditPdf = () => {
    setEditInvoiceForm((prev) => ({
      ...prev,
      pdf_url: '',
      pdf_name: ''
    }))
  }

  const handleSaveEditInvoice = async (e) => {
    if (e) e.preventDefault()
    if (!editingInvoice) return

    setIsSavingEditInvoice(true)
    try {
      const payload = {
        location_id: editInvoiceForm.location_id ? parseInt(editInvoiceForm.location_id, 10) : null,
        invoice_number: editInvoiceForm.invoice_number.trim(),
        invoice_date: editInvoiceForm.invoice_date || new Date().toISOString().slice(0, 10),
        books_sent: Number(editInvoiceForm.books_sent) || 0,
        amount:
          editInvoiceForm.amount !== '' && !isNaN(parseFloat(editInvoiceForm.amount))
            ? parseFloat(editInvoiceForm.amount)
            : null,
        payment_received: Boolean(editInvoiceForm.payment_received),
        notes: editInvoiceForm.notes,
        pdf_url: editInvoiceForm.pdf_url,
        pdf_name: editInvoiceForm.pdf_name
      }

      const res = await fetch(`${API_BASE_URL}/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (loadAllInvoices) await loadAllInvoices()
        if (loadLocations) await loadLocations()

        setEditingInvoice(null)
        alert(`🎉 Invoice #${payload.invoice_number || editingInvoice.id} updated successfully!`)
      } else {
        alert(data.message || 'Failed to update invoice.')
      }
    } catch (err) {
      console.error('Error saving invoice:', err)
      alert('Error saving invoice: ' + err.message)
    } finally {
      setIsSavingEditInvoice(false)
    }
  }

  // Toggle selection for merging invoices (maximum 2 at a time)
  const handleToggleSelectInvoice = (id) => {
    setSelectedInvoiceIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 2) {
        // If 2 are already selected, replace the second one
        return [prev[0], id]
      }
      return [...prev, id]
    })
  }

  // Get the 2 invoice objects selected for merge
  const selectedInvoicesForMerge = useMemo(() => {
    return selectedInvoiceIds
      .map((id) => (allInvoices || []).find((inv) => inv.id === id))
      .filter(Boolean)
  }, [selectedInvoiceIds, allInvoices])

  const handleOpenInvoiceMergeModal = () => {
    if (selectedInvoicesForMerge.length !== 2) {
      alert('Please select exactly 2 invoices to merge.')
      return
    }
    const [invA, invB] = selectedInvoicesForMerge
    // Default primary to the first selected invoice
    setPrimaryInvoiceId(invA.id)
    setMergeInvoiceForm({
      location_id: invA.location_id || invB.location_id || '',
      invoice_number: invA.invoice_number || invB.invoice_number || '',
      invoice_date: invA.invoice_date || invB.invoice_date || '',
      books_sent: (Number(invA.books_sent) || 0) + (Number(invB.books_sent) || 0),
      amount:
        invA.amount !== null && invA.amount !== undefined && invB.amount !== null && invB.amount !== undefined
          ? (Number(invA.amount) + Number(invB.amount)).toFixed(2)
          : invA.amount !== null && invA.amount !== undefined
          ? String(invA.amount)
          : invB.amount !== null && invB.amount !== undefined
          ? String(invB.amount)
          : '',
      payment_received: Boolean(invA.payment_received || invB.payment_received),
      notes: [invA.notes, invB.notes].filter(Boolean).join(' | '),
      pdf_url: invA.pdf_url || invB.pdf_url || '',
      pdf_name: invA.pdf_name || invB.pdf_name || ''
    })
    setShowInvoiceMergeModal(true)
  }

  const handleSwitchPrimaryInvoice = (newPrimaryId) => {
    setPrimaryInvoiceId(newPrimaryId)
    const newPrimary = selectedInvoicesForMerge.find((inv) => inv.id === newPrimaryId)
    const newDup = selectedInvoicesForMerge.find((inv) => inv.id !== newPrimaryId)
    if (newPrimary && newDup) {
      setMergeInvoiceForm((prev) => ({
        ...prev,
        location_id: newPrimary.location_id || newDup.location_id || prev.location_id,
        invoice_number: prev.invoice_number || newPrimary.invoice_number || newDup.invoice_number || '',
        invoice_date: prev.invoice_date || newPrimary.invoice_date || newDup.invoice_date || ''
      }))
    }
  }

  const handleConfirmMergeInvoices = async () => {
    if (!primaryInvoiceId) return
    const dupInv = selectedInvoicesForMerge.find((inv) => inv.id !== primaryInvoiceId)
    if (!dupInv) return

    setIsMergingInvoices(true)
    try {
      const payload = {
        primary_id: primaryInvoiceId,
        duplicate_id: dupInv.id,
        merged_fields: {
          location_id: mergeInvoiceForm.location_id ? parseInt(mergeInvoiceForm.location_id, 10) : null,
          invoice_number: mergeInvoiceForm.invoice_number || '',
          invoice_date: mergeInvoiceForm.invoice_date || '',
          books_sent: Number(mergeInvoiceForm.books_sent) || 0,
          amount:
            mergeInvoiceForm.amount !== '' && !isNaN(parseFloat(mergeInvoiceForm.amount))
              ? parseFloat(mergeInvoiceForm.amount)
              : null,
          payment_received: Boolean(mergeInvoiceForm.payment_received),
          notes: mergeInvoiceForm.notes || '',
          pdf_url: mergeInvoiceForm.pdf_url || '',
          pdf_name: mergeInvoiceForm.pdf_name || ''
        }
      }

      const res = await fetch(`${API_BASE_URL}/invoices/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (loadAllInvoices) await loadAllInvoices()
        if (loadLocations) await loadLocations()

        setShowInvoiceMergeModal(false)
        setSelectedInvoiceIds([])
        alert(
          `🎉 Invoices merged successfully into single record #${primaryInvoiceId}! Duplicate invoice #${dupInv.invoice_number || dupInv.id} was permanently removed from the database.`
        )
      } else {
        alert(data.message || 'Failed to merge invoices.')
      }
    } catch (err) {
      console.error('Error merging invoices:', err)
      alert('Error merging invoices: ' + err.message)
    } finally {
      setIsMergingInvoices(false)
    }
  }

  const scrollToExtractor = () => {
    const el = document.getElementById('add-invoice-card')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handle Excel/CSV file selection and parsing
  const processUploadedFile = async (file) => {
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
      const orders = await parseExcelInvoiceSheet(file, excelCountry, locations)
      if (!orders || orders.length === 0) {
        setExcelStatusMsg({
          type: 'error',
          text: `No invoice order rows could be identified in "${file.name}". Please check the column headers or download the sample template.`
        })
        setParsedOrders([])
        setExcelFile(null)
      } else {
        setParsedOrders(orders)
        setExcelFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB'
        })
        setExcelStatusMsg({
          type: 'success',
          text: `🎉 Identified ${orders.length} order entries from "${file.name}". Please verify the entries below before saving to the database.`
        })
        setTimeout(() => scrollToExtractor(), 100)
      }
    } catch (err) {
      console.error('Error parsing Excel sheet:', err)
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
    if (file) processUploadedFile(file)
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
    if (file) processUploadedFile(file)
  }

  // Cross-reference parsed orders against DB for duplicates (same date & same price)
  const ordersWithDups = useMemo(() => {
    return parsedOrders.map((order, idx) => {
      const oDate = order.invoice_date ? String(order.invoice_date).slice(0, 10).trim() : ''
      const oAmt = parseFloat(order.amount)

      // 1. Check against DB invoices
      let dbDup = null
      if (oDate && !isNaN(oAmt) && oAmt > 0) {
        dbDup = (allInvoices || []).find((inv) => {
          const invDate = inv.invoice_date ? String(inv.invoice_date).slice(0, 10).trim() : ''
          const invAmt = Number(inv.amount)
          return invDate && invDate === oDate && !isNaN(invAmt) && Math.abs(invAmt - oAmt) < 0.01
        })
      }

      // 2. Check against other rows in the same sheet
      let sheetDup = false
      if (oDate && !isNaN(oAmt) && oAmt > 0) {
        sheetDup = parsedOrders.some((other, oIdx) => {
          if (oIdx === idx) return false
          const otherDate = other.invoice_date ? String(other.invoice_date).slice(0, 10).trim() : ''
          const otherAmt = parseFloat(other.amount)
          return otherDate && otherDate === oDate && !isNaN(otherAmt) && Math.abs(otherAmt - oAmt) < 0.01
        })
      }

      return {
        ...order,
        dbDuplicate: dbDup,
        sheetDuplicate: sheetDup
      }
    })
  }, [parsedOrders, allInvoices])

  // Summary counts
  const selectedOrders = useMemo(() => ordersWithDups.filter((o) => o.selected), [ordersWithDups])
  const selectedCount = selectedOrders.length
  const totalBooks = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + (Number(o.books_sent) || 0), 0),
    [selectedOrders]
  )
  const totalAmount = useMemo(
    () => selectedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
    [selectedOrders]
  )
  const selectedDups = useMemo(() => selectedOrders.filter((o) => o.dbDuplicate), [selectedOrders])
  const allSelected = ordersWithDups.length > 0 && ordersWithDups.every((o) => o.selected)

  // Field change in verification table
  const handleUpdateField = (id, field, value) => {
    setParsedOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const updated = { ...o, [field]: value }

        // If location title changed, re-check match against existing locations
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

  // Toggle selection
  const handleToggleSelect = (id) => {
    setParsedOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o))
    )
  }

  const handleSelectAll = (selectVal) => {
    setParsedOrders((prev) => prev.map((o) => ({ ...o, selected: selectVal })))
  }

  // Toggle payment
  const handleTogglePayment = (id) => {
    setParsedOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, payment_received: !o.payment_received } : o))
    )
  }

  // Remove row
  const handleRemoveRow = (id) => {
    setParsedOrders((prev) => prev.filter((o) => o.id !== id))
  }

  // Clear sheet
  const handleClearSheet = () => {
    setParsedOrders([])
    setExcelFile(null)
    setExcelStatusMsg(null)
  }

  // Save verified orders to database
  const handleSaveOrdersToDb = async (forceSave = false) => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to save.')
      return
    }

    // Front-end validation: check that each selected row has a non-empty location
    const missingLoc = selectedOrders.find(
      (o) => !o.location_title || !String(o.location_title).trim()
    )
    if (missingLoc) {
      alert(
        `Row #${missingLoc.row_index || 1} has an empty Location. Please enter a Location name before saving.`
      )
      return
    }

    // Check if any selected orders have duplicates in the database
    if (!forceSave && selectedDups.length > 0) {
      setShowBatchDuplicateModal(true)
      return
    }

    setIsSavingBatch(true)
    try {
      const payload = {
        invoices: selectedOrders.map((o) => ({
          location_id: o.location_id || null,
          location_title: String(o.location_title || '').trim(),
          country: o.country || excelCountry,
          city: o.city || '',
          state: o.state || '',
          address: o.city || o.location_title,
          invoice_number: o.invoice_number || '',
          invoice_date: o.invoice_date,
          books_sent: Number(o.books_sent) || 0,
          amount: o.amount !== null && o.amount !== undefined && !isNaN(parseFloat(o.amount)) ? parseFloat(o.amount) : null,
          payment_received: Boolean(o.payment_received),
          decision_maker_name: o.decision_maker_name || '',
          decision_maker_phone: o.decision_maker_phone || '',
          notes: o.notes || ''
        }))
      }

      const res = await fetch(`${API_BASE_URL}/invoices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (!data.count || data.count === 0) {
          alert('Warning: No invoice records could be saved to the database. Please verify your data and retry.')
          return
        }

        if (loadAllInvoices) await loadAllInvoices()
        if (loadLocations) await loadLocations()

        setExcelStatusMsg({
          type: 'success',
          text: `🎉 Successfully saved ${data.count} invoice orders to the database!`
        })
        setShowBatchDuplicateModal(false)
        setParsedOrders([])
        setExcelFile(null)
        alert(`🎉 Successfully saved ${data.count} invoice orders to the database!`)
      } else {
        alert(data.message || 'Failed to save batch invoices.')
      }
    } catch (err) {
      console.error('Error saving batch invoices:', err)
      alert('Error saving invoices: ' + err.message)
    } finally {
      setIsSavingBatch(false)
    }
  }

  // Save only clean (non-duplicate) orders
  const handleSaveOnlyClean = async () => {
    const cleanOnly = selectedOrders.filter((o) => !o.dbDuplicate)
    if (cleanOnly.length === 0) {
      alert('No clean orders left to save.')
      return
    }

    // Front-end validation: check location
    const missingLoc = cleanOnly.find(
      (o) => !o.location_title || !String(o.location_title).trim()
    )
    if (missingLoc) {
      alert(
        `Row #${missingLoc.row_index || 1} has an empty Location. Please enter a Location name before saving.`
      )
      return
    }

    setShowBatchDuplicateModal(false)
    setIsSavingBatch(true)
    try {
      const payload = {
        invoices: cleanOnly.map((o) => ({
          location_id: o.location_id || null,
          location_title: String(o.location_title || '').trim(),
          country: o.country || excelCountry,
          city: o.city || '',
          state: o.state || '',
          address: o.city || o.location_title,
          invoice_number: o.invoice_number || '',
          invoice_date: o.invoice_date,
          books_sent: Number(o.books_sent) || 0,
          amount: o.amount !== null && o.amount !== undefined && !isNaN(parseFloat(o.amount)) ? parseFloat(o.amount) : null,
          payment_received: Boolean(o.payment_received),
          decision_maker_name: o.decision_maker_name || '',
          decision_maker_phone: o.decision_maker_phone || '',
          notes: o.notes || ''
        }))
      }

      const res = await fetch(`${API_BASE_URL}/invoices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        if (!data.count || data.count === 0) {
          alert('Warning: No invoice records could be saved to the database. Please verify your data and retry.')
          return
        }

        if (loadAllInvoices) await loadAllInvoices()
        if (loadLocations) await loadLocations()

        setExcelStatusMsg({
          type: 'success',
          text: `🎉 Successfully saved ${data.count} non-duplicate invoice orders to the database!`
        })
        // Remove saved rows from verification list
        const cleanIds = new Set(cleanOnly.map((o) => o.id))
        setParsedOrders((prev) => prev.filter((o) => !cleanIds.has(o.id)))
        alert(`🎉 Successfully saved ${data.count} non-duplicate invoice orders to the database!`)
      } else {
        alert(data.message || 'Failed to save clean invoices.')
      }
    } catch (err) {
      console.error('Error saving clean invoices:', err)
      alert('Error saving invoices: ' + err.message)
    } finally {
      setIsSavingBatch(false)
    }
  }

  return (
    <div
      className="jd-invoices-view"
      style={{ display: mainTab === 'invoices' ? 'flex' : 'none' }}
    >
      {/* Search & Filters Toolbar */}
      <div className="jd-view-toolbar">
        <div className="jd-toolbar-search-wrap">
          <input
            type="text"
            className="jd-toolbar-search-input"
            placeholder="🔍 Search invoices by #, location, city, contact, remarks..."
            value={invoiceSearchTerm}
            onChange={(e) => setInvoiceSearchTerm(e.target.value)}
          />
        </div>

        <div className="jd-toolbar-filters">
          <select
            className="jd-toolbar-select"
            value={invoiceFilterCountry}
            onChange={(e) => setInvoiceFilterCountry(e.target.value)}
          >
            <option value="ALL">All Countries</option>
            <option value="IN">🇮🇳 India</option>
            <option value="US">🇺🇸 USA</option>
          </select>

          <select
            className="jd-toolbar-select"
            value={invoiceFilterPayment}
            onChange={(e) => setInvoiceFilterPayment(e.target.value)}
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid Only</option>
            <option value="PENDING">Pending Only</option>
          </select>

          <select
            className="jd-toolbar-select"
            value={invoiceSortBy}
            onChange={(e) => setInvoiceSortBy(e.target.value)}
          >
            <option value="DATE_DESC">Date (Newest First)</option>
            <option value="DATE_ASC">Date (Oldest First)</option>
            <option value="BOOKS_DESC">Books (Highest)</option>
            <option value="AMOUNT_DESC">Amount (Highest)</option>
            <option value="TITLE_ASC">Location (A-Z)</option>
          </select>

          <button
            type="button"
            className="jd-btn primary"
            onClick={scrollToExtractor}
            style={{ fontSize: '0.84rem', padding: '9px 16px' }}
          >
            📊 Import Excel Invoices
          </button>

          {/* Merge Duplicates Action Pill */}
          {selectedInvoiceIds.length > 0 && (
            <div className="jd-merge-toolbar-pill">
              <span className="jd-merge-count-badge">
                {selectedInvoiceIds.length}/2 Selected
              </span>
              {selectedInvoiceIds.length === 2 ? (
                <button
                  type="button"
                  className="jd-btn primary jd-btn-merge-action"
                  onClick={handleOpenInvoiceMergeModal}
                  title="Merge the 2 selected invoices into a single record"
                >
                  🔀 Merge 2 Invoices
                </button>
              ) : (
                <span className="jd-merge-instruction">
                  Select 1 more duplicate invoice
                </span>
              )}
              <button
                type="button"
                className="jd-btn"
                onClick={() => setSelectedInvoiceIds([])}
                style={{ fontSize: '0.74rem', padding: '3px 7px' }}
                title="Cancel selection"
              >
                ✕ Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="jd-table-card">
        {/* Totals of Book Count & Collection/Invoice Amount above Table */}
        <div className="jd-list-totals-banner">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📊 Invoices Totals:
          </span>

          <div className="jd-totals-chip count" title="Total Books Sent across listed invoices">
            <span className="chip-label">Total Books</span>
            <span className="chip-val">📦 {invoiceListTotals.books.toLocaleString()}</span>
          </div>

          <div className="jd-totals-chip collection" title="Total Invoices / Collection Amount">
            <span className="chip-label">Total Collection / Invoices</span>
            <span className="chip-val">
              💰 ₹{invoiceListTotals.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="jd-totals-chip" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }} title="Total Amount Received / Paid">
            <span className="chip-label" style={{ color: '#166534' }}>Paid Collection</span>
            <span className="chip-val" style={{ color: '#15803d' }}>
              ✅ ₹{invoiceListTotals.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <small style={{ fontSize: '0.74rem', marginLeft: '5px', fontWeight: 500, color: '#166534' }}>
                ({invoiceListTotals.paidCount} paid)
              </small>
            </span>
          </div>

          <div className="jd-totals-chip" style={{ borderColor: '#fde68a', background: '#fffbeb' }} title="Total Amount Pending">
            <span className="chip-label" style={{ color: '#92400e' }}>Pending Collection</span>
            <span className="chip-val" style={{ color: '#b45309' }}>
              ⏳ ₹{invoiceListTotals.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <small style={{ fontSize: '0.74rem', marginLeft: '5px', fontWeight: 500, color: '#92400e' }}>
                ({invoiceListTotals.pendingCount} pending)
              </small>
            </span>
          </div>

          {(invoiceSearchTerm || invoiceFilterCountry !== 'ALL' || invoiceFilterPayment !== 'ALL') && (
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
              (Filtered: showing {filteredAllInvoices.length} of {allInvoices.length} invoices)
            </span>
          )}
        </div>

        <div className="jd-table-scroll-wrap">
          <table className="jd-tabular-table">
            <thead>
              <tr>
                <th style={{ width: '44px', textAlign: 'center' }}>
                  {selectedInvoiceIds.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceIds([])}
                      title="Clear selection"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Merge</span>
                  )}
                </th>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Location / Center</th>
                <th>Status</th>
                <th>Books Sent</th>
                <th>Amount</th>
                <th>Decision Maker</th>
                <th>Remarks</th>
                <th>PDF</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingAllInvoices ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    🔄 Loading invoices...
                  </td>
                </tr>
              ) : filteredAllInvoices.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '42px', color: '#64748b' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📂</div>
                    <div style={{ fontWeight: 600, color: '#334155' }}>No invoices found matching criteria</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      Try adjusting your filters or import invoices from an Excel sheet below.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAllInvoices.map((inv) => {
                  const currencySymbol = inv.location_country === 'US' ? '$' : '₹'
                  const isSelected = selectedInvoiceIds.includes(inv.id)
                  return (
                    <tr
                      key={inv.id}
                      className={isSelected ? 'jd-row-selected' : ''}
                    >
                      {/* Merge selection checkbox */}
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectInvoice(inv.id)}
                          title={
                            isSelected
                              ? 'Selected for merge (click to uncheck)'
                              : selectedInvoiceIds.length >= 2
                              ? '2 already selected. Clicking replaces the second.'
                              : 'Select to merge duplicates'
                          }
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {inv.invoice_number ? `#${inv.invoice_number}` : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#475569' }}>
                        {inv.invoice_date || '—'}
                      </td>
                      <td>
                        <span className="jd-table-loc-title">
                          {inv.location_country === 'US' ? '🇺🇸' : '🇮🇳'} {inv.location_title}
                        </span>
                        {(inv.location_city || inv.location_state) && (
                          <span className="jd-table-sub">
                            {[inv.location_city, inv.location_state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`jd-status-pill ${inv.payment_received ? 'paid' : 'pending'}`}
                          onClick={() => handleToggleInvoicePaymentInList(inv)}
                          title="Click to toggle payment status"
                        >
                          {inv.payment_received ? '✅ Paid' : '⏳ Pending'}
                        </button>
                      </td>
                      <td>
                        <span className="jd-books-pill">📦 {inv.books_sent || 0}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {inv.amount !== null && inv.amount !== undefined
                          ? `${currencySymbol}${Number(inv.amount).toFixed(2)}`
                          : '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{inv.decision_maker_name || '—'}</div>
                        {inv.decision_maker_phone && (
                          <span className="jd-table-sub">📞 {inv.decision_maker_phone}</span>
                        )}
                      </td>
                      <td>
                        <div className="jd-table-remarks">{inv.notes || '—'}</div>
                      </td>
                      <td>
                        {inv.pdf_url ? (
                          <a
                            href={getPdfViewUrl(inv.pdf_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jd-table-pdf-link"
                            title="View retained invoice PDF"
                          >
                            📄 PDF
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="jd-loc-action-btn edit"
                            onClick={() => handleOpenEditInvoice(inv)}
                            title="Edit this invoice"
                            style={{ padding: '3px 8px', fontSize: '0.76rem', borderRadius: '4px' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="jd-loc-action-btn del"
                            onClick={() => handleDeleteInvoiceFromList(inv.id)}
                            title="Delete this invoice"
                            style={{ padding: '3px 6px', fontSize: '0.76rem' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                  TOTAL ({filteredAllInvoices.length} Invoices)
                </td>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>
                  📦 {invoiceListTotals.books.toLocaleString()}
                </td>
                <td style={{ fontWeight: 700, color: '#059669' }}>
                  ₹{invoiceListTotals.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Excel Sheet Reader & Multi-Order Verification View */}
      <div className="jd-excel-card" id="add-invoice-card">
        {/* Header */}
        <div className="jd-extractor-header">
          <div className="jd-extractor-title-area">
            <span className="jd-extractor-badge-icon" style={{ background: '#059669' }}>
              📊
            </span>
            <div style={{ textAlign: 'left' }}>
              <h3 className="jd-extractor-heading" style={{ textAlign: 'left' }}>
                Import Invoices from Excel Sheet
              </h3>
              <p className="jd-extractor-subheading" style={{ textAlign: 'left' }}>
                Read multiple invoice order values from an Excel (.xlsx, .xls) or CSV sheet. Verify and edit identified order entries on the UI before adding to the database.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="jd-extractor-country-pills">
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Default Country:</span>
              <button
                type="button"
                className={`jd-country-pill ${excelCountry === 'IN' ? 'active' : ''}`}
                onClick={() => setExcelCountry('IN')}
              >
                🇮🇳 India
              </button>
              <button
                type="button"
                className={`jd-country-pill ${excelCountry === 'US' ? 'active' : ''}`}
                onClick={() => setExcelCountry('US')}
              >
                🇺🇸 USA
              </button>
            </div>

            <button
              type="button"
              className="jd-btn"
              onClick={() => generateSampleExcelTemplate(excelCountry)}
              title="Download pre-formatted Excel template"
              style={{ fontSize: '0.78rem', padding: '5px 12px', background: '#ffffff' }}
            >
              📥 Download Sample Template (.xlsx)
            </button>
          </div>
        </div>

        {/* Status Message Banner */}
        {excelStatusMsg && (
          <div style={{ padding: '0 20px', marginTop: '12px' }}>
            <div className={`jd-parse-msg-banner ${excelStatusMsg.type}`}>
              {excelStatusMsg.type === 'success' && '✅ '}
              {excelStatusMsg.type === 'info' && 'ℹ️ '}
              {excelStatusMsg.type === 'error' && '⚠️ '}
              <span>{excelStatusMsg.text}</span>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* View 1: When no file is parsed yet -> Drag & Drop Upload Zone */}
        {parsedOrders.length === 0 ? (
          <div>
            <div
              className={`jd-excel-upload-zone ${dragActive ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <span className="jd-excel-upload-icon">{isReadingExcel ? '🔄' : '📊'}</span>
              <div className="jd-excel-upload-title">
                {isReadingExcel
                  ? 'Reading & identifying orders from Excel spreadsheet...'
                  : 'Click to Browse or Drag & Drop Excel Sheet Here'}
              </div>
              <div className="jd-excel-upload-subtitle">
                Upload your order entries spreadsheet. The system automatically reads multiple rows, parses dates, amounts, books, payment status, and matches existing locations.
              </div>
              <div className="jd-excel-upload-formats">
                📄 Accepts .xlsx, .xls, and .csv files with multiple rows
              </div>
            </div>

            <div className="jd-excel-columns-guide">
              <div>
                <strong>Supported Column Headers:</strong> The reader automatically recognizes fuzzy headers across languages and styles:
              </div>
              <div className="jd-excel-guide-pills">
                <span className="jd-excel-col-pill">Location / Center</span>
                <span className="jd-excel-col-pill">Invoice #</span>
                <span className="jd-excel-col-pill">Date</span>
                <span className="jd-excel-col-pill">Books Sent</span>
                <span className="jd-excel-col-pill">Amount</span>
                <span className="jd-excel-col-pill">Payment Status</span>
                <span className="jd-excel-col-pill">City</span>
                <span className="jd-excel-col-pill">State</span>
                <span className="jd-excel-col-pill">Country</span>
                <span className="jd-excel-col-pill">Contact Person</span>
                <span className="jd-excel-col-pill">Phone</span>
                <span className="jd-excel-col-pill">Notes / Remarks</span>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: When file IS parsed -> Multi-Order Verification View */
          <div>
            {/* Verification Summary Bar */}
            <div className="jd-excel-summary-bar">
              <div className="jd-excel-summary-left">
                <span className="jd-excel-file-badge">
                  📄 {excelFile?.name || 'Uploaded Sheet'} ({ordersWithDups.length} identified)
                </span>
                <span className="jd-excel-kpi-pill">
                  📦 {totalBooks} Books
                </span>
                <span className="jd-excel-kpi-pill">
                  💰 {excelCountry === 'US' ? '$' : '₹'}{totalAmount.toFixed(2)}
                </span>
                <span className="jd-excel-kpi-pill">
                  ✓ {selectedCount} of {ordersWithDups.length} Selected
                </span>
                {selectedDups.length > 0 && (
                  <span className="jd-excel-kpi-pill warn">
                    ⚠️ {selectedDups.length} Potential DB Duplicates
                  </span>
                )}
              </div>

              <div className="jd-excel-summary-actions">
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => handleSelectAll(!allSelected)}
                  style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                >
                  🔄 Upload Different File
                </button>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={handleClearSheet}
                  style={{ fontSize: '0.76rem', padding: '4px 10px', color: '#b91c1c' }}
                >
                  ✕ Discard Sheet
                </button>
              </div>
            </div>

            {/* Verification Interactive Table */}
            <div className="jd-verify-table-wrap">
              <table className="jd-verify-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        title="Select/Deselect all orders"
                      />
                    </th>
                    <th style={{ width: '32px' }}>#</th>
                    <th style={{ minWidth: '190px' }}>Location / Center</th>
                    <th style={{ width: '110px' }}>Invoice #</th>
                    <th style={{ width: '115px' }}>Date</th>
                    <th style={{ width: '85px' }}>Books</th>
                    <th style={{ width: '100px' }}>Amount</th>
                    <th style={{ width: '110px' }}>Payment</th>
                    <th style={{ minWidth: '140px' }}>City & State</th>
                    <th style={{ minWidth: '140px' }}>Contact</th>
                    <th style={{ minWidth: '150px' }}>Duplicate Check</th>
                    <th style={{ width: '40px', textAlign: 'center' }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersWithDups.map((order, idx) => {
                    const currency = order.country === 'US' ? '$' : '₹'
                    const hasDbDup = Boolean(order.dbDuplicate)

                    return (
                      <tr
                        key={order.id}
                        className={`${!order.selected ? 'unselected' : ''} ${hasDbDup ? 'has-dup' : ''}`}
                      >
                        {/* Checkbox */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(order.selected)}
                            onChange={() => handleToggleSelect(order.id)}
                          />
                        </td>

                        {/* Row # */}
                        <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>

                        {/* Location Title & Status */}
                        <td>
                          <input
                            type="text"
                            className="jd-verify-input"
                            value={order.location_title}
                            placeholder="Location Title"
                            onChange={(e) => handleUpdateField(order.id, 'location_title', e.target.value)}
                          />
                          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {order.is_matched_location ? (
                              <span className="jd-verify-badge matched">✓ Matched Location</span>
                            ) : (
                              <span className="jd-verify-badge new">➕ New Location</span>
                            )}
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {order.country === 'US' ? '🇺🇸' : '🇮🇳'}
                            </span>
                          </div>
                        </td>

                        {/* Invoice # */}
                        <td>
                          <input
                            type="text"
                            className="jd-verify-input"
                            placeholder="Inv #"
                            value={order.invoice_number}
                            onChange={(e) => handleUpdateField(order.id, 'invoice_number', e.target.value)}
                          />
                        </td>

                        {/* Date */}
                        <td>
                          <input
                            type="date"
                            className="jd-verify-input"
                            value={order.invoice_date}
                            onChange={(e) => handleUpdateField(order.id, 'invoice_date', e.target.value)}
                          />
                        </td>

                        {/* Books Sent */}
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="jd-verify-input"
                            value={order.books_sent}
                            onChange={(e) => handleUpdateField(order.id, 'books_sent', e.target.value)}
                          />
                        </td>

                        {/* Amount */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{currency}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="jd-verify-input"
                              placeholder="0.00"
                              value={order.amount !== null && order.amount !== undefined ? order.amount : ''}
                              onChange={(e) => handleUpdateField(order.id, 'amount', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* Payment Status Pill */}
                        <td>
                          <button
                            type="button"
                            className={`jd-status-pill ${order.payment_received ? 'paid' : 'pending'}`}
                            onClick={() => handleTogglePayment(order.id)}
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            title="Click to toggle Payment status"
                          >
                            {order.payment_received ? '✅ Paid' : '⏳ Pending'}
                          </button>
                        </td>

                        {/* City & State */}
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                              type="text"
                              className="jd-verify-input"
                              placeholder="City"
                              value={order.city}
                              onChange={(e) => handleUpdateField(order.id, 'city', e.target.value)}
                            />
                            <input
                              type="text"
                              className="jd-verify-input"
                              placeholder="State"
                              value={order.state}
                              onChange={(e) => handleUpdateField(order.id, 'state', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* Contact Name & Phone */}
                        <td>
                          <input
                            type="text"
                            className="jd-verify-input"
                            placeholder="Contact Person"
                            value={order.decision_maker_name}
                            onChange={(e) => handleUpdateField(order.id, 'decision_maker_name', e.target.value)}
                          />
                          {order.decision_maker_phone && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                              📞 {order.decision_maker_phone}
                            </span>
                          )}
                        </td>

                        {/* Duplicate Validation Status */}
                        <td>
                          {hasDbDup ? (
                            <span
                              className="jd-verify-badge dup"
                              title={`Matches DB Invoice #${order.dbDuplicate.invoice_number || 'N/A'} for ${order.dbDuplicate.location_title} on ${order.dbDuplicate.invoice_date}`}
                            >
                              ⚠️ In DB: #{order.dbDuplicate.invoice_number || 'N/A'} ({order.dbDuplicate.invoice_date})
                            </span>
                          ) : order.sheetDuplicate ? (
                            <span className="jd-verify-badge dup" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                              ⚠️ Duplicate in Sheet
                            </span>
                          ) : (
                            <span className="jd-verify-badge clean">✅ Clean</span>
                          )}
                        </td>

                        {/* Delete Row Action */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="jd-loc-action-btn del"
                            onClick={() => handleRemoveRow(order.id)}
                            title="Remove row from batch"
                            style={{ padding: '2px 5px', fontSize: '0.8rem' }}
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

            {/* Verification Actions Footer */}
            <div className="jd-verify-actions-footer">
              <div className="jd-verify-footer-left">
                <span>
                  Showing <strong>{ordersWithDups.length}</strong> identified orders (
                  <strong>{selectedCount}</strong> selected to save). Total books: <strong>{totalBooks}</strong> | Total amount: <strong>{excelCountry === 'US' ? '$' : '₹'}{totalAmount.toFixed(2)}</strong>.
                </span>
                {selectedDups.length > 0 && (
                  <div style={{ color: '#b45309', fontWeight: 600, fontSize: '0.78rem', marginTop: '3px' }}>
                    ⚠️ {selectedDups.length} selected orders match existing DB records with the same date & price. You will be prompted on save.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={handleClearSheet}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Clear All
                </button>

                <button
                  type="button"
                  className="jd-btn primary"
                  disabled={isSavingBatch || selectedCount === 0}
                  onClick={() => handleSaveOrdersToDb(false)}
                  style={{ padding: '8px 24px', fontSize: '0.86rem', background: '#059669', borderColor: '#047857' }}
                >
                  {isSavingBatch
                    ? '💾 Saving Orders to DB...'
                    : `💾 Save Verified Orders (${selectedCount}) to Database`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Duplicate Confirmation Modal */}
      {showBatchDuplicateModal && (
        <div className="jd-modal-overlay" onClick={() => setShowBatchDuplicateModal(false)}>
          <div
            className="jd-modal-card jd-duplicate-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '720px' }}
          >
            <div className="jd-modal-header" style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#92400e', fontWeight: 700 }}>
                    Duplicate Invoice Records Detected in Batch
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#b45309' }}>
                    {selectedDups.length} of the {selectedCount} selected orders match an existing invoice in the database with the same date and price.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="jd-modal-close"
                onClick={() => setShowBatchDuplicateModal(false)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="jd-modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                The following entries in your Excel sheet match existing invoices already in the system:
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #fde68a', borderRadius: '8px', background: '#fffdf5' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', color: '#92400e', textAlign: 'left' }}>
                      <th style={{ padding: '6px 10px' }}>Sheet Order</th>
                      <th style={{ padding: '6px 10px' }}>Date</th>
                      <th style={{ padding: '6px 10px' }}>Price</th>
                      <th style={{ padding: '6px 10px' }}>Existing DB Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDups.map((dup) => (
                      <tr key={dup.id} style={{ borderBottom: '1px solid #fef3c7' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>
                          #{dup.invoice_number || 'New'} - {dup.location_title}
                        </td>
                        <td style={{ padding: '6px 10px' }}>{dup.invoice_date}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: '#991b1b' }}>
                          {dup.country === 'US' ? '$' : '₹'}{parseFloat(dup.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '6px 10px', color: '#b45309' }}>
                          Invoice #{dup.dbDuplicate?.invoice_number || 'N/A'} for {dup.dbDuplicate?.location_title} ({dup.dbDuplicate?.location_country === 'US' ? '$' : '₹'}{Number(dup.dbDuplicate?.amount || 0).toFixed(2)})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="jd-duplicate-prompt-banner">
                <span style={{ fontSize: '1.1rem' }}>❓</span>
                <div>
                  <strong>Decision Required:</strong> Would you like to proceed and save all {selectedCount} orders including duplicates, save only the non-duplicate clean orders ({selectedCount - selectedDups.length}), or cancel to review?
                </div>
              </div>
            </div>

            <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="jd-btn"
                onClick={() => setShowBatchDuplicateModal(false)}
                style={{ padding: '7px 14px', fontSize: '0.82rem' }}
              >
                ✕ Cancel / Review Table
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedCount - selectedDups.length > 0 && (
                  <button
                    type="button"
                    className="jd-btn"
                    onClick={handleSaveOnlyClean}
                    disabled={isSavingBatch}
                    style={{ padding: '7px 14px', fontSize: '0.82rem', background: '#ffffff', borderColor: '#059669', color: '#059669', fontWeight: 600 }}
                  >
                    Save Only Clean ({selectedCount - selectedDups.length})
                  </button>
                )}

                <button
                  type="button"
                  className="jd-btn primary"
                  onClick={() => handleSaveOrdersToDb(true)}
                  disabled={isSavingBatch}
                  style={{ background: '#d97706', borderColor: '#b45309', padding: '7px 16px', fontSize: '0.82rem' }}
                >
                  {isSavingBatch ? 'Saving...' : `Proceed & Save All (${selectedCount})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge Duplicate Invoices Modal */}
      {showInvoiceMergeModal && selectedInvoicesForMerge.length === 2 && (() => {
        const [invA, invB] = selectedInvoicesForMerge
        const isA = primaryInvoiceId === invA.id
        const primary = isA ? invA : invB
        const duplicate = isA ? invB : invA

        return (
          <div className="jd-modal-overlay" onClick={() => setShowInvoiceMergeModal(false)}>
            <div
              className="jd-modal-card jd-merge-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{ maxWidth: '820px', width: '95%' }}
            >
              <div className="jd-modal-header" style={{ background: '#f5f3ff', borderBottom: '1px solid #ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🔀</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#5b21b6', fontWeight: 700 }}>
                      Merge 2 Duplicate Invoices
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#6d28d9' }}>
                      Choose which invoice to keep as primary. The duplicate invoice will be permanently removed from the database.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="jd-modal-close"
                  onClick={() => setShowInvoiceMergeModal(false)}
                  title="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="jd-merge-modal-content">
                {/* 1. Comparison & Primary Selection */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    1. Select the Primary Record to Keep (click to select):
                  </div>
                  <div className="jd-merge-records-grid">
                    {/* Record A */}
                    <div
                      className={`jd-merge-record-card ${isA ? 'is-primary' : 'is-duplicate'}`}
                      onClick={() => handleSwitchPrimaryInvoice(invA.id)}
                    >
                      <div className="jd-merge-record-header">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}>
                          <input
                            type="radio"
                            name="primary_invoice_choice"
                            checked={isA}
                            onChange={() => handleSwitchPrimaryInvoice(invA.id)}
                          />
                          Invoice #{invA.invoice_number || invA.id}
                        </label>
                        <span className={`jd-merge-role-badge ${isA ? 'keep' : 'delete'}`}>
                          {isA ? '✓ Primary (Keep)' : '⚠️ Duplicate (Delete)'}
                        </span>
                      </div>
                      <div className="jd-merge-card-details">
                        <div className="jd-merge-card-row">
                          <span>Location:</span>
                          <span>{invA.location_title || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Date:</span>
                          <span>{invA.invoice_date || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Books Sent:</span>
                          <span>📦 {invA.books_sent || 0}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Amount:</span>
                          <span>{invA.amount !== null ? `${invA.location_country === 'US' ? '$' : '₹'}${Number(invA.amount).toFixed(2)}` : '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Status:</span>
                          <span>{invA.payment_received ? '✅ Paid' : '⏳ Pending'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Contact:</span>
                          <span>{invA.decision_maker_name || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Remarks:</span>
                          <span>{invA.notes || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Record B */}
                    <div
                      className={`jd-merge-record-card ${!isA ? 'is-primary' : 'is-duplicate'}`}
                      onClick={() => handleSwitchPrimaryInvoice(invB.id)}
                    >
                      <div className="jd-merge-record-header">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem' }}>
                          <input
                            type="radio"
                            name="primary_invoice_choice"
                            checked={!isA}
                            onChange={() => handleSwitchPrimaryInvoice(invB.id)}
                          />
                          Invoice #{invB.invoice_number || invB.id}
                        </label>
                        <span className={`jd-merge-role-badge ${!isA ? 'keep' : 'delete'}`}>
                          {!isA ? '✓ Primary (Keep)' : '⚠️ Duplicate (Delete)'}
                        </span>
                      </div>
                      <div className="jd-merge-card-details">
                        <div className="jd-merge-card-row">
                          <span>Location:</span>
                          <span>{invB.location_title || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Date:</span>
                          <span>{invB.invoice_date || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Books Sent:</span>
                          <span>📦 {invB.books_sent || 0}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Amount:</span>
                          <span>{invB.amount !== null ? `${invB.location_country === 'US' ? '$' : '₹'}${Number(invB.amount).toFixed(2)}` : '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Status:</span>
                          <span>{invB.payment_received ? '✅ Paid' : '⏳ Pending'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Contact:</span>
                          <span>{invB.decision_maker_name || '—'}</span>
                        </div>
                        <div className="jd-merge-card-row">
                          <span>Remarks:</span>
                          <span>{invB.notes || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Consolidated Values Preview & Quick Controls */}
                <div className="jd-merge-preview-section">
                  <div className="jd-merge-preview-title">
                    <span>✏️</span>
                    <span>2. Review & Customize Consolidated Record Values:</span>
                  </div>

                  <div className="jd-merge-preview-grid">
                    {/* Invoice Number */}
                    <div className="jd-merge-field-group">
                      <label>Invoice Number</label>
                      <input
                        type="text"
                        className="jd-merge-field-input"
                        value={mergeInvoiceForm.invoice_number}
                        onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_number: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        {invA.invoice_number && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_number: invA.invoice_number })}
                          >
                            Use #{invA.invoice_number}
                          </button>
                        )}
                        {invB.invoice_number && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_number: invB.invoice_number })}
                          >
                            Use #{invB.invoice_number}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Invoice Date */}
                    <div className="jd-merge-field-group">
                      <label>Invoice Date</label>
                      <input
                        type="date"
                        className="jd-merge-field-input"
                        value={mergeInvoiceForm.invoice_date}
                        onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_date: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        {invA.invoice_date && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_date: invA.invoice_date })}
                          >
                            #{invA.invoice_number || 'A'}: {invA.invoice_date}
                          </button>
                        )}
                        {invB.invoice_date && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, invoice_date: invB.invoice_date })}
                          >
                            #{invB.invoice_number || 'B'}: {invB.invoice_date}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Books Sent */}
                    <div className="jd-merge-field-group">
                      <label>Books Sent</label>
                      <input
                        type="number"
                        min="0"
                        className="jd-merge-field-input"
                        value={mergeInvoiceForm.books_sent}
                        onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        <button
                          type="button"
                          className="jd-merge-quick-btn"
                          onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: (Number(invA.books_sent) || 0) + (Number(invB.books_sent) || 0) })}
                        >
                          Sum: {(Number(invA.books_sent) || 0) + (Number(invB.books_sent) || 0)}
                        </button>
                        <button
                          type="button"
                          className="jd-merge-quick-btn"
                          onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: Number(invA.books_sent) || 0 })}
                        >
                          Keep #{invA.invoice_number || 'A'} ({invA.books_sent || 0})
                        </button>
                        <button
                          type="button"
                          className="jd-merge-quick-btn"
                          onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, books_sent: Number(invB.books_sent) || 0 })}
                        >
                          Keep #{invB.invoice_number || 'B'} ({invB.books_sent || 0})
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="jd-merge-field-group">
                      <label>Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="jd-merge-field-input"
                        value={mergeInvoiceForm.amount}
                        onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: e.target.value })}
                      />
                      <div className="jd-merge-quick-options">
                        {invA.amount !== null && invB.amount !== null && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: (Number(invA.amount) + Number(invB.amount)).toFixed(2) })}
                          >
                            Sum: {(Number(invA.amount) + Number(invB.amount)).toFixed(2)}
                          </button>
                        )}
                        {invA.amount !== null && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: Number(invA.amount).toFixed(2) })}
                          >
                            #{invA.invoice_number || 'A'}: {Number(invA.amount).toFixed(2)}
                          </button>
                        )}
                        {invB.amount !== null && (
                          <button
                            type="button"
                            className="jd-merge-quick-btn"
                            onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, amount: Number(invB.amount).toFixed(2) })}
                          >
                            #{invB.invoice_number || 'B'}: {Number(invB.amount).toFixed(2)}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Payment Received */}
                    <div className="jd-merge-field-group">
                      <label>Payment Status</label>
                      <button
                        type="button"
                        className={`jd-status-pill ${mergeInvoiceForm.payment_received ? 'paid' : 'pending'}`}
                        onClick={() => setMergeInvoiceForm({ ...mergeInvoiceForm, payment_received: !mergeInvoiceForm.payment_received })}
                        style={{ padding: '8px 12px', fontSize: '0.8rem', width: 'fit-content' }}
                      >
                        {mergeInvoiceForm.payment_received ? '✅ Paid' : '⏳ Pending'}
                      </button>
                    </div>

                    {/* Destination Location */}
                    <div className="jd-merge-field-group">
                      <label>Associated Center / Location</label>
                      <select
                        className="jd-merge-field-input"
                        value={mergeInvoiceForm.location_id}
                        onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, location_id: e.target.value })}
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title} {loc.city ? `(${loc.city})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="jd-merge-field-group">
                    <label>Remarks / Notes</label>
                    <textarea
                      className="jd-merge-field-textarea"
                      value={mergeInvoiceForm.notes}
                      onChange={(e) => setMergeInvoiceForm({ ...mergeInvoiceForm, notes: e.target.value })}
                      placeholder="Consolidated remarks..."
                    />
                  </div>
                </div>

                {/* 3. Warning Confirmation Banner */}
                <div className="jd-merge-warning-banner">
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <strong>Permanent DB Change:</strong> Clicking <em>Confirm & Merge Invoices</em> will update Primary Invoice <strong>#{primary.invoice_number || primary.id}</strong> with the consolidated values and permanently delete Duplicate Invoice <strong>#{duplicate.invoice_number || duplicate.id}</strong> from the database.
                  </div>
                </div>
              </div>

              <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', padding: '12px 20px' }}>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => setShowInvoiceMergeModal(false)}
                  disabled={isMergingInvoices}
                >
                  ✕ Cancel
                </button>

                <button
                  type="button"
                  className="jd-btn primary jd-btn-merge-action"
                  onClick={handleConfirmMergeInvoices}
                  disabled={isMergingInvoices}
                  style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  {isMergingInvoices ? 'Merging Invoices...' : '🔀 Confirm & Merge Invoices (Delete Duplicate)'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="jd-modal-overlay" onClick={handleCloseEditInvoice}>
          <div
            className="jd-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: '640px', width: '95%' }}
          >
            <div className="jd-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>✏️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                    Edit Invoice #{editingInvoice.invoice_number || editingInvoice.id}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Modify invoice number, date, books sent, amount, payment status, location, or notes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="jd-modal-close"
                onClick={handleCloseEditInvoice}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice}>
              <div className="jd-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Associated Location */}
                <div className="jd-merge-field-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    Center / Location *
                  </label>
                  <select
                    className="jd-modal-input"
                    value={editInvoiceForm.location_id}
                    onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, location_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Center / Location --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.country === 'US' ? '🇺🇸' : '🇮🇳'} {loc.title} {loc.city ? `(${loc.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Number & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="jd-merge-field-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      className="jd-modal-input"
                      placeholder="e.g. INV-2026-101"
                      value={editInvoiceForm.invoice_number}
                      onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, invoice_number: e.target.value })}
                    />
                  </div>

                  <div className="jd-merge-field-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      className="jd-modal-input"
                      value={editInvoiceForm.invoice_date}
                      onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, invoice_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Books Sent & Amount & Payment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="jd-merge-field-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Books Sent
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="jd-modal-input"
                      value={editInvoiceForm.books_sent}
                      onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, books_sent: e.target.value })}
                    />
                  </div>

                  <div className="jd-merge-field-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Amount ({editingInvoice.location_country === 'US' ? '$' : '₹'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="jd-modal-input"
                      placeholder="0.00"
                      value={editInvoiceForm.amount}
                      onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, amount: e.target.value })}
                    />
                  </div>

                  <div className="jd-merge-field-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Payment Status
                    </label>
                    <button
                      type="button"
                      className={`jd-status-pill ${editInvoiceForm.payment_received ? 'paid' : 'pending'}`}
                      onClick={() => setEditInvoiceForm({ ...editInvoiceForm, payment_received: !editInvoiceForm.payment_received })}
                      style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                    >
                      {editInvoiceForm.payment_received ? '✅ Paid' : '⏳ Pending'}
                    </button>
                  </div>
                </div>

                {/* Remarks & Notes */}
                <div className="jd-merge-field-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    Remarks / Notes
                  </label>
                  <textarea
                    className="jd-modal-input"
                    rows={3}
                    placeholder="e.g. Bhagavad Gita 25 copies, dispatched via DTDC..."
                    value={editInvoiceForm.notes}
                    onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, notes: e.target.value })}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                {/* PDF Document Attachment */}
                <div className="jd-merge-field-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    Retained Invoice PDF
                  </label>
                  {editInvoiceForm.pdf_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <a
                        href={getPdfViewUrl(editInvoiceForm.pdf_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}
                      >
                        📄 {editInvoiceForm.pdf_name || 'View Attached Invoice PDF'}
                      </a>
                      <button
                        type="button"
                        onClick={handleRemoveEditPdf}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        ✕ Remove PDF
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={editPdfInputRef}
                        type="file"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleEditPdfUpload(file)
                        }}
                      />
                      <button
                        type="button"
                        className="jd-btn"
                        onClick={() => editPdfInputRef.current?.click()}
                        disabled={isUploadingEditPdf}
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                      >
                        {isUploadingEditPdf ? '⏳ Uploading PDF...' : '📎 Upload / Attach PDF'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="jd-modal-footer" style={{ justifyContent: 'space-between', background: '#f8fafc', padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={handleCloseEditInvoice}
                  disabled={isSavingEditInvoice}
                >
                  ✕ Cancel
                </button>

                <button
                  type="submit"
                  className="jd-btn primary"
                  disabled={isSavingEditInvoice}
                  style={{ padding: '8px 22px', fontSize: '0.86rem' }}
                >
                  {isSavingEditInvoice ? '💾 Saving Changes...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
