import { useState, useCallback } from 'react'
import { API_BASE_URL, LOCAL_STORAGE_KEY, uploadInvoicePdf } from './jivandishaHelpers'
import { searchLocalCities } from '../../utils/cityData'
import { initialLocationForm, extractLocationForm, reverseGeocode, mergePdfExtraction } from './locationModalHelper'

export function useLocationModal({ locations, setLocations, dbConnected, setCitySuggestions, setShowCityDropdown }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfStatusMsg, setPdfStatusMsg] = useState(null)
  const [formData, setFormData] = useState(initialLocationForm)

  const resetLocationForm = useCallback(() => {
    setEditingLocation(null)
    setFormData(initialLocationForm)
    setPdfStatusMsg(null)
    if (setCitySuggestions) setCitySuggestions([])
    if (setShowCityDropdown) setShowCityDropdown(false)
    setModalOpen(true)
  }, [setCitySuggestions, setShowCityDropdown])

  const handleOpenEdit = useCallback((loc) => {
    setEditingLocation(loc)
    setFormData(extractLocationForm(loc))
    setPdfStatusMsg(null)
    if (setCitySuggestions) setCitySuggestions([])
    if (setShowCityDropdown) setShowCityDropdown(false)
    setModalOpen(true)
  }, [setCitySuggestions, setShowCityDropdown])

  const handleMapClick = useCallback(async (country, lat, lng) => {
    const roundedLat = parseFloat(lat.toFixed(5))
    const roundedLng = parseFloat(lng.toFixed(5))
    setEditingLocation(null)
    setFormData({ ...initialLocationForm, country, lat: roundedLat, lng: roundedLng })
    setPdfStatusMsg(null)
    if (setCitySuggestions) setCitySuggestions([])
    if (setShowCityDropdown) setShowCityDropdown(false)
    setModalOpen(true)
    const geocoded = await reverseGeocode(roundedLat, roundedLng)
    if (geocoded) {
      setFormData((prev) => ({
        ...prev,
        city: geocoded.city || prev.city,
        state: geocoded.state || prev.state,
        address: geocoded.address || prev.address
      }))
    }
  }, [setCitySuggestions, setShowCityDropdown])

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfStatusMsg({ type: 'error', text: 'Please select a valid PDF file.' })
      return
    }
    setUploadingPdf(true)
    setPdfStatusMsg({ type: 'info', text: 'Reading and parsing invoice PDF...' })
    try {
      const data = await uploadInvoicePdf(file, formData.country || 'IN')
      const ext = data.extracted || {}
      if (!data.extracted || Object.keys(data.extracted).length === 0 || !data.success) {
        setPdfStatusMsg({ type: 'error', text: data.parseError || data.message || 'PDF parse failed.' })
        return
      }
      setFormData((prev) => {
        const updated = mergePdfExtraction(prev, data, ext)
        if (ext.city) {
          const localCity = searchLocalCities(ext.city, ext.country || updated.country)?.[0]
          if (localCity && localCity.lat && localCity.lng) {
            updated.lat = parseFloat(localCity.lat.toFixed(5))
            updated.lng = parseFloat(localCity.lng.toFixed(5))
          }
        }
        return updated
      })
      setPdfStatusMsg({ type: 'success', text: `✨ PDF parsed successfully.` })
    } catch (uploadErr) {
      setPdfStatusMsg({ type: 'error', text: uploadErr.message || 'Server connection error during upload.' })
    } finally {
      setUploadingPdf(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemovePdf = () => {
    setFormData((prev) => ({ ...prev, invoice_pdf_url: '', invoice_pdf_name: '' }))
    setPdfStatusMsg(null)
  }

  const handleSaveLocation = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return alert('Please enter a business or location title.')
    const payload = {
      ...formData, lat: parseFloat(formData.lat), lng: parseFloat(formData.lng),
      books_sent: parseInt(formData.books_sent, 10) || 0,
      invoice_date: formData.invoice_date || '', payment_received: Boolean(formData.payment_received)
    }
    if (editingLocation) {
      const updatedList = locations.map((i) => (i.id === editingLocation.id ? { ...payload, id: editingLocation.id } : i))
      setLocations(updatedList)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))
      if (dbConnected) {
        try {
          await fetch(`${API_BASE_URL}/locations/${editingLocation.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          })
        } catch (err) { console.error('Failed to update on server:', err) }
      }
    } else {
      const tempId = Date.now()
      const updatedList = [{ ...payload, id: tempId }, ...locations]
      setLocations(updatedList)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))
      if (dbConnected) {
        try {
          const res = await fetch(`${API_BASE_URL}/locations`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          })
          const data = await res.json()
          if (data.success && data.location) setLocations((prev) => prev.map((item) => (item.id === tempId ? data.location : item)))
        } catch (err) { console.error('Failed to save to server:', err) }
      }
    }
    setModalOpen(false)
  }

  return {
    modalOpen, setModalOpen, editingLocation, setEditingLocation, formData, setFormData,
    uploadingPdf, pdfStatusMsg, setPdfStatusMsg, resetLocationForm, handleOpenEdit,
    handleMapClick, handlePdfUpload, handleRemovePdf, handleSaveLocation
  }
}
