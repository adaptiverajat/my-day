import { useState, useMemo } from 'react'
import { API_BASE_URL } from './jivandishaHelpers'

export function useContactMerge({ locations = [], allInvoices = [], loadLocations, loadAllInvoices }) {
  const [selectedContactIds, setSelectedContactIds] = useState([])
  const [showContactMergeModal, setShowContactMergeModal] = useState(false)
  const [primaryContactId, setPrimaryContactId] = useState(null)
  const [isMergingContacts, setIsMergingContacts] = useState(false)
  const [mergeContactForm, setMergeContactForm] = useState({
    country: 'IN',
    title: '',
    category: 'General',
    city: '',
    state: '',
    address: '',
    notes: '',
    decision_maker_name: '',
    decision_maker_phone: '',
    inventory_keeper_name: '',
    inventory_keeper_phone: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    next_follow_up_date: '',
    remarks: ''
  })

  const handleToggleSelectContact = (id) => {
    setSelectedContactIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[0], id]
      return [...prev, id]
    })
  }

  const selectedContactsForMerge = useMemo(() => {
    return selectedContactIds
      .map((id) => (locations || []).find((l) => l.id === id))
      .filter(Boolean)
  }, [selectedContactIds, locations])

  const getInvoicesCountForContact = (locId) => {
    return (allInvoices || []).filter((inv) => inv.location_id === locId).length
  }

  const handleOpenContactMergeModal = () => {
    if (selectedContactsForMerge.length !== 2) {
      alert('Please select exactly 2 contacts / centers to merge.')
      return
    }
    const [locA, locB] = selectedContactsForMerge
    setPrimaryContactId(locA.id)
    setMergeContactForm({
      country: locA.country || locB.country || 'IN',
      title: locA.title || locB.title || '',
      category: locA.category || locB.category || 'General',
      city: locA.city || locB.city || '',
      state: locA.state || locB.state || '',
      address: locA.address || locB.address || '',
      decision_maker_name: locA.decision_maker_name || locB.decision_maker_name || '',
      decision_maker_phone: locA.decision_maker_phone || locB.decision_maker_phone || '',
      inventory_keeper_name: locA.inventory_keeper_name || locB.inventory_keeper_name || '',
      inventory_keeper_phone: locA.inventory_keeper_phone || locB.inventory_keeper_phone || '',
      contact_person: locA.contact_person || locB.contact_person || '',
      contact_phone: locA.contact_phone || locB.contact_phone || '',
      contact_email: locA.contact_email || locB.contact_email || '',
      website: locA.website || locB.website || '',
      next_follow_up_date: locA.next_follow_up_date || locB.next_follow_up_date || '',
      remarks: [locA.remarks, locB.remarks].filter(Boolean).join(' | '),
      notes: [locA.notes, locB.notes].filter(Boolean).join(' | ')
    })
    setShowContactMergeModal(true)
  }

  const handleSwitchPrimaryContact = (newPrimaryId) => {
    setPrimaryContactId(newPrimaryId)
    const newPrimary = selectedContactsForMerge.find((l) => l.id === newPrimaryId)
    const newDup = selectedContactsForMerge.find((l) => l.id !== newPrimaryId)
    if (newPrimary && newDup) {
      setMergeContactForm((prev) => ({
        ...prev,
        title: prev.title || newPrimary.title || newDup.title,
        city: prev.city || newPrimary.city || newDup.city,
        state: prev.state || newPrimary.state || newDup.state,
        address: prev.address || newPrimary.address || newDup.address
      }))
    }
  }

  const handleConfirmMergeContacts = async () => {
    if (!primaryContactId) return
    const dupLoc = selectedContactsForMerge.find((l) => l.id !== primaryContactId)
    if (!dupLoc) return

    setIsMergingContacts(true)
    try {
      const payload = {
        primary_id: primaryContactId,
        duplicate_id: dupLoc.id,
        merged_fields: { ...mergeContactForm, next_follow_up_date: mergeContactForm.next_follow_up_date || null }
      }
      const res = await fetch(`${API_BASE_URL}/locations/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (loadLocations) await loadLocations()
        if (loadAllInvoices) await loadAllInvoices()
        setShowContactMergeModal(false)
        setSelectedContactIds([])
        alert(`🎉 Contacts merged successfully into single record "${mergeContactForm.title || primaryContactId}"!`)
      } else {
        alert(data.message || 'Failed to merge contacts.')
      }
    } catch (err) {
      console.error('Error merging contacts:', err)
      alert('Error merging contacts: ' + err.message)
    } finally {
      setIsMergingContacts(false)
    }
  }

  return {
    selectedContactIds,
    setSelectedContactIds,
    showContactMergeModal,
    setShowContactMergeModal,
    primaryContactId,
    isMergingContacts,
    mergeContactForm,
    setMergeContactForm,
    handleToggleSelectContact,
    selectedContactsForMerge,
    getInvoicesCountForContact,
    handleOpenContactMergeModal,
    handleSwitchPrimaryContact,
    handleConfirmMergeContacts
  }
}
