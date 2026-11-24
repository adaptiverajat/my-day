import { useState, useCallback, useMemo } from 'react'
import { API_BASE_URL, uploadInvoicePdf } from './jivandishaHelpers'

export function useInvoiceHistoryModal({ dbConnected, setLocations, loadLocations }) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedLocationForHistory, setSelectedLocationForHistory] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [uploadingHistoryPdf, setUploadingHistoryPdf] = useState(false)

  const initialNewInvoice = {
    invoice_number: '', invoice_date: new Date().toISOString().slice(0, 10),
    books_sent: 0, amount: '', payment_received: false, pdf_url: '', pdf_name: '', notes: ''
  }
  const [newInvoiceData, setNewInvoiceData] = useState(initialNewInvoice)

  const handleOpenHistory = useCallback(async (loc) => {
    setSelectedLocationForHistory(loc)
    setHistoryModalOpen(true)
    setLoadingInvoices(true)
    setNewInvoiceData(initialNewInvoice)

    const cacheKey = `jivandisha_invoices_${loc.id}`
    let loadedFromApi = false
    try {
      const res = await fetch(`${API_BASE_URL}/locations/${loc.id}/invoices`)
      const data = await res.json()
      if (data.success && Array.isArray(data.invoices)) {
        setInvoices(data.invoices)
        localStorage.setItem(cacheKey, JSON.stringify(data.invoices))
        loadedFromApi = true
      }
    } catch { /* backend unavailable */ }

    if (!loadedFromApi) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try { setInvoices(JSON.parse(cached)) } catch { setInvoices([]) }
      } else {
        if (loc.invoice_date || loc.books_sent > 0 || loc.invoice_pdf_url) {
          setInvoices([{
            id: 'init-' + loc.id, location_id: loc.id, invoice_number: loc.invoice_number || 'Initial Entry',
            invoice_date: loc.invoice_date || '', books_sent: loc.books_sent || 0,
            payment_received: Boolean(loc.payment_received), pdf_url: loc.invoice_pdf_url || '',
            pdf_name: loc.invoice_pdf_name || '', notes: 'Initial location setup'
          }])
        } else {
          setInvoices([])
        }
      }
    }
    setLoadingInvoices(false)
  }, [])

  const handleHistoryPdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHistoryPdf(true)
    try {
      const data = await uploadInvoicePdf(file, selectedLocationForHistory?.country || 'IN')
      const ext = data.extracted || {}
      setNewInvoiceData((prev) => ({
        ...prev, pdf_url: data.pdfUrl, pdf_name: data.pdfFilename,
        invoice_number: ext.invoice_number || prev.invoice_number,
        invoice_date: ext.invoice_date || prev.invoice_date,
        books_sent: ext.books_sent || prev.books_sent, amount: ext.amount || prev.amount,
        payment_received: ext.payment_received !== undefined ? ext.payment_received : prev.payment_received,
        notes: ext.notes || prev.notes
      }))
    } catch (err) {
      alert('Invoice PDF upload failed: ' + err.message)
    } finally {
      setUploadingHistoryPdf(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleAddNewInvoice = async (e) => {
    e.preventDefault()
    if (!selectedLocationForHistory) return
    const locId = selectedLocationForHistory.id
    const cacheKey = `jivandisha_invoices_${locId}`
    const payload = {
      ...newInvoiceData, books_sent: parseInt(newInvoiceData.books_sent, 10) || 0,
      payment_received: Boolean(newInvoiceData.payment_received)
    }
    const tempInvoiceId = Date.now()
    const updatedInvoices = [{ ...payload, id: tempInvoiceId, location_id: locId }, ...invoices]
    setInvoices(updatedInvoices)
    localStorage.setItem(cacheKey, JSON.stringify(updatedInvoices))
    const totalBooks = updatedInvoices.reduce((sum, inv) => sum + (Number(inv.books_sent) || 0), 0)
    setLocations((prev) => prev.map((l) => l.id === locId ? { ...l, books_sent: totalBooks, invoice_date: payload.invoice_date || l.invoice_date } : l))

    if (dbConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/locations/${locId}/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json()
        if (data.success && data.invoice) setInvoices((prev) => prev.map((inv) => (inv.id === tempInvoiceId ? data.invoice : inv)))
      } catch (err) { console.error('Failed to save invoice on server:', err) }
    }
    setNewInvoiceData(initialNewInvoice)
  }

  const handleToggleInvoicePayment = async (inv) => {
    const locId = selectedLocationForHistory?.id
    const updatedStatus = !inv.payment_received
    const cacheKey = `jivandisha_invoices_${locId}`
    const updated = invoices.map((i) => (i.id === inv.id ? { ...i, payment_received: updatedStatus } : i))
    setInvoices(updated)
    localStorage.setItem(cacheKey, JSON.stringify(updated))
    if (dbConnected && typeof inv.id === 'number') {
      try {
        await fetch(`${API_BASE_URL}/invoices/${inv.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_received: updatedStatus }) })
        if (loadLocations) loadLocations()
      } catch (err) { console.error('Failed to update invoice payment status:', err) }
    }
  }

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return
    const locId = selectedLocationForHistory?.id
    const cacheKey = `jivandisha_invoices_${locId}`
    const updated = invoices.filter((i) => i.id !== invoiceId)
    setInvoices(updated)
    localStorage.setItem(cacheKey, JSON.stringify(updated))
    const totalBooks = updated.reduce((sum, inv) => sum + (Number(inv.books_sent) || 0), 0)
    setLocations((prev) => prev.map((l) => (l.id === locId ? { ...l, books_sent: totalBooks } : l)))
    if (dbConnected && typeof invoiceId === 'number') {
      try { await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, { method: 'DELETE' }) } catch (err) { console.error('Failed to delete invoice:', err) }
    }
  }

  const historyTotalBooks = useMemo(() => invoices.reduce((s, i) => s + (Number(i.books_sent) || 0), 0), [invoices])
  const historyPaidCount = useMemo(() => invoices.filter((i) => i.payment_received).length, [invoices])

  return {
    historyModalOpen, setHistoryModalOpen, selectedLocationForHistory, invoices, loadingInvoices,
    uploadingHistoryPdf, newInvoiceData, setNewInvoiceData, handleOpenHistory, handleHistoryPdfUpload,
    handleAddNewInvoice, handleToggleInvoicePayment, handleDeleteInvoice, historyTotalBooks, historyPaidCount
  }
}
