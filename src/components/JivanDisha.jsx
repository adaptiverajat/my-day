import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './JivanDisha.css'
import {
  API_BASE_URL,
  LOCAL_STORAGE_KEY,
  uploadInvoicePdf
} from './jivandisha/jivandishaHelpers'
import JivanDishaHeader from './jivandisha/JivanDishaHeader'
import JivanDishaMapsView from './jivandisha/JivanDishaMapsView'
import JivanDishaSidebar from './jivandisha/JivanDishaSidebar'
import JivanDishaInvoicesView from './jivandisha/JivanDishaInvoicesView'
import JivanDishaContactsView from './jivandisha/JivanDishaContactsView'
import JivanDishaIndividualCollectionsView from './jivandisha/JivanDishaIndividualCollectionsView'
import LocationModal from './jivandisha/LocationModal'
import InvoiceHistoryModal from './jivandisha/InvoiceHistoryModal'
import BatchImportModal from './jivandisha/BatchImportModal'
import FollowUpModal from './jivandisha/FollowUpModal'
import { useCityAutocomplete } from './jivandisha/useCityAutocomplete'
import { useJivanDishaBatch } from './jivandisha/useJivanDishaBatch'
import { useJivanDishaMaps } from './jivandisha/useJivanDishaMaps'
import { searchLocalCities, fetchRemoteCities } from '../utils/cityData'

