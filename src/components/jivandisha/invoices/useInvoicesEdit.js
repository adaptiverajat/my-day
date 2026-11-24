import { useState, useRef } from 'react'
import { API_BASE_URL, uploadInvoicePdf } from '../jivandishaHelpers'

export function useInvoicesEdit({ locations, loadAllInvoices, loadLocations }) {
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
    setEditInvoiceForm((prev) => ({ ...prev, pdf_url: '', pdf_name: '' }))
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

  return {
    editingInvoice,
    editInvoiceForm,
    setEditInvoiceForm,
    isSavingEditInvoice,
    isUploadingEditPdf,
    editPdfInputRef,
    handleOpenEditInvoice,
    handleCloseEditInvoice,
    handleEditPdfUpload,
    handleRemoveEditPdf,
    handleSaveEditInvoice
  }
}
