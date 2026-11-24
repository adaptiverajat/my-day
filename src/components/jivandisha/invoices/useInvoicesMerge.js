import { useState, useMemo } from 'react'
import { API_BASE_URL } from '../jivandishaHelpers'

export function useInvoicesMerge({ allInvoices, loadAllInvoices, loadLocations }) {
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

  const handleToggleSelectInvoice = (id) => {
    setSelectedInvoiceIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[0], id]
      return [...prev, id]
    })
  }

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
        alert(`🎉 Invoices merged successfully into single record #${primaryInvoiceId}!`)
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

  return {
    selectedInvoiceIds,
    setSelectedInvoiceIds,
    showInvoiceMergeModal,
    setShowInvoiceMergeModal,
    primaryInvoiceId,
    isMergingInvoices,
    mergeInvoiceForm,
    setMergeInvoiceForm,
    handleToggleSelectInvoice,
    selectedInvoicesForMerge,
    handleOpenInvoiceMergeModal,
    handleSwitchPrimaryInvoice,
    handleConfirmMergeInvoices
  }
}