export default function JivanDisha() {
  const navigate = useNavigate()

  // State
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [viewMode, setViewMode] = useState('side-by-side') // 'side-by-side' | 'focus-india' | 'focus-usa'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCountry, setFilterCountry] = useState('ALL') // 'ALL' | 'IN' | 'US'
  const [filterPayment, setFilterPayment] = useState('ALL') // 'ALL' | 'PAID' | 'PENDING'

  // Main Navigation Tab State: 'maps' | 'invoices' | 'contacts'
  const [mainTab, setMainTab] = useState('maps')

  // All Invoices View State
  const [allInvoices, setAllInvoices] = useState([])
  const [loadingAllInvoices, setLoadingAllInvoices] = useState(false)
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('')
  const [invoiceFilterPayment, setInvoiceFilterPayment] = useState('ALL')
  const [invoiceFilterCountry, setInvoiceFilterCountry] = useState('ALL')
  const [invoiceSortBy, setInvoiceSortBy] = useState('date-desc')

  // Textarea Auto-Reading & Adding Invoice State
  const [invoiceTextContent, setInvoiceTextContent] = useState('')
  const [isParsingInvoiceText, setIsParsingInvoiceText] = useState(false)
  const [invoiceParseMsg, setInvoiceParseMsg] = useState(null)
  const [isSavingInvoice, setIsSavingInvoice] = useState(false)
  const [newInvoiceFromText, setNewInvoiceFromText] = useState({
    location_id: '',
    location_title: '',
    country: 'IN',
    city: '',
    state: '',
    address: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    books_sent: 0,
    amount: '',
    payment_received: false,
    decision_maker_name: '',
    decision_maker_phone: '',
    notes: ''
  })

  // Contacts & Follow-ups View State
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [contactFilterFollowUp, setContactFilterFollowUp] = useState('ALL')
  const [contactFilterCountry, setContactFilterCountry] = useState('ALL')
  const [contactSortBy, setContactSortBy] = useState('followup-asc')

  // Follow-Up Quick Editor Modal State
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

  // Location Details Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({
    country: 'IN',
    title: '',
    lat: '',
    lng: '',
    city: '',
    state: '',
    address: '',
    books_sent: 0,
    invoice_date: '',
    payment_received: false,
    decision_maker_name: '',
    decision_maker_phone: '',
    inventory_keeper_name: '',
    inventory_keeper_phone: '',
    notes: '',
    contact_email: '',
    invoice_pdf_url: '',
    invoice_pdf_name: '',
    invoice_number: ''
  })
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfStatusMsg, setPdfStatusMsg] = useState(null)

  // Invoice History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedLocationForHistory, setSelectedLocationForHistory] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [uploadingHistoryPdf, setUploadingHistoryPdf] = useState(false)
  const [newInvoiceData, setNewInvoiceData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    books_sent: 0,
    amount: '',
    payment_received: false,
    pdf_url: '',
    pdf_name: '',
    notes: ''
  })

  // Autocomplete Hook
  const {
    citySuggestions,
    setCitySuggestions,
    showCityDropdown,
    setShowCityDropdown,
    isSearchingCity,
    cityInputRef,
    handleCityChange,
    handleSelectCitySuggestion
  } = useCityAutocomplete(formData.country, setFormData)

  // Batch Import Hook
  const {
    batchModalOpen,
    setBatchModalOpen,
    batchCountry,
    setBatchCountry,
    batchFiles,
    isBatchProcessing,
    batchProcessedCount,
    batchPendingCount,
    batchSuccessCount,
    handleBatchFileSelect,
    handleRemoveBatchFile,
    handleClearBatchFiles,
    runBatchImport
  } = useJivanDishaBatch(dbConnected, setLocations)

  // Load locations from API or LocalStorage
  const loadLocations = useCallback(async () => {
    setLoading(true)
    let loadedFromApi = false

    try {
      let res = await fetch(`${API_BASE_URL}/locations`)

      if (res.status === 500) {
        try {
          const setupRes = await fetch('http://localhost:3001/api/setup-database')
          if (setupRes.ok) {
            res = await fetch(`${API_BASE_URL}/locations`)
          }
        } catch {
          // ignore setup error
        }
      }

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await res.json()
          if (data.success && Array.isArray(data.locations)) {
            setLocations(data.locations)
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.locations))
            setDbConnected(true)
            loadedFromApi = true
          }
        }
      }
    } catch {
      // Backend not currently reachable
    }

    if (!loadedFromApi) {
      setDbConnected(false)
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setLocations(parsed)
        } catch (e) {
          console.error('Failed to parse cached locations', e)
        }
      }
    }
    setLoading(false)
  }, [])

  // Load all invoices across all locations
  const loadAllInvoices = useCallback(async () => {
    setLoadingAllInvoices(true)
    const cacheKey = 'jivandisha_all_invoices_cache'
    let loadedFromApi = false
    try {
      const res = await fetch(`${API_BASE_URL}/invoices`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.invoices)) {
          setAllInvoices(data.invoices)
          localStorage.setItem(cacheKey, JSON.stringify(data.invoices))
          loadedFromApi = true
        }
      }
    } catch {
      // Backend not currently reachable
    }

    if (!loadedFromApi) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setAllInvoices(JSON.parse(cached))
        } catch {
          setAllInvoices([])
        }
      }
    }
    setLoadingAllInvoices(false)
  }, [])

  // Load individual collections count for header badge
  const [individualCollectionsCount, setIndividualCollectionsCount] = useState(0)

  const loadIndividualCollectionsCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.collections)) {
          setIndividualCollectionsCount(data.collections.length)
        }
      }
    } catch {
      // Backend not reachable
    }
  }, [])

  useEffect(() => {
    loadLocations()
    loadAllInvoices()
    loadIndividualCollectionsCount()
  }, [loadLocations, loadAllInvoices, loadIndividualCollectionsCount])

  useEffect(() => {
    if (mainTab === 'invoices') {
      loadAllInvoices()
    } else if (mainTab === 'collections') {
      loadIndividualCollectionsCount()
    }
  }, [mainTab, loadAllInvoices, loadIndividualCollectionsCount])

  // Extract invoice values automatically from textarea content
  const handleExtractFromTextarea = async () => {
    if (!invoiceTextContent.trim()) {
      setInvoiceParseMsg({ type: 'error', text: 'Please paste some invoice text into the textarea first.' })
      return
    }
    setIsParsingInvoiceText(true)
    setInvoiceParseMsg(null)

    try {
      const res = await fetch(`${API_BASE_URL}/parse-invoice-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: invoiceTextContent,
          country: newInvoiceFromText.country || 'IN'
        })
      })

      const data = await res.json()
      if (data.success && data.data) {
        const parsed = data.data
        const matched = data.matchedLocation

        setNewInvoiceFromText((prev) => ({
          ...prev,
          country: parsed.country || (matched ? matched.country : prev.country) || 'IN',
          location_id: matched ? String(matched.id) : (prev.location_id || '__new__'),
          location_title: matched ? matched.title : (parsed.title || prev.location_title || ''),
          city: matched?.city || parsed.city || prev.city || '',
          state: matched?.state || parsed.state || prev.state || '',
          invoice_number: parsed.invoice_number || prev.invoice_number || '',
          invoice_date: parsed.invoice_date || prev.invoice_date || new Date().toISOString().slice(0, 10),
          books_sent: parsed.books_sent !== undefined && parsed.books_sent !== null ? parsed.books_sent : prev.books_sent,
          amount: parsed.amount !== undefined && parsed.amount !== null ? String(parsed.amount) : prev.amount,
          payment_received: parsed.payment_received !== undefined ? Boolean(parsed.payment_received) : prev.payment_received,
          decision_maker_name: parsed.decision_maker_name || matched?.decision_maker_name || prev.decision_maker_name || '',
          decision_maker_phone: matched?.decision_maker_phone || prev.decision_maker_phone || '',
          notes: parsed.notes || prev.notes || ''
        }))

        if (matched) {
          setInvoiceParseMsg({
            type: 'success',
            text: `✨ Automatically extracted & matched existing location: "${matched.title}" (${[matched.city, matched.state].filter(Boolean).join(', ')})`
          })
        } else if (parsed.title || parsed.city) {
          setInvoiceParseMsg({
            type: 'info',
            text: `✨ Extracted values for new location: "${parsed.title || parsed.city}". Review and click Save.`
          })
        } else {
          setInvoiceParseMsg({
            type: 'info',
            text: '✨ Extracted values from text! You can review or edit the fields below before saving.'
          })
        }
      } else {
        setInvoiceParseMsg({
          type: 'error',
          text: data.message || 'Could not parse text automatically. You can fill the form fields manually.'
        })
      }
    } catch (err) {
      setInvoiceParseMsg({
        type: 'error',
        text: 'Error contacting parser service: ' + err.message
      })
    } finally {
      setIsParsingInvoiceText(false)
    }
  }

  // Save new invoice from textarea form
  const handleSaveInvoiceFromText = async (e, forceSave = false) => {
    if (e && e.preventDefault) e.preventDefault()

    let targetLocId = null
    let titleToUse = ''

    if (newInvoiceFromText.location_id && newInvoiceFromText.location_id !== '__new__') {
      targetLocId = parseInt(newInvoiceFromText.location_id, 10)
      const locObj = locations.find((l) => l.id === targetLocId)
      titleToUse = locObj ? locObj.title : newInvoiceFromText.location_title
    } else {
      titleToUse = newInvoiceFromText.location_title.trim()
      if (!titleToUse) {
        alert('Please select an existing location or enter a location title.')
        return
      }
    }

    // Duplicate validation check: same date and same price
    if (!forceSave && newInvoiceFromText.invoice_date && newInvoiceFromText.amount) {
      const targetDate = String(newInvoiceFromText.invoice_date).slice(0, 10).trim()
      const targetAmount = parseFloat(newInvoiceFromText.amount)
      if (targetDate && !isNaN(targetAmount) && targetAmount > 0) {
        const potentialDups = allInvoices.filter((inv) => {
          const invDate = inv.invoice_date ? String(inv.invoice_date).slice(0, 10).trim() : ''
          const invAmt = Number(inv.amount)
          return invDate === targetDate && !isNaN(invAmt) && Math.abs(invAmt - targetAmount) < 0.01
        })

        if (potentialDups.length > 0) {
          const dupSummary = potentialDups
            .map(
              (d) =>
                `• Invoice #${d.invoice_number || 'N/A'} for "${d.location_title || 'Location'}" (${d.location_country === 'US' ? '$' : '₹'}${Number(d.amount).toFixed(2)})`
            )
            .join('\n')
          const proceed = window.confirm(
            `⚠️ Possible Duplicate Invoice Detected!\n\nAn invoice for the same date (${targetDate}) and price (${newInvoiceFromText.country === 'US' ? '$' : '₹'}${targetAmount.toFixed(2)}) already exists:\n\n${dupSummary}\n\nDo you want to proceed and add this as a new entry anyway?`
          )
          if (!proceed) return
        }
      }
    }

    setIsSavingInvoice(true)
    try {
      const payload = {
        location_id: targetLocId,
        location_title: titleToUse,
        country: newInvoiceFromText.country || 'IN',
        city: newInvoiceFromText.city,
        state: newInvoiceFromText.state,
        address: newInvoiceFromText.address || newInvoiceFromText.city,
        invoice_number: newInvoiceFromText.invoice_number,
        invoice_date: newInvoiceFromText.invoice_date || new Date().toISOString().slice(0, 10),
        books_sent: parseInt(newInvoiceFromText.books_sent, 10) || 0,
        amount: newInvoiceFromText.amount ? parseFloat(newInvoiceFromText.amount) : null,
        payment_received: Boolean(newInvoiceFromText.payment_received),
        decision_maker_name: newInvoiceFromText.decision_maker_name,
        decision_maker_phone: newInvoiceFromText.decision_maker_phone,
        notes: newInvoiceFromText.notes
      }

      const res = await fetch(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        await loadAllInvoices()
        await loadLocations()

        setInvoiceParseMsg({
          type: 'success',
          text: `🎉 Successfully saved invoice #${newInvoiceFromText.invoice_number || 'New'} for "${titleToUse}"!`
        })

        setInvoiceTextContent('')
        setNewInvoiceFromText({
          location_id: '',
          location_title: '',
          country: 'IN',
          city: '',
          state: '',
          address: '',
          invoice_number: '',
          invoice_date: new Date().toISOString().slice(0, 10),
          books_sent: 0,
          amount: '',
          payment_received: false,
          decision_maker_name: '',
          decision_maker_phone: '',
          notes: ''
        })
      } else {
        alert(data.message || 'Failed to save invoice.')
      }
    } catch (err) {
      console.error('Error saving invoice:', err)
      alert('Failed to save invoice: ' + err.message)
    } finally {
      setIsSavingInvoice(false)
    }
  }

  // Toggle Payment Status on an individual Invoice in All Invoices table
  const handleToggleInvoicePaymentInList = async (inv) => {
    const updatedStatus = !inv.payment_received
    const updated = allInvoices.map((i) =>
      i.id === inv.id ? { ...i, payment_received: updatedStatus } : i
    )
    setAllInvoices(updated)
    localStorage.setItem('jivandisha_all_invoices_cache', JSON.stringify(updated))

    if (dbConnected && typeof inv.id === 'number') {
      try {
        await fetch(`${API_BASE_URL}/invoices/${inv.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_received: updatedStatus })
        })
        loadLocations()
      } catch (err) {
        console.error('Failed to toggle invoice payment:', err)
      }
    }
  }

  // Delete invoice from All Invoices table
  const handleDeleteInvoiceFromList = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice record?')) return
    const updated = allInvoices.filter((i) => i.id !== invoiceId)
    setAllInvoices(updated)
    localStorage.setItem('jivandisha_all_invoices_cache', JSON.stringify(updated))

    if (dbConnected && typeof invoiceId === 'number') {
      try {
        await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, { method: 'DELETE' })
      } catch (err) {
        console.error('Failed to delete invoice:', err)
      }
    }
  }

  // Open Follow-up modal
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

  // Quick Preset Date selector for follow-ups
  const handleSetFollowUpDatePreset = (daysOffset) => {
    if (daysOffset === null) {
      setFollowUpForm((prev) => ({ ...prev, next_follow_up_date: '' }))
      return
    }
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    setFollowUpForm((prev) => ({ ...prev, next_follow_up_date: d.toISOString().slice(0, 10) }))
  }

  // Save follow-up details & remarks
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
          prev.map((l) =>
            l.id === followUpLocation.id
              ? { ...l, ...followUpForm }
              : l
          )
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

  // Open History Modal for a location
  const handleOpenHistory = useCallback(async (loc) => {
    setSelectedLocationForHistory(loc)
    setHistoryModalOpen(true)
    setLoadingInvoices(true)
    setNewInvoiceData({
      invoice_number: '',
      invoice_date: new Date().toISOString().slice(0, 10),
      books_sent: 0,
      amount: '',
      payment_received: false,
      pdf_url: '',
      pdf_name: '',
      notes: ''
    })

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
    } catch {
      console.warn('Backend unavailable, trying cached invoices...')
    }

    if (!loadedFromApi) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setInvoices(JSON.parse(cached))
        } catch {
          setInvoices([])
        }
      } else {
        if (loc.invoice_date || loc.books_sent > 0 || loc.invoice_pdf_url) {
          setInvoices([
            {
              id: 'init-' + loc.id,
              location_id: loc.id,
              invoice_number: loc.invoice_number || 'Initial Entry',
              invoice_date: loc.invoice_date || '',
              books_sent: loc.books_sent || 0,
              payment_received: Boolean(loc.payment_received),
              pdf_url: loc.invoice_pdf_url || '',
              pdf_name: loc.invoice_pdf_name || '',
              notes: 'Initial location setup'
            }
          ])
        } else {
          setInvoices([])
        }
      }
    }
    setLoadingInvoices(false)
  }, [])

  // Open edit modal
  const handleOpenEdit = useCallback((loc) => {
    setEditingLocation(loc)
    setFormData({
      country: loc.country || 'IN',
      title: loc.title || '',
      lat: loc.lat,
      lng: loc.lng,
      city: loc.city || '',
      state: loc.state || '',
      address: loc.address || '',
      books_sent: loc.books_sent || 0,
      invoice_date: loc.invoice_date || '',
      payment_received: Boolean(loc.payment_received),
      decision_maker_name: loc.decision_maker_name || '',
      decision_maker_phone: loc.decision_maker_phone || '',
      inventory_keeper_name: loc.inventory_keeper_name || '',
      inventory_keeper_phone: loc.inventory_keeper_phone || '',
      notes: loc.notes || '',
      contact_email: loc.contact_email || '',
      invoice_pdf_url: loc.invoice_pdf_url || '',
      invoice_pdf_name: loc.invoice_pdf_name || '',
      invoice_number: loc.invoice_number || ''
    })
    setPdfStatusMsg(null)
    setCitySuggestions([])
    setShowCityDropdown(false)
    setModalOpen(true)
  }, [setCitySuggestions, setShowCityDropdown])

  // Delete location
  const handleDeleteLocation = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return

    setLocations((prev) => {
      const updatedList = prev.filter((loc) => loc.id !== id)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))
      return updatedList
    })

    try {
      await fetch(`${API_BASE_URL}/locations/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('Could not delete on server, updated locally:', err)
    }
  }, [])

  // Map click handler: opens modal and attempts reverse geocoding
  const handleMapClick = useCallback(async (country, lat, lng) => {
    const roundedLat = parseFloat(lat.toFixed(5))
    const roundedLng = parseFloat(lng.toFixed(5))

    setEditingLocation(null)
    setFormData({
      country,
      title: '',
      lat: roundedLat,
      lng: roundedLng,
      city: '',
      state: '',
      address: '',
      books_sent: 0,
      invoice_date: '',
      payment_received: false,
      decision_maker_name: '',
      decision_maker_phone: '',
      inventory_keeper_name: '',
      inventory_keeper_phone: '',
      notes: '',
      contact_email: '',
      invoice_pdf_url: '',
      invoice_pdf_name: '',
      invoice_number: ''
    })
    setPdfStatusMsg(null)
    setCitySuggestions([])
    setShowCityDropdown(false)
    setModalOpen(true)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&zoom=10`
      )
      if (res.ok) {
        const data = await res.json()
        const addr = data.address || {}
        const detectedCity = addr.city || addr.town || addr.village || addr.county || ''
        const detectedState = addr.state || ''
        setFormData((prev) => ({
          ...prev,
          city: detectedCity || prev.city,
          state: detectedState || prev.state,
          address: data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : prev.address
        }))
      }
    } catch {
      // Gracefully ignore geocoding failure
    }
  }, [setCitySuggestions, setShowCityDropdown])

  // Leaflet Maps Hook
  const { indiaContainerRef, usaContainerRef, handleFlyTo } = useJivanDishaMaps({
    locations,
    viewMode,
    sidebarOpen,
    mainTab,
    handleMapClick,
    handleOpenHistory,
    handleOpenEdit,
    handleDeleteLocation
  })

  // Handle uploading and reading invoice PDF in Add/Edit Location Modal
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
        setPdfStatusMsg({
          type: 'error',
          text: data.parseError || data.message || 'PDF uploaded, but could not extract structured fields.'
        })
        return
      }

      setFormData((prev) => {
        const updated = {
          ...prev,
          invoice_pdf_url: data.pdfUrl || prev.invoice_pdf_url,
          invoice_pdf_name: data.pdfFilename || prev.invoice_pdf_name
        }

        if (ext.title) updated.title = ext.title
        if (ext.country) updated.country = ext.country
        if (ext.city) updated.city = ext.city
        if (ext.state) updated.state = ext.state
        if (ext.address) updated.address = ext.address
        if (ext.books_sent) updated.books_sent = ext.books_sent
        if (ext.invoice_date) updated.invoice_date = ext.invoice_date
        if (ext.payment_received !== undefined) updated.payment_received = ext.payment_received
        if (ext.decision_maker_name) updated.decision_maker_name = ext.decision_maker_name
        if (ext.decision_maker_phone) updated.decision_maker_phone = ext.decision_maker_phone
        if (ext.inventory_keeper_name) updated.inventory_keeper_name = ext.inventory_keeper_name
        if (ext.inventory_keeper_phone) updated.inventory_keeper_phone = ext.inventory_keeper_phone
        if (ext.contact_email) updated.contact_email = ext.contact_email
        if (ext.invoice_number) updated.invoice_number = ext.invoice_number
        if (ext.notes) updated.notes = ext.notes

        if (ext.city) {
          const localCity = searchLocalCities(ext.city, ext.country || updated.country)?.[0]
          if (localCity && localCity.lat && localCity.lng) {
            updated.lat = parseFloat(localCity.lat.toFixed(5))
            updated.lng = parseFloat(localCity.lng.toFixed(5))
          }
        }

        return updated
      })

      if (ext.city && (!searchLocalCities(ext.city, ext.country || formData.country)?.[0])) {
        fetchRemoteCities(ext.city, ext.country || formData.country).then((remotes) => {
          if (remotes.length > 0 && remotes[0].lat && remotes[0].lng) {
            setFormData((prev) => ({
              ...prev,
              lat: prev.lat || parseFloat(remotes[0].lat.toFixed(5)),
              lng: prev.lng || parseFloat(remotes[0].lng.toFixed(5)),
              state: prev.state || remotes[0].state || ''
            }))
          }
        }).catch(() => {})
      }

      const summaryParts = []
      if (ext.title) summaryParts.push(ext.title)
      if (ext.city) summaryParts.push(ext.city)
      if (ext.books_sent) summaryParts.push(`${ext.books_sent} books`)
      if (ext.invoice_number) summaryParts.push(`Inv #${ext.invoice_number}`)
      if (ext.invoice_date) summaryParts.push(ext.invoice_date)

      setPdfStatusMsg({
        type: 'success',
        text: `✨ PDF parsed & fields populated: ${summaryParts.join(' • ')}`
      })
    } catch (uploadErr) {
      console.error('Failed to upload/parse PDF:', uploadErr)
      setPdfStatusMsg({
        type: 'error',
        text: uploadErr.message || 'Server connection error during PDF upload. Ensure server is running.'
      })
    } finally {
      setUploadingPdf(false)
      if (e.target) e.target.value = ''
    }
  }

  // Remove attached PDF from location form
  const handleRemovePdf = () => {
    setFormData((prev) => ({
      ...prev,
      invoice_pdf_url: '',
      invoice_pdf_name: ''
    }))
    setPdfStatusMsg(null)
  }

  // Handle uploading PDF in History Modal
  const handleHistoryPdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingHistoryPdf(true)
    try {
      const data = await uploadInvoicePdf(file, selectedLocationForHistory?.country || 'IN')
      const ext = data.extracted || {}
      setNewInvoiceData((prev) => ({
        ...prev,
        pdf_url: data.pdfUrl,
        pdf_name: data.pdfFilename,
        invoice_number: ext.invoice_number || prev.invoice_number,
        invoice_date: ext.invoice_date || prev.invoice_date,
        books_sent: ext.books_sent || prev.books_sent,
        amount: ext.amount || prev.amount,
        payment_received: ext.payment_received !== undefined ? ext.payment_received : prev.payment_received,
        notes: ext.notes || prev.notes
      }))
    } catch (err) {
      console.error('History PDF upload error:', err)
      setPdfStatusMsg({ type: 'error', text: err.message || 'Invoice PDF upload failed.' })
    } finally {
      setUploadingHistoryPdf(false)
      if (e.target) e.target.value = ''
    }
  }

  // Handle Save (Add or Update Location)
  const handleSaveLocation = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Please enter a business or location title.')
      return
    }

    const payload = {
      ...formData,
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      books_sent: parseInt(formData.books_sent, 10) || 0,
      invoice_date: formData.invoice_date || '',
      payment_received: Boolean(formData.payment_received)
    }

    if (editingLocation) {
      const updatedList = locations.map((item) =>
        item.id === editingLocation.id ? { ...payload, id: editingLocation.id } : item
      )
      setLocations(updatedList)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))

      if (dbConnected) {
        try {
          await fetch(`${API_BASE_URL}/locations/${editingLocation.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        } catch (err) {
          console.error('Failed to update on server:', err)
        }
      }
    } else {
      const tempId = Date.now()
      const newLoc = { ...payload, id: tempId }
      const updatedList = [newLoc, ...locations]
      setLocations(updatedList)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))

      if (dbConnected) {
        try {
          const res = await fetch(`${API_BASE_URL}/locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          const data = await res.json()
          if (data.success && data.location) {
            setLocations((prev) =>
              prev.map((item) => (item.id === tempId ? data.location : item))
            )
          }
        } catch (err) {
          console.error('Failed to save to server:', err)
        }
      }
    }

    setModalOpen(false)
  }

  // Handle Add New Invoice to History
  const handleAddNewInvoice = async (e) => {
    e.preventDefault()
    if (!selectedLocationForHistory) return

    const locId = selectedLocationForHistory.id
    const cacheKey = `jivandisha_invoices_${locId}`

    const payload = {
      ...newInvoiceData,
      books_sent: parseInt(newInvoiceData.books_sent, 10) || 0,
      payment_received: Boolean(newInvoiceData.payment_received)
    }

    const tempInvoiceId = Date.now()
    const tempInv = { ...payload, id: tempInvoiceId, location_id: locId }
    const updatedInvoices = [tempInv, ...invoices]
    setInvoices(updatedInvoices)
    localStorage.setItem(cacheKey, JSON.stringify(updatedInvoices))

    const totalBooks = updatedInvoices.reduce((sum, inv) => sum + (Number(inv.books_sent) || 0), 0)
    setLocations((prev) =>
      prev.map((l) =>
        l.id === locId
          ? { ...l, books_sent: totalBooks, invoice_date: payload.invoice_date || l.invoice_date }
          : l
      )
    )

    if (dbConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/locations/${locId}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success && data.invoice) {
          setInvoices((prev) =>
            prev.map((inv) => (inv.id === tempInvoiceId ? data.invoice : inv))
          )
        }
      } catch (err) {
        console.error('Failed to save invoice on server:', err)
      }
    }

    setNewInvoiceData({
      invoice_number: '',
      invoice_date: new Date().toISOString().slice(0, 10),
      books_sent: 0,
      amount: '',
      payment_received: false,
      pdf_url: '',
      pdf_name: '',
      notes: ''
    })
  }

  // Toggle Payment Status on an individual Invoice
  const handleToggleInvoicePayment = async (inv) => {
    const locId = selectedLocationForHistory?.id
    const updatedStatus = !inv.payment_received
    const cacheKey = `jivandisha_invoices_${locId}`

    const updated = invoices.map((i) =>
      i.id === inv.id ? { ...i, payment_received: updatedStatus } : i
    )
    setInvoices(updated)
    localStorage.setItem(cacheKey, JSON.stringify(updated))

    if (dbConnected && typeof inv.id === 'number') {
      try {
        await fetch(`${API_BASE_URL}/invoices/${inv.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_received: updatedStatus })
        })
        loadLocations()
      } catch (err) {
        console.error('Failed to update invoice payment status:', err)
      }
    }
  }

  // Delete invoice from location history
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return

    const locId = selectedLocationForHistory?.id
    const cacheKey = `jivandisha_invoices_${locId}`

    const updated = invoices.filter((i) => i.id !== invoiceId)
    setInvoices(updated)
    localStorage.setItem(cacheKey, JSON.stringify(updated))

    const totalBooks = updated.reduce((sum, inv) => sum + (Number(inv.books_sent) || 0), 0)
    setLocations((prev) =>
      prev.map((l) => (l.id === locId ? { ...l, books_sent: totalBooks } : l))
    )

    if (dbConnected && typeof invoiceId === 'number') {
      try {
        await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, { method: 'DELETE' })
      } catch (err) {
        console.error('Failed to delete invoice:', err)
      }
    }
  }

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(locations, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `jivandisha_locations_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Filtered locations
  const filteredLocations = locations.filter((loc) => {
    if (filterCountry !== 'ALL' && loc.country !== filterCountry) return false
    if (filterPayment === 'PAID' && !loc.payment_received) return false
    if (filterPayment === 'PENDING' && loc.payment_received) return false
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchTitle = (loc.title || '').toLowerCase().includes(q)
      const matchCity = (loc.city || '').toLowerCase().includes(q)
      const matchState = (loc.state || '').toLowerCase().includes(q)
      const matchNotes = (loc.notes || '').toLowerCase().includes(q)
      const matchDecision = (loc.decision_maker_name || '').toLowerCase().includes(q)
      const matchInventory = (loc.inventory_keeper_name || '').toLowerCase().includes(q)
      return matchTitle || matchCity || matchState || matchNotes || matchDecision || matchInventory
    }
    return true
  })

  const indiaCount = locations.filter((l) => l.country !== 'US').length
  const usaCount = locations.filter((l) => l.country === 'US').length
  const totalBooks = locations.reduce((sum, l) => sum + (Number(l.books_sent) || 0), 0)

  // Calculations for history modal
  const historyTotalBooks = invoices.reduce((s, i) => s + (Number(i.books_sent) || 0), 0)
  const historyPaidCount = invoices.filter((i) => i.payment_received).length

  // Filtered and sorted invoices for Invoices View
  const filteredAllInvoices = allInvoices.filter((inv) => {
    if (invoiceFilterCountry !== 'ALL' && inv.location_country !== invoiceFilterCountry) return false
    if (invoiceFilterPayment === 'PAID' && !inv.payment_received) return false
    if (invoiceFilterPayment === 'PENDING' && inv.payment_received) return false
    if (invoiceSearchTerm.trim()) {
      const q = invoiceSearchTerm.toLowerCase()
      const matchInvNum = (inv.invoice_number || '').toLowerCase().includes(q)
      const matchTitle = (inv.location_title || '').toLowerCase().includes(q)
      const matchCity = (inv.location_city || '').toLowerCase().includes(q)
      const matchState = (inv.location_state || '').toLowerCase().includes(q)
      const matchContact = (inv.decision_maker_name || '').toLowerCase().includes(q)
      const matchNotes = (inv.notes || '').toLowerCase().includes(q)
      return matchInvNum || matchTitle || matchCity || matchState || matchContact || matchNotes
    }
    return true
  }).sort((a, b) => {
    if (invoiceSortBy === 'date-desc') return (b.invoice_date || '').localeCompare(a.invoice_date || '')
    if (invoiceSortBy === 'date-asc') return (a.invoice_date || '').localeCompare(b.invoice_date || '')
    if (invoiceSortBy === 'amount-desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
    if (invoiceSortBy === 'amount-asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0)
    if (invoiceSortBy === 'books-desc') return (Number(b.books_sent) || 0) - (Number(a.books_sent) || 0)
    if (invoiceSortBy === 'title-asc') return (a.location_title || '').localeCompare(b.location_title || '')
    return 0
  })

  const totalInvoicesCount = allInvoices.length
  const totalBooksAllInvoices = allInvoices.reduce((sum, i) => sum + (Number(i.books_sent) || 0), 0)
  const totalAmountAllInvoices = allInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const paidInvoicesCount = allInvoices.filter((i) => i.payment_received).length
  const pendingInvoicesCount = allInvoices.filter((i) => !i.payment_received).length

  // Filtered and sorted contacts for Contacts View
  const todayDateStr = new Date().toISOString().slice(0, 10)

  const filteredContacts = locations.filter((loc) => {
    if (contactFilterCountry !== 'ALL' && loc.country !== contactFilterCountry) return false

    const fuDate = loc.next_follow_up_date ? String(loc.next_follow_up_date).slice(0, 10) : ''
    if (contactFilterFollowUp === 'OVERDUE' && (!fuDate || fuDate >= todayDateStr)) return false
    if (contactFilterFollowUp === 'TODAY' && fuDate !== todayDateStr) return false
    if (contactFilterFollowUp === 'UPCOMING' && (!fuDate || fuDate <= todayDateStr)) return false
    if (contactFilterFollowUp === 'NONE' && fuDate) return false

    if (contactSearchTerm.trim()) {
      const q = contactSearchTerm.toLowerCase()
      const matchTitle = (loc.title || '').toLowerCase().includes(q)
      const matchCity = (loc.city || '').toLowerCase().includes(q)
      const matchState = (loc.state || '').toLowerCase().includes(q)
      const matchAddress = (loc.address || '').toLowerCase().includes(q)
      const matchDecision = (loc.decision_maker_name || '').toLowerCase().includes(q)
      const matchDecisionPhone = (loc.decision_maker_phone || '').toLowerCase().includes(q)
      const matchInventory = (loc.inventory_keeper_name || '').toLowerCase().includes(q)
      const matchInventoryPhone = (loc.inventory_keeper_phone || '').toLowerCase().includes(q)
      const matchContact = (loc.contact_person || '').toLowerCase().includes(q)
      const matchEmail = (loc.contact_email || '').toLowerCase().includes(q)
      const matchRemarks = (loc.remarks || '').toLowerCase().includes(q)
      return (
        matchTitle ||
        matchCity ||
        matchState ||
        matchAddress ||
        matchDecision ||
        matchDecisionPhone ||
        matchInventory ||
        matchInventoryPhone ||
        matchContact ||
        matchEmail ||
        matchRemarks
      )
    }
    return true
  }).sort((a, b) => {
    const aDate = a.next_follow_up_date ? String(a.next_follow_up_date).slice(0, 10) : ''
    const bDate = b.next_follow_up_date ? String(b.next_follow_up_date).slice(0, 10) : ''

    if (contactSortBy === 'followup-asc') {
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return aDate.localeCompare(bDate)
    }
    if (contactSortBy === 'followup-desc') {
      if (!aDate && !bDate) return 0
      if (!aDate) return 1
      if (!bDate) return -1
      return bDate.localeCompare(aDate)
    }
    if (contactSortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '')
    if (contactSortBy === 'city-asc') return (a.city || '').localeCompare(b.city || '')
    return 0
  })

  const contactsDueTodayCount = locations.filter(
    (l) => l.next_follow_up_date && String(l.next_follow_up_date).slice(0, 10) === todayDateStr
  ).length
  const contactsOverdueCount = locations.filter(
    (l) => l.next_follow_up_date && String(l.next_follow_up_date).slice(0, 10) < todayDateStr
  ).length
  const contactsUpcomingCount = locations.filter(
    (l) => l.next_follow_up_date && String(l.next_follow_up_date).slice(0, 10) > todayDateStr
  ).length
  const contactsNoDateCount = locations.filter((l) => !l.next_follow_up_date).length

  return (
    <div className={`jivandisha-container jd-view-${mainTab}`}>
      {/* Top Header */}
      <JivanDishaHeader
        mainTab={mainTab}
        setMainTab={setMainTab}
        dbConnected={dbConnected}
        totalBooks={totalBooks}
        locationsCount={locations.length}
        invoicesCount={allInvoices.length}
        allInvoicesCount={allInvoices.length}
        individualCollectionsCount={individualCollectionsCount}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onExportJSON={handleExportJSON}
        handleExportJSON={handleExportJSON}
        onRefreshInvoices={loadAllInvoices}
        loadAllInvoices={loadAllInvoices}
        onRefreshContacts={loadLocations}
        loadLocations={loadLocations}
        onRefreshCollections={loadIndividualCollectionsCount}
        loadIndividualCollections={loadIndividualCollectionsCount}
        onBackToCalendar={() => navigate('/')}
        navigate={navigate}
        onOpenAddLocation={() => {
          setEditingLocation(null)
          setFormData({
            country: 'IN',
            title: '',
            lat: '',
            lng: '',
            city: '',
            state: '',
            address: '',
            books_sent: 0,
            invoice_date: '',
            invoice_number: '',
            invoice_pdf_url: '',
            invoice_pdf_name: '',
            payment_received: false,
            decision_maker_name: '',
            decision_maker_phone: '',
            inventory_keeper_name: '',
            inventory_keeper_phone: '',
            notes: '',
            contact_email: ''
          })
          setPdfStatusMsg(null)
          setCitySuggestions([])
          setShowCityDropdown(false)
          setModalOpen(true)
        }}
        onOpenAddLocationModal={() => {
          setEditingLocation(null)
          setFormData({
            country: 'IN',
            title: '',
            lat: '',
            lng: '',
            city: '',
            state: '',
            address: '',
            books_sent: 0,
            invoice_date: '',
            invoice_number: '',
            invoice_pdf_url: '',
            invoice_pdf_name: '',
            payment_received: false,
            decision_maker_name: '',
            decision_maker_phone: '',
            inventory_keeper_name: '',
            inventory_keeper_phone: '',
            notes: '',
            contact_email: ''
          })
          setPdfStatusMsg(null)
          setCitySuggestions([])
          setShowCityDropdown(false)
          setModalOpen(true)
        }}
        onOpenBatchImport={() => setBatchModalOpen(true)}
        onOpenBatchModal={() => setBatchModalOpen(true)}
      />

      {/* Main Workspace (Maps View) */}
      <div className="jd-workspace" style={{ display: mainTab === 'maps' ? 'flex' : 'none' }}>
        <JivanDishaMapsView
          totalInvoicesCount={totalInvoicesCount}
          totalBooksAllInvoices={totalBooksAllInvoices}
          totalAmountAllInvoices={totalAmountAllInvoices}
          paidInvoicesCount={paidInvoicesCount}
          pendingInvoicesCount={pendingInvoicesCount}
          viewMode={viewMode}
          indiaCount={indiaCount}
          usaCount={usaCount}
          indiaContainerRef={indiaContainerRef}
          usaContainerRef={usaContainerRef}
        />

        <JivanDishaSidebar
          sidebarOpen={sidebarOpen}
          filteredLocations={filteredLocations}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterCountry={filterCountry}
          setFilterCountry={setFilterCountry}
          filterPayment={filterPayment}
          setFilterPayment={setFilterPayment}
          loading={loading}
          onRefresh={loadLocations}
          loadLocations={loadLocations}
          onFocusLocation={handleFlyTo}
          handleFlyTo={handleFlyTo}
          onOpenHistory={handleOpenHistory}
          handleOpenHistory={handleOpenHistory}
          onOpenEdit={handleOpenEdit}
          handleOpenEdit={handleOpenEdit}
          onDeleteLocation={handleDeleteLocation}
          handleDeleteLocation={handleDeleteLocation}
        />
      </div>

      {/* Invoices View */}
      <JivanDishaInvoicesView
        mainTab={mainTab}
        allInvoices={allInvoices}
        locations={locations}
        loadAllInvoices={loadAllInvoices}
        loadLocations={loadLocations}
        invoiceSearchTerm={invoiceSearchTerm}
        setInvoiceSearchTerm={setInvoiceSearchTerm}
        invoiceFilterPayment={invoiceFilterPayment}
        setInvoiceFilterPayment={setInvoiceFilterPayment}
        invoiceFilterCountry={invoiceFilterCountry}
        setInvoiceFilterCountry={setInvoiceFilterCountry}
        invoiceSortBy={invoiceSortBy}
        setInvoiceSortBy={setInvoiceSortBy}
        filteredAllInvoices={filteredAllInvoices}
        loadingAllInvoices={loadingAllInvoices}
        handleToggleInvoicePaymentInList={handleToggleInvoicePaymentInList}
        handleDeleteInvoiceFromList={handleDeleteInvoiceFromList}
      />

      {/* Contacts & Follow-ups View */}
      <JivanDishaContactsView
        mainTab={mainTab}
        locations={locations}
        allInvoices={allInvoices}
        loadLocations={loadLocations}
        loadAllInvoices={loadAllInvoices}
        contactsDueTodayCount={contactsDueTodayCount}
        contactsOverdueCount={contactsOverdueCount}
        contactsUpcomingCount={contactsUpcomingCount}
        contactsNoDateCount={contactsNoDateCount}
        contactSearchTerm={contactSearchTerm}
        setContactSearchTerm={setContactSearchTerm}
        contactFilterFollowUp={contactFilterFollowUp}
        setContactFilterFollowUp={setContactFilterFollowUp}
        contactFilterCountry={contactFilterCountry}
        setContactFilterCountry={setContactFilterCountry}
        contactSortBy={contactSortBy}
        setContactSortBy={setContactSortBy}
        filteredContacts={filteredContacts}
        handleOpenFollowUpModal={handleOpenFollowUpModal}
        handleOpenEdit={handleOpenEdit}
      />

      {/* Individual Collection View */}
      <JivanDishaIndividualCollectionsView
        mainTab={mainTab}
        onCollectionsCountChange={setIndividualCollectionsCount}
      />

      {/* Modals */}
      <LocationModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editingLocation={editingLocation}
        formData={formData}
        setFormData={setFormData}
        handleSaveLocation={handleSaveLocation}
        handleRemovePdf={handleRemovePdf}
        uploadingPdf={uploadingPdf}
        handlePdfUpload={handlePdfUpload}
        setBatchModalOpen={setBatchModalOpen}
        pdfStatusMsg={pdfStatusMsg}
        cityInputRef={cityInputRef}
        isSearchingCity={isSearchingCity}
        handleCityChange={handleCityChange}
        citySuggestions={citySuggestions}
        setCitySuggestions={setCitySuggestions}
        showCityDropdown={showCityDropdown}
        setShowCityDropdown={setShowCityDropdown}
        handleSelectCitySuggestion={handleSelectCitySuggestion}
      />

      <InvoiceHistoryModal
        historyModalOpen={historyModalOpen}
        setHistoryModalOpen={setHistoryModalOpen}
        selectedLocationForHistory={selectedLocationForHistory}
        invoices={invoices}
        historyTotalBooks={historyTotalBooks}
        historyPaidCount={historyPaidCount}
        uploadingHistoryPdf={uploadingHistoryPdf}
        handleHistoryPdfUpload={handleHistoryPdfUpload}
        newInvoiceData={newInvoiceData}
        setNewInvoiceData={setNewInvoiceData}
        handleAddNewInvoice={handleAddNewInvoice}
        loadingInvoices={loadingInvoices}
        handleToggleInvoicePayment={handleToggleInvoicePayment}
        handleDeleteInvoice={handleDeleteInvoice}
      />

      <BatchImportModal
        batchModalOpen={batchModalOpen}
        setBatchModalOpen={setBatchModalOpen}
        isBatchProcessing={isBatchProcessing}
        batchCountry={batchCountry}
        setBatchCountry={setBatchCountry}
        batchFiles={batchFiles}
        batchProcessedCount={batchProcessedCount}
        batchSuccessCount={batchSuccessCount}
        batchPendingCount={batchPendingCount}
        handleBatchFileSelect={handleBatchFileSelect}
        handleRemoveBatchFile={handleRemoveBatchFile}
        handleClearBatchFiles={handleClearBatchFiles}
        runBatchImport={runBatchImport}
      />

      <FollowUpModal
        followUpModalOpen={followUpModalOpen}
        setFollowUpModalOpen={setFollowUpModalOpen}
        followUpLocation={followUpLocation}
        handleSaveFollowUp={handleSaveFollowUp}
        handleSetFollowUpDatePreset={handleSetFollowUpDatePreset}
        followUpForm={followUpForm}
        setFollowUpForm={setFollowUpForm}
        isSavingFollowUp={isSavingFollowUp}
      />
    </div>
  )
}
