import { useState } from 'react'
import { API_BASE_URL } from './jivandishaHelpers'

export function useFollowUpModal({ setLocations }) {
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [followUpLocation, setFollowUpLocation] = useState(null)
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({
    next_follow_up_date: '',
    remarks: '',
    decision_maker_name: '',
    decision_maker_phone: '',
    inventory_keeper_name: '',
    inventory_keeper_phone: '',
    contact_person: '',
    contact_phone: '',
    contact_email: ''
  })

  const handleOpenFollowUpModal = (loc) => {
    setFollowUpLocation(loc)
    setFollowUpForm({
      next_follow_up_date: loc.next_follow_up_date ? String(loc.next_follow_up_date).slice(0, 10) : '',
      remarks: loc.remarks || '',
      decision_maker_name: loc.decision_maker_name || '',
      decision_maker_phone: loc.decision_maker_phone || '',
      inventory_keeper_name: loc.inventory_keeper_name || '',
      inventory_keeper_phone: loc.inventory_keeper_phone || '',
      contact_person: loc.contact_person || '',
      contact_phone: loc.contact_phone || '',
      contact_email: loc.contact_email || ''
    })
    setFollowUpModalOpen(true)
  }

  const handleSetFollowUpDatePreset = (daysOffset) => {
    if (daysOffset === null) {
      setFollowUpForm((prev) => ({ ...prev, next_follow_up_date: '' }))
      return
    }
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setFollowUpForm((prev) => ({ ...prev, next_follow_up_date: d.toISOString().slice(0, 10) }))
  }

  const handleSaveFollowUp = async (e) => {
    e.preventDefault()
    if (!followUpLocation) return

    setIsSavingFollowUp(true)
    try {
      const res = await fetch(`${API_BASE_URL}/locations/${followUpLocation.id}/follow-up`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpForm)
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setLocations((prev) =>
          prev.map((l) => (l.id === followUpLocation.id ? { ...l, ...followUpForm } : l))
        )
        setFollowUpModalOpen(false)
      } else {
        alert(data.message || 'Failed to update follow-up details.')
      }
    } catch (err) {
      console.error('Error updating follow-up:', err)
      alert('Failed to update follow-up: ' + err.message)
    } finally {
      setIsSavingFollowUp(false)
    }
  }

  return {
    followUpModalOpen,
    setFollowUpModalOpen,
    followUpLocation,
    isSavingFollowUp,
    followUpForm,
    setFollowUpForm,
    handleOpenFollowUpModal,
    handleSetFollowUpDatePreset,
    handleSaveFollowUp
  }
}
