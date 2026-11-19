import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './JivanDisha.css'
import { searchLocalCities, fetchRemoteCities } from '../utils/cityData'

const API_BASE_URL = 'http://localhost:3001/api/jivandisha'
const LOCAL_STORAGE_KEY = 'jivandisha_locations_backup'

// Helper to escape HTML in Leaflet popups
function escapeHtml(text) {
  if (text === null || text === undefined) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Helper to construct link to access retained invoice PDFs
function getPdfViewUrl(url) {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const clean = url.startsWith('/') ? url : `/${url}`
  return `http://localhost:3001${clean}`
}

async function uploadInvoicePdf(file, country) {
  const maxFileSize = 50 * 1024 * 1024
  if (file.size > maxFileSize) {
    throw new Error('PDF is too large. The maximum file size is 50 MB.')
  }

  const response = await fetch(`${API_BASE_URL}/upload-invoice-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf',
      'X-File-Name': encodeURIComponent(file.name),
      'X-Country': country || 'IN'
    },
    body: file
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: (await response.text()).slice(0, 100) }

  if (!response.ok || !data.success) {
    throw new Error(data.message || `PDF upload failed with HTTP ${response.status}.`)
  }

  return data
}

// Create custom pin icon based on payment status
function createCustomPinIcon(isPaid) {
  const bgColor = isPaid ? '#059669' : '#d97706' // Emerald Green for Paid, Amber for Pending
  const iconSymbol = isPaid ? '✓' : '📖'

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div class="pin-marker" style="background-color: ${bgColor};">
        <span class="pin-inner-icon">${iconSymbol}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  })
}

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
  const [pdfStatusMsg, setPdfStatusMsg] = useState(null) // { type: 'info'|'success'|'error', text: '' }

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

  // Batch Import Multiple PDFs State
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchCountry, setBatchCountry] = useState('IN')
  const [batchFiles, setBatchFiles] = useState([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProcessedCount, setBatchProcessedCount] = useState(0)

  // City Autocomplete State
  const [citySuggestions, setCitySuggestions] = useState([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [isSearchingCity, setIsSearchingCity] = useState(false)
  const cityInputRef = useRef(null)
  const cityDebounceRef = useRef(null)

  // Map DOM refs & Leaflet map instances
  const indiaContainerRef = useRef(null)
  const usaContainerRef = useRef(null)
  const indiaMapInstance = useRef(null)
  const usaMapInstance = useRef(null)
  const markersRef = useRef({ IN: {}, US: {} }) // map location id -> L.marker

  // Load locations from API or LocalStorage
  const loadLocations = useCallback(async () => {
    setLoading(true)
    let loadedFromApi = false

    try {
      let res = await fetch(`${API_BASE_URL}/locations`)

      // If database not initialized yet (status 500), trigger setup-database and retry once
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
      } else if (res.status === 404) {
        console.warn(
          'Backend server returned 404 on /api/jivandisha/locations. Please stop and restart `node server.cjs` to load newly added routes.'
        )
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

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

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
        // Fallback default initial invoice from location data if present
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
  }, [])

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

  // Map click: opens modal and attempts reverse geocoding
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

    // Reverse geocode via Nominatim to prefill city and state
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
  }, [])

  // Handle city input typing with autocomplete
  const handleCityChange = (e) => {
    const query = e.target.value
    setFormData((prev) => ({ ...prev, city: query }))

    if (!query.trim()) {
      setCitySuggestions([])
      setShowCityDropdown(false)
      return
    }

    // 1. Instant local matches
    const localMatches = searchLocalCities(query, formData.country)
    setCitySuggestions(localMatches)
    setShowCityDropdown(true)

    // 2. Debounced remote Nominatim search for any missing town
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    cityDebounceRef.current = setTimeout(async () => {
      setIsSearchingCity(true)
      try {
        const remoteMatches = await fetchRemoteCities(query, formData.country)
        if (remoteMatches.length > 0) {
          setCitySuggestions((prev) => {
            const seen = new Set(prev.map((c) => c.city.toLowerCase()))
            const combined = [...prev]
            remoteMatches.forEach((r) => {
              if (!seen.has(r.city.toLowerCase())) {
                seen.add(r.city.toLowerCase())
                combined.push(r)
              }
            })
            return combined.slice(0, 8)
          })
        }
      } finally {
        setIsSearchingCity(false)
      }
    }, 350)
  }

  // Handle selecting a city from autocomplete: auto-populates City, State, and Lat/Lng!
  const handleSelectCitySuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      city: suggestion.city,
      state: suggestion.state || prev.state,
      lat: suggestion.lat ? parseFloat(suggestion.lat.toFixed(5)) : prev.lat,
      lng: suggestion.lng ? parseFloat(suggestion.lng.toFixed(5)) : prev.lng
    }))
    setCitySuggestions([])
    setShowCityDropdown(false)
  }

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

      // If remote geocoding is needed for lat/lng
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

  // Handle selecting multiple PDF files for batch import
  const handleBatchFileSelect = (e) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    )
    if (selected.length === 0) return

    const newItems = selected.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${file.name}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending', // 'pending' | 'processing' | 'success' | 'error'
      result: null,
      error: null
    }))
    setBatchFiles((prev) => [...prev, ...newItems])
    if (e.target) e.target.value = ''
  }

  // Remove a single file from the batch list
  const handleRemoveBatchFile = (id) => {
    if (isBatchProcessing) return
    setBatchFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Clear all files from batch list
  const handleClearBatchFiles = () => {
    if (isBatchProcessing) return
    setBatchFiles([])
    setBatchProcessedCount(0)
  }

  // Execute batch import: upload & parse each PDF, resolve coordinates, and add as new location
  const runBatchImport = async () => {
    if (batchFiles.length === 0 || isBatchProcessing) return

    setIsBatchProcessing(true)
    const newlyAdded = []

    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i]
      if (item.status === 'success') continue

      // Mark current item as processing
      setBatchFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processing', error: null } : f))
      )

      try {
        const uploadRes = await uploadInvoicePdf(item.file, batchCountry)
        const ext = uploadRes.extracted || {}

        // Resolve coordinates and state
        let lat = null
        let lng = null
        let detectedState = ext.state || ''

        if (ext.city) {
          const localCity = searchLocalCities(ext.city, ext.country || batchCountry)?.[0]
          if (localCity && localCity.lat && localCity.lng) {
            lat = parseFloat(localCity.lat.toFixed(5))
            lng = parseFloat(localCity.lng.toFixed(5))
            if (!detectedState && localCity.state) detectedState = localCity.state
          } else {
            try {
              const remotes = await fetchRemoteCities(ext.city, ext.country || batchCountry)
              if (remotes.length > 0 && remotes[0].lat && remotes[0].lng) {
                lat = parseFloat(remotes[0].lat.toFixed(5))
                lng = parseFloat(remotes[0].lng.toFixed(5))
                if (!detectedState && remotes[0].state) detectedState = remotes[0].state
              }
            } catch {
              // ignore Nominatim errors
            }
          }
        }

        // Fallback default coordinates if not geocoded
        if (lat === null || lng === null) {
          const isIndia = (ext.country || batchCountry) === 'IN'
          const baseLat = isIndia ? 20.5937 : 37.0902
          const baseLng = isIndia ? 78.9629 : -95.7129
          const jitter = (Math.random() - 0.5) * 1.5
          lat = parseFloat((baseLat + jitter).toFixed(5))
          lng = parseFloat((baseLng + jitter).toFixed(5))
        }

        const locationTitle =
          ext.title || item.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')

        const payload = {
          country: ext.country || batchCountry,
          title: locationTitle,
          category: 'General',
          lat,
          lng,
          city: ext.city || '',
          state: detectedState || '',
          address: ext.address || '',
          notes: ext.notes || `Imported from ${item.name}`,
          books_sent: parseInt(ext.books_sent, 10) || 0,
          invoice_date: ext.invoice_date || new Date().toISOString().slice(0, 10),
          invoice_number: ext.invoice_number || '',
          amount: ext.amount ? parseFloat(ext.amount) : null,
          payment_received: Boolean(ext.payment_received),
          decision_maker_name: ext.decision_maker_name || '',
          decision_maker_phone: ext.decision_maker_phone || '',
          inventory_keeper_name: ext.inventory_keeper_name || '',
          inventory_keeper_phone: ext.inventory_keeper_phone || '',
          invoice_pdf_url: uploadRes.pdfUrl,
          invoice_pdf_name: uploadRes.pdfFilename,
          contact_email: ext.contact_email || ''
        }

        let createdLocation = null
        if (dbConnected) {
          try {
            const res = await fetch(`${API_BASE_URL}/locations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            const resData = await res.json()
            if (resData.success && resData.location) {
              createdLocation = resData.location
            }
          } catch (dbErr) {
            console.error('Failed to save location to database during batch import:', dbErr)
          }
        }

        if (!createdLocation) {
          createdLocation = { ...payload, id: Date.now() + Math.floor(Math.random() * 1000) }
        }

        newlyAdded.push(createdLocation)

        setBatchFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'success',
                  result: {
                    title: locationTitle,
                    city: ext.city || '',
                    state: detectedState || '',
                    books_sent: payload.books_sent,
                    invoice_number: payload.invoice_number,
                    amount: payload.amount,
                    pdfUrl: uploadRes.pdfUrl
                  }
                }
              : f
          )
        )
      } catch (err) {
        console.error(`Batch import error for ${item.name}:`, err)
        setBatchFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'error',
                  error: err.message || 'Failed to parse/import PDF'
                }
              : f
          )
        )
      }

      setBatchProcessedCount(i + 1)
    }

    if (newlyAdded.length > 0) {
      setLocations((prev) => {
        const combined = [...newlyAdded, ...prev]
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined))
        return combined
      })
    }

    setIsBatchProcessing(false)
  }

  // Derived batch counters
  const batchPendingCount = batchFiles.filter((f) => f.status === 'pending').length
  const batchSuccessCount = batchFiles.filter((f) => f.status === 'success').length

  // Initialize India Leaflet Map
  useEffect(() => {
    if (!indiaContainerRef.current || indiaMapInstance.current) return

    const indiaMap = L.map(indiaContainerRef.current, {
      center: [22.8, 79.5],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(indiaMap)

    indiaMap.on('click', (e) => {
      handleMapClick('IN', e.latlng.lat, e.latlng.lng)
    })

    indiaMapInstance.current = indiaMap

    return () => {
      indiaMap.remove()
      indiaMapInstance.current = null
    }
  }, [handleMapClick])

  // Initialize USA Leaflet Map
  useEffect(() => {
    if (!usaContainerRef.current || usaMapInstance.current) return

    const usaMap = L.map(usaContainerRef.current, {
      center: [39.5, -98.35],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: true
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(usaMap)

    usaMap.on('click', (e) => {
      handleMapClick('US', e.latlng.lat, e.latlng.lng)
    })

    usaMapInstance.current = usaMap

    return () => {
      usaMap.remove()
      usaMapInstance.current = null
    }
  }, [handleMapClick])

  // Invalidate map sizes on view mode or sidebar toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (indiaMapInstance.current) indiaMapInstance.current.invalidateSize()
      if (usaMapInstance.current) usaMapInstance.current.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [viewMode, sidebarOpen])

  // Render / Refresh markers on maps whenever locations change
  useEffect(() => {
    // Clear existing markers
    Object.values(markersRef.current.IN).forEach((marker) => marker.remove())
    Object.values(markersRef.current.US).forEach((marker) => marker.remove())
    markersRef.current = { IN: {}, US: {} }

    locations.forEach((loc) => {
      const country = loc.country === 'US' ? 'US' : 'IN'
      const map = country === 'US' ? usaMapInstance.current : indiaMapInstance.current
      if (!map) return

      const isPaid = Boolean(loc.payment_received)
      const icon = createCustomPinIcon(isPaid)
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map)

      // Bind rich popup with contacts and history link
      const popupDiv = document.createElement('div')
      popupDiv.className = 'jd-leaflet-popup'
      popupDiv.innerHTML = `
        <div style="margin-bottom:6px;">
          <span class="jd-metric-badge ${isPaid ? 'paid' : 'pending'}">
            ${isPaid ? '✅ Payment Received' : '⏳ Payment Pending'}
          </span>
        </div>
        <h4 class="jd-popup-title">${escapeHtml(loc.title)}</h4>
        <div class="jd-popup-loc">📍 ${escapeHtml([loc.city, loc.state].filter(Boolean).join(', ') || 'Lat: ' + loc.lat + ', Lng: ' + loc.lng)}</div>
        ${loc.address ? `<div style="font-size:0.72rem; color:#64748b; margin-bottom:4px;">${escapeHtml(loc.address)}</div>` : ''}
        
        <div class="jd-loc-metrics-row">
          <span class="jd-metric-badge books">📦 Books Sent: <strong>${escapeHtml(loc.books_sent || 0)}</strong></span>
          ${loc.invoice_date ? `<span class="jd-metric-badge date">📅 Invoiced: <strong>${escapeHtml(loc.invoice_date)}</strong></span>` : ''}
        </div>

        ${
          loc.invoice_pdf_url
            ? `<div class="jd-popup-pdf-box">
                <a href="${escapeHtml(getPdfViewUrl(loc.invoice_pdf_url))}" target="_blank" rel="noopener noreferrer" class="jd-popup-pdf-link">
                  📄 View Invoice PDF ${loc.invoice_pdf_name ? '<small>(' + escapeHtml(loc.invoice_pdf_name) + ')</small>' : ''}
                </a>
              </div>`
            : ''
        }

        ${loc.notes ? `<div class="jd-popup-notes"><strong>Notes:</strong><br>${escapeHtml(loc.notes)}</div>` : ''}
        
        <div class="jd-popup-contacts">
          ${
            loc.decision_maker_name || loc.decision_maker_phone
              ? `<div>👔 <strong>Decision Maker:</strong> ${escapeHtml(loc.decision_maker_name)} ${loc.decision_maker_phone ? '<small>(' + escapeHtml(loc.decision_maker_phone) + ')</small>' : ''}</div>`
              : ''
          }
          ${
            loc.inventory_keeper_name || loc.inventory_keeper_phone
              ? `<div>📦 <strong>Inventory Keeper:</strong> ${escapeHtml(loc.inventory_keeper_name)} ${loc.inventory_keeper_phone ? '<small>(' + escapeHtml(loc.inventory_keeper_phone) + ')</small>' : ''}</div>`
              : ''
          }
          ${loc.contact_email ? `<div>✉️ ${escapeHtml(loc.contact_email)}</div>` : ''}
          ${loc.website ? `<div>🌐 <a href="${escapeHtml(loc.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(loc.website)}</a></div>` : ''}
        </div>

        <div class="jd-popup-actions">
          <button class="jd-popup-btn history" id="btn-hist-${loc.id}">📜 History</button>
          <button class="jd-popup-btn edit" id="btn-edit-${loc.id}">✏️ Edit</button>
          <button class="jd-popup-btn del" id="btn-del-${loc.id}">🗑️ Delete</button>
        </div>
      `

      // Connect popup action buttons
      marker.bindPopup(popupDiv)
      marker.on('popupopen', () => {
        const histBtn = document.getElementById(`btn-hist-${loc.id}`)
        const editBtn = document.getElementById(`btn-edit-${loc.id}`)
        const delBtn = document.getElementById(`btn-del-${loc.id}`)

        if (histBtn) {
          histBtn.onclick = () => {
            handleOpenHistory(loc)
            marker.closePopup()
          }
        }
        if (editBtn) {
          editBtn.onclick = () => {
            handleOpenEdit(loc)
            marker.closePopup()
          }
        }
        if (delBtn) {
          delBtn.onclick = () => {
            handleDeleteLocation(loc.id)
            marker.closePopup()
          }
        }
      })

      markersRef.current[country][loc.id] = marker
    })
  }, [locations, handleDeleteLocation, handleOpenEdit, handleOpenHistory])

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
      // Update existing
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
      // Create new
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

    // Update location total books in locations state
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

    // Reset add invoice form
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
      } catch (err) {
        console.error('Failed to update invoice payment status:', err)
      }
    }
  }

  // Delete an invoice from history
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Delete this invoice entry?')) return
    const locId = selectedLocationForHistory?.id
    const cacheKey = `jivandisha_invoices_${locId}`

    const updated = invoices.filter((i) => i.id !== invoiceId)
    setInvoices(updated)
    localStorage.setItem(cacheKey, JSON.stringify(updated))

    // Recompute total books
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

  // Jump to marker from sidebar
  const handleFocusLocation = (loc) => {
    const country = loc.country === 'US' ? 'US' : 'IN'
    const map = country === 'US' ? usaMapInstance.current : indiaMapInstance.current
    if (!map) return

    map.setView([loc.lat, loc.lng], 9, { animate: true })
    const marker = markersRef.current[country]?.[loc.id]
    if (marker) {
      setTimeout(() => marker.openPopup(), 350)
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

  return (
    <div className="jivandisha-container">
      {/* Top Header */}
      <header className="jd-header">
        <div className="jd-brand">
          <div className="jd-logo-badge">JD</div>
          <div className="jd-title-group">
            <h1>
              JivanDisha
              <span className={`jd-status-badge ${dbConnected ? 'online' : 'local'}`}>
                {dbConnected ? '🟢 MySQL Connected' : '🟠 Local Offline Mode'}
              </span>
            </h1>
            <p className="jd-subtitle">
              Book Orders & Operations Map • 📚 Total Books Sent: {totalBooks}
            </p>
          </div>
        </div>

        <div className="jd-header-actions">
          {/* View mode switcher */}
          <div className="jd-view-mode-group">
            <button
              className={`jd-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
              title="View India & USA side-by-side"
            >
              Side-by-Side
            </button>
            <button
              className={`jd-mode-btn ${viewMode === 'focus-india' ? 'active' : ''}`}
              onClick={() => setViewMode('focus-india')}
              title="Focus on India"
            >
              🇮🇳 India
            </button>
            <button
              className={`jd-mode-btn ${viewMode === 'focus-usa' ? 'active' : ''}`}
              onClick={() => setViewMode('focus-usa')}
              title="Focus on USA"
            >
              🇺🇸 USA
            </button>
          </div>

          {/* Add Pin Manually Button */}
          <button
            className="jd-btn primary"
            onClick={() => {
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
          >
            + Add Location
          </button>

          {/* Import Multiple PDFs Button */}
          <button
            className="jd-btn jd-btn-batch-import"
            onClick={() => setBatchModalOpen(true)}
            title="Import multiple invoice PDFs to create multiple locations at once"
          >
            📑 Import Multiple PDFs
          </button>

          {/* Export JSON */}
          <button className="jd-btn" onClick={handleExportJSON} title="Download JSON backup">
            💾 Export JSON
          </button>

          {/* Toggle Sidebar */}
          <button
            className="jd-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Locations Sidebar"
          >
            {sidebarOpen ? 'Hide List ❯' : '❮ Show List'}
          </button>

          {/* Back to Calendar */}
          <button className="jd-btn nav-back" onClick={() => navigate('/')}>
            ← Calendar
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="jd-workspace">
        {/* Maps Section */}
        <div className={`jd-maps-container ${viewMode}`}>
          {/* India Map Card */}
          <div className="jd-map-card india">
            <div className="jd-map-card-header">
              <div className="jd-map-card-title">
                <span>🇮🇳 India Operations</span>
                <span className="jd-map-count-badge">{indiaCount} points</span>
              </div>
              <div className="jd-map-hint">
                <span>💡 Click anywhere on map to add location</span>
              </div>
            </div>
            <div ref={indiaContainerRef} className="jd-map-view" />
          </div>

          {/* USA Map Card */}
          <div className="jd-map-card usa">
            <div className="jd-map-card-header">
              <div className="jd-map-card-title">
                <span>🇺🇸 USA Operations</span>
                <span className="jd-map-count-badge">{usaCount} points</span>
              </div>
              <div className="jd-map-hint">
                <span>💡 Click anywhere on map to add location</span>
              </div>
            </div>
            <div ref={usaContainerRef} className="jd-map-view" />
          </div>
        </div>

        {/* Collapsible Sidebar of Locations */}
        <aside className={`jd-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="jd-sidebar-header">
            <h2>Locations ({filteredLocations.length})</h2>
            <button className="jd-btn" onClick={() => loadLocations()} title="Refresh data">
              🔄
            </button>
          </div>

          {/* Search & Filters */}
          <div className="jd-sidebar-search">
            <input
              type="text"
              className="jd-search-input"
              placeholder="🔍 Search title, city, contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="jd-filter-row">
              <select
                className="jd-select"
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <option value="ALL">All Countries</option>
                <option value="IN">🇮🇳 India</option>
                <option value="US">🇺🇸 USA</option>
              </select>

              <select
                className="jd-select"
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">✅ Paid</option>
                <option value="PENDING">⏳ Payment Pending</option>
              </select>
            </div>
          </div>

          {/* Location Cards List */}
          <div className="jd-sidebar-list">
            {loading ? (
              <div className="jd-empty-list">Loading locations...</div>
            ) : filteredLocations.length === 0 ? (
              <div className="jd-empty-list">
                No locations match your filter.
                <br />
                <small>Click on either map to place your first pin!</small>
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const isPaid = Boolean(loc.payment_received)
                return (
                  <div
                    key={loc.id}
                    className="jd-location-item"
                    onClick={() => handleFocusLocation(loc)}
                  >
                    <div className="jd-loc-item-header">
                      <span className="jd-loc-title">{loc.title}</span>
                      <span className="jd-loc-country">{loc.country === 'US' ? '🇺🇸' : '🇮🇳'}</span>
                    </div>

                    {(loc.city || loc.state) && (
                      <div className="jd-loc-city">
                        📍 {[loc.city, loc.state].filter(Boolean).join(', ')}
                      </div>
                    )}

                    <div className="jd-loc-metrics-row">
                      <span className={`jd-metric-badge ${isPaid ? 'paid' : 'pending'}`}>
                        {isPaid ? '✅ Paid' : '⏳ Pending'}
                      </span>
                      <span className="jd-metric-badge books">
                        📦 {loc.books_sent || 0} books
                      </span>
                      {loc.invoice_date && (
                        <span className="jd-metric-badge date">
                          📅 {loc.invoice_date}
                        </span>
                      )}
                      {loc.invoice_pdf_url && (
                        <span className="jd-metric-badge pdf" title="Invoice PDF permanently retained">
                          📄 PDF
                        </span>
                      )}
                    </div>

                    {/* Contacts summary */}
                    {(loc.decision_maker_name || loc.inventory_keeper_name) && (
                      <div style={{ fontSize: '0.72rem', color: '#475569', margin: '4px 0' }}>
                        {loc.decision_maker_name && <div>👔 {loc.decision_maker_name}</div>}
                        {loc.inventory_keeper_name && <div>📦 {loc.inventory_keeper_name}</div>}
                      </div>
                    )}

                    {loc.notes && <div className="jd-loc-notes">{loc.notes}</div>}

                    <div className="jd-loc-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="jd-loc-action-btn history"
                        onClick={() => handleOpenHistory(loc)}
                        title="View invoice history"
                      >
                        📜 History
                      </button>
                      <button
                        className="jd-loc-action-btn"
                        onClick={() => handleFocusLocation(loc)}
                      >
                        🎯 Jump
                      </button>
                      <button
                        className="jd-loc-action-btn"
                        onClick={() => handleOpenEdit(loc)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="jd-loc-action-btn delete"
                        onClick={() => handleDeleteLocation(loc.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>
      </div>

      {/* Modal Dialog 1: Add / Edit Location Details */}
      {modalOpen && (
        <div className="jd-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="jd-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="jd-modal-header">
              <h3>
                {editingLocation ? '✏️ Edit Location Details' : '📍 Add New Location Details'}
              </h3>
              <button className="jd-modal-close" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveLocation}>
              <div className="jd-modal-body">
                {/* PDF Invoice Upload & Extraction Card */}
                <div className="jd-pdf-upload-card">
                  <div className="jd-pdf-card-header">
                    <div className="jd-pdf-card-title-group">
                      <span className="jd-pdf-badge-icon">📄</span>
                      <div>
                        <div className="jd-pdf-title-text">
                          Invoice PDF Auto-Read & Permanent Retention
                        </div>
                        <div className="jd-pdf-desc-text">
                          Upload invoice PDF to extract books sent, date, contacts & city automatically. File is retained permanently.
                        </div>
                      </div>
                    </div>

                    {formData.invoice_pdf_url && (
                      <div className="jd-pdf-actions-cluster">
                        <a
                          href={getPdfViewUrl(formData.invoice_pdf_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jd-pdf-btn-view"
                        >
                          👁️ View PDF
                        </a>
                        <button
                          type="button"
                          className="jd-pdf-btn-remove"
                          onClick={handleRemovePdf}
                          title="Remove PDF"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {!formData.invoice_pdf_url ? (
                    <div className="jd-pdf-dropzone">
                      <label className={`jd-pdf-file-picker ${uploadingPdf ? 'loading' : ''}`}>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onClick={(e) => {
                            e.target.value = null
                          }}
                          onChange={handlePdfUpload}
                          disabled={uploadingPdf}
                          style={{ display: 'none' }}
                        />
                        {uploadingPdf ? '⏳ Reading & Parsing PDF...' : '📂 Choose Invoice PDF to Auto-Fill'}
                      </label>
                      <span className="jd-pdf-subhint">
                        PDF will be saved permanently on server and accessible from invoice history
                      </span>
                      <div style={{ marginTop: '4px' }}>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366f1',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 600,
                            padding: 0
                          }}
                          onClick={() => {
                            setModalOpen(false)
                            setBatchModalOpen(true)
                          }}
                        >
                          📑 Have several invoices? Switch to Batch PDF Import ❯
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="jd-pdf-attached-bar">
                      <span className="jd-pdf-retained-chip">🔒 Retained</span>
                      <span className="jd-pdf-file-name">{formData.invoice_pdf_name || 'Invoice.pdf'}</span>
                    </div>
                  )}

                  {pdfStatusMsg && (
                    <div className={`jd-pdf-status-alert ${pdfStatusMsg.type}`}>
                      {pdfStatusMsg.type === 'info' && '⏳ '}
                      {pdfStatusMsg.type === 'success' && '✨ '}
                      {pdfStatusMsg.type === 'error' && '⚠️ '}
                      {pdfStatusMsg.text}
                    </div>
                  )}
                </div>

                {/* 2-Column Grid Row 1: Country & Title */}
                <div className="jd-form-grid-2">
                  <div className="jd-form-row-h">
                    <label>Country *</label>
                    <div className="jd-form-input-box">
                      <select
                        value={formData.country}
                        onChange={(e) => {
                          const newCountry = e.target.value
                          setFormData({ ...formData, country: newCountry })
                          setCitySuggestions([])
                          setShowCityDropdown(false)
                        }}
                      >
                        <option value="IN">🇮🇳 India</option>
                        <option value="US">🇺🇸 USA</option>
                      </select>
                    </div>
                  </div>

                  <div className="jd-form-row-h">
                    <label>Title / Business *</label>
                    <div className="jd-form-input-box">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sapna Book House / NYC Barnes & Noble"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 2: City & State */}
                <div className="jd-form-grid-2">
                  <div className="jd-form-row-h">
                    <label>
                      City * {isSearchingCity && <span className="jd-form-hint">(...)</span>}
                    </label>
                    <div className="jd-form-input-box jd-autocomplete-wrapper">
                      <input
                        ref={cityInputRef}
                        type="text"
                        required
                        placeholder="Type city (e.g. Mumbai, New York)"
                        value={formData.city}
                        onChange={handleCityChange}
                        onFocus={() => {
                          if (citySuggestions.length > 0) setShowCityDropdown(true)
                        }}
                        autoComplete="off"
                      />

                      {/* Autocomplete Dropdown List */}
                      {showCityDropdown && citySuggestions.length > 0 && (
                        <ul className="jd-autocomplete-dropdown">
                          {citySuggestions.map((item, idx) => (
                            <li
                              key={idx}
                              className="jd-autocomplete-item"
                              onMouseDown={() => handleSelectCitySuggestion(item)}
                            >
                              <span className="jd-ac-city">🏙️ {item.city}</span>
                              {item.state && <span className="jd-ac-state">{item.state}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="jd-form-row-h">
                    <label>State / Region</label>
                    <div className="jd-form-input-box">
                      <input
                        type="text"
                        placeholder="Auto-populated from city"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Contacts Section: Horizontal layout */}
                <div className="jd-contacts-section">
                  <div className="jd-form-row-h">
                    <label>👔 Decision Maker</label>
                    <div className="jd-form-input-box">
                      <input
                        type="text"
                        placeholder="Name (e.g. Ramesh Sharma)"
                        value={formData.decision_maker_name}
                        onChange={(e) =>
                          setFormData({ ...formData, decision_maker_name: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Phone (e.g. +91 98765 12345)"
                        value={formData.decision_maker_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, decision_maker_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="jd-form-row-h">
                    <label>📦 Inventory Keeper</label>
                    <div className="jd-form-input-box">
                      <input
                        type="text"
                        placeholder="Name (e.g. Suresh Patel)"
                        value={formData.inventory_keeper_name}
                        onChange={(e) =>
                          setFormData({ ...formData, inventory_keeper_name: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Phone (e.g. +91 98765 67890)"
                        value={formData.inventory_keeper_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, inventory_keeper_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 3: Invoice # & Invoiced Date */}
                <div className="jd-form-grid-2">
                  <div className="jd-form-row-h">
                    <label>Invoice #</label>
                    <div className="jd-form-input-box">
                      <input
                        type="text"
                        placeholder="e.g. JD20260611002"
                        value={formData.invoice_number || ''}
                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="jd-form-row-h">
                    <label>Date Invoiced</label>
                    <div className="jd-form-input-box">
                      <input
                        type="date"
                        value={formData.invoice_date}
                        onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 4: Books Sent & Payment Status */}
                <div className="jd-form-grid-2">
                  <div className="jd-form-row-h">
                    <label>Books Sent</label>
                    <div className="jd-form-input-box">
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 100"
                        value={formData.books_sent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            books_sent: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="jd-form-row-h">
                    <label>Payment Status</label>
                    <div className="jd-form-input-box">
                      <div
                        className={`jd-checkbox-card ${formData.payment_received ? 'checked' : ''}`}
                        style={{ width: '100%', padding: '6px 10px' }}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, payment_received: !prev.payment_received }))
                        }
                      >
                        <input
                          type="checkbox"
                          checked={formData.payment_received}
                          onChange={(e) =>
                            setFormData({ ...formData, payment_received: e.target.checked })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="jd-checkbox-info">
                          <span className="jd-checkbox-title">
                            {formData.payment_received ? '✅ Payment Received' : '⏳ Payment Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 5: Street Address & Email */}
                <div className="jd-form-grid-2">
                  <div className="jd-form-row-h">
                    <label>Street Address</label>
                    <div className="jd-form-input-box">
                      <input
                        type="text"
                        placeholder="e.g. 5th Main Road, Gandhi Nagar"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="jd-form-row-h">
                    <label>Email Address</label>
                    <div className="jd-form-input-box">
                      <input
                        type="email"
                        placeholder="info@bookstore.com"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid Row 6: Coordinates */}
                <div className="jd-form-grid-2">
                  <div className="jd-form-row-h">
                    <label>Coordinates *</label>
                    <div className="jd-form-input-box">
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Lat"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        title="Latitude"
                      />
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Lng"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        title="Longitude"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Width Row: Business Notes */}
                <div className="jd-form-row-h top-align">
                  <label>Business Notes</label>
                  <div className="jd-form-input-box">
                    <textarea
                      placeholder="Tracking number, shipment courier, distributor terms, manager notes, etc."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="jd-modal-footer">
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="jd-btn primary">
                  {editingLocation ? 'Save Changes' : 'Add Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog 2: Past Invoices History Modal */}
      {historyModalOpen && selectedLocationForHistory && (
        <div className="jd-modal-overlay" onClick={() => setHistoryModalOpen(false)}>
          <div
            className="jd-modal-card jd-history-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jd-modal-header">
              <div>
                <h3>📜 Past Invoices & Shipments</h3>
                <p className="jd-subtitle" style={{ marginTop: '2px' }}>
                  {selectedLocationForHistory.title} • 📍{' '}
                  {[selectedLocationForHistory.city, selectedLocationForHistory.state]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <button
                className="jd-modal-close"
                onClick={() => setHistoryModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="jd-modal-body">
              {/* Summary Stats */}
              <div className="jd-history-summary-grid">
                <div className="jd-history-stat-card">
                  <div className="jd-stat-number">{invoices.length}</div>
                  <div className="jd-stat-label">Total Invoices</div>
                </div>
                <div className="jd-history-stat-card">
                  <div className="jd-stat-number">{historyTotalBooks}</div>
                  <div className="jd-stat-label">Total Books Sent</div>
                </div>
                <div className="jd-history-stat-card">
                  <div className="jd-stat-number">
                    {historyPaidCount} / {invoices.length}
                  </div>
                  <div className="jd-stat-label">Paid Invoices</div>
                </div>
              </div>

              {/* Add New Invoice Box */}
              <div className="jd-add-invoice-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0 }}>➕ Record New Invoice / Shipment</h4>
                  <label className={`jd-history-upload-btn ${uploadingHistoryPdf ? 'loading' : ''}`} title="Upload invoice PDF to auto-fill and retain">
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onClick={(e) => {
                        e.target.value = null
                      }}
                      onChange={handleHistoryPdfUpload}
                      disabled={uploadingHistoryPdf}
                      style={{ display: 'none' }}
                    />
                    {uploadingHistoryPdf ? '⏳ Reading PDF...' : newInvoiceData.pdf_url ? `✅ ${newInvoiceData.pdf_name || 'PDF Attached'}` : '📄 Attach / Auto-Read PDF'}
                  </label>
                </div>
                <form onSubmit={handleAddNewInvoice}>
                  <div className="jd-add-inv-row">
                    <div className="jd-form-group" style={{ minWidth: '120px' }}>
                      <label>Invoice Date *</label>
                      <input
                        type="date"
                        required
                        value={newInvoiceData.invoice_date}
                        onChange={(e) =>
                          setNewInvoiceData({ ...newInvoiceData, invoice_date: e.target.value })
                        }
                      />
                    </div>

                    <div className="jd-form-group" style={{ minWidth: '100px' }}>
                      <label>Books Sent *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        value={newInvoiceData.books_sent || ''}
                        onChange={(e) =>
                          setNewInvoiceData({
                            ...newInvoiceData,
                            books_sent: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0
                          })
                        }
                      />
                    </div>

                    <div className="jd-form-group" style={{ minWidth: '110px' }}>
                      <label>Invoice # / Ref</label>
                      <input
                        type="text"
                        placeholder="INV-001"
                        value={newInvoiceData.invoice_number}
                        onChange={(e) =>
                          setNewInvoiceData({ ...newInvoiceData, invoice_number: e.target.value })
                        }
                      />
                    </div>

                    <div className="jd-form-group" style={{ minWidth: '140px' }}>
                      <label>Notes</label>
                      <input
                        type="text"
                        placeholder="Courier / notes"
                        value={newInvoiceData.notes}
                        onChange={(e) =>
                          setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })
                        }
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newInvoiceData.payment_received}
                          onChange={(e) =>
                            setNewInvoiceData({
                              ...newInvoiceData,
                              payment_received: e.target.checked
                            })
                          }
                        />
                        Paid
                      </label>
                    </div>

                    <button type="submit" className="jd-btn primary" style={{ height: '34px' }}>
                      + Add Invoice
                    </button>
                  </div>
                </form>
              </div>

              {/* Invoices List / Table */}
              <div className="jd-history-table-wrapper">
                {loadingInvoices ? (
                  <div className="jd-empty-history">Loading invoice history...</div>
                ) : invoices.length === 0 ? (
                  <div className="jd-empty-history">
                    No past invoices recorded yet for this location.
                    <br />
                    <small>Use the form above to add your first invoice!</small>
                  </div>
                ) : (
                  <table className="jd-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Invoice #</th>
                        <th>Books Sent</th>
                        <th>Status</th>
                        <th>PDF Invoice</th>
                        <th>Notes</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><strong>{inv.invoice_date || 'N/A'}</strong></td>
                          <td>{inv.invoice_number || '—'}</td>
                          <td>
                            <span className="jd-metric-badge books">
                              📦 {inv.books_sent || 0}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`jd-metric-badge ${
                                inv.payment_received ? 'paid' : 'pending'
                              }`}
                            >
                              {inv.payment_received ? '✅ Paid' : '⏳ Pending'}
                            </span>
                          </td>
                          <td>
                            {inv.pdf_url ? (
                              <a
                                href={getPdfViewUrl(inv.pdf_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="jd-table-pdf-link"
                                title={`Open ${inv.pdf_name || 'Invoice PDF'}`}
                              >
                                📄 View PDF
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {inv.notes || '—'}
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              className={`jd-table-btn ${
                                inv.payment_received ? 'toggle-pending' : 'toggle-pay'
                              }`}
                              onClick={() => handleToggleInvoicePayment(inv)}
                              title="Toggle payment status"
                              style={{ marginRight: '6px' }}
                            >
                              {inv.payment_received ? 'Mark Pending' : 'Mark Paid'}
                            </button>
                            <button
                              className="jd-table-btn del"
                              onClick={() => handleDeleteInvoice(inv.id)}
                              title="Delete invoice"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="jd-modal-footer">
              <button
                type="button"
                className="jd-btn"
                onClick={() => setHistoryModalOpen(false)}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog 3: Batch Import Multiple Invoice PDFs Modal */}
      {batchModalOpen && (
        <div
          className="jd-modal-overlay"
          onClick={() => {
            if (!isBatchProcessing) setBatchModalOpen(false)
          }}
        >
          <div
            className="jd-modal-card jd-batch-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="jd-modal-header">
              <div>
                <h3>📑 Batch Import Multiple Invoice PDFs</h3>
                <p className="jd-subtitle" style={{ marginTop: '2px' }}>
                  Upload multiple invoice PDFs. Each invoice will be automatically parsed, retained, and added as a new map location.
                </p>
              </div>
              <button
                className="jd-modal-close"
                onClick={() => {
                  if (!isBatchProcessing) setBatchModalOpen(false)
                }}
                disabled={isBatchProcessing}
                title={isBatchProcessing ? 'Processing in progress...' : 'Close modal'}
              >
                &times;
              </button>
            </div>

            <div className="jd-modal-body">
              {/* Intro Options: Target country and quick instructions */}
              <div className="jd-batch-intro-box">
                <div className="jd-batch-intro-text">
                  ✨ <strong>Automated Location Creation:</strong> Recipient title, city, books sent, date, invoice number, and notes will be extracted from each PDF. City coordinates will be resolved automatically.
                </div>
                <div className="jd-batch-intro-options">
                  <label>Default Country:</label>
                  <select
                    value={batchCountry}
                    onChange={(e) => setBatchCountry(e.target.value)}
                    disabled={isBatchProcessing}
                  >
                    <option value="IN">🇮🇳 India</option>
                    <option value="US">🇺🇸 USA</option>
                  </select>
                </div>
              </div>

              {/* Dropzone for selecting multiple PDFs */}
              <div className="jd-batch-dropzone-area">
                <label className="jd-batch-file-picker-btn">
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,.pdf"
                    onClick={(e) => {
                      e.target.value = null
                    }}
                    onChange={handleBatchFileSelect}
                    disabled={isBatchProcessing}
                    style={{ display: 'none' }}
                  />
                  <span>📂 Choose Multiple Invoice PDFs</span>
                </label>
                <span className="jd-batch-dropzone-subtext">
                  Hold Ctrl (or Shift) to select multiple PDF files at once from your computer
                </span>
              </div>

              {/* Progress Summary Card (visible when files are selected) */}
              {batchFiles.length > 0 && (
                <div className="jd-batch-progress-card">
                  <div className="jd-batch-progress-header">
                    <span>
                      {isBatchProcessing
                        ? `⏳ Processing ${batchProcessedCount + 1} of ${batchFiles.length} files...`
                        : batchSuccessCount > 0
                        ? `🎉 Finished: ${batchSuccessCount} of ${batchFiles.length} locations added`
                        : `${batchFiles.length} PDF file${batchFiles.length > 1 ? 's' : ''} ready to import`}
                    </span>
                    <span>
                      {Math.round((batchSuccessCount / batchFiles.length) * 100)}%
                    </span>
                  </div>
                  <div className="jd-batch-progress-track">
                    <div
                      className="jd-batch-progress-fill"
                      style={{
                        width: `${(batchSuccessCount / batchFiles.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Selected Files List */}
              {batchFiles.length > 0 && (
                <div className="jd-batch-file-list">
                  {batchFiles.map((item) => (
                    <div
                      key={item.id}
                      className={`jd-batch-file-item ${item.status}`}
                    >
                      <div className="jd-batch-file-info">
                        <span className="jd-batch-file-icon">📄</span>
                        <div className="jd-batch-file-names">
                          <span className="jd-batch-filename" title={item.name}>
                            {item.name}
                          </span>
                          <span className="jd-batch-filesize">
                            {(item.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      <div className="jd-batch-file-status">
                        {item.status === 'pending' && (
                          <span className="jd-batch-status-chip pending">
                            ⏳ Ready
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="jd-batch-status-chip processing">
                            🔄 Reading & Locating...
                          </span>
                        )}
                        {item.status === 'success' && item.result && (
                          <>
                            <span className="jd-batch-status-chip success">
                              ✅ Location Added
                            </span>
                            <span
                              className="jd-batch-extracted-chip"
                              title={`${item.result.title} • ${item.result.city} • ${item.result.books_sent} books`}
                            >
                              <strong>{item.result.title}</strong> ({item.result.city || '—'}) • {item.result.books_sent} books
                            </span>
                            {item.result.pdfUrl && (
                              <a
                                href={getPdfViewUrl(item.result.pdfUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="jd-table-pdf-link"
                                title="View retained invoice PDF"
                              >
                                👁️ View
                              </a>
                            )}
                          </>
                        )}
                        {item.status === 'error' && (
                          <span className="jd-batch-status-chip error" title={item.error}>
                            ⚠️ {item.error}
                          </span>
                        )}

                        {!isBatchProcessing && item.status !== 'processing' && (
                          <button
                            type="button"
                            className="jd-pdf-btn-remove"
                            onClick={() => handleRemoveBatchFile(item.id)}
                            title="Remove file"
                            style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="jd-modal-footer" style={{ justifyContent: 'space-between' }}>
              <div>
                {batchFiles.length > 0 && !isBatchProcessing && (
                  <button
                    type="button"
                    className="jd-btn"
                    onClick={handleClearBatchFiles}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="jd-btn"
                  onClick={() => setBatchModalOpen(false)}
                  disabled={isBatchProcessing}
                >
                  {batchSuccessCount > 0 ? 'Close & View on Map' : 'Cancel'}
                </button>

                {batchFiles.length > 0 && !isBatchProcessing && batchPendingCount > 0 && (
                  <button
                    type="button"
                    className="jd-btn primary"
                    onClick={runBatchImport}
                    style={{ background: '#7c3aed', borderColor: '#6d28d9' }}
                  >
                    🚀 Start Batch Import ({batchPendingCount} file{batchPendingCount > 1 ? 's' : ''})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
