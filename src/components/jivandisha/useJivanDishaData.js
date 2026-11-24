import { useState, useCallback, useEffect } from 'react'
import { API_BASE_URL, LOCAL_STORAGE_KEY } from './jivandishaHelpers'

export function useJivanDishaData() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)
  const [allInvoices, setAllInvoices] = useState([])
  const [loadingAllInvoices, setLoadingAllInvoices] = useState(false)
  const [individualCollectionsCount, setIndividualCollectionsCount] = useState(0)

  const loadLocations = useCallback(async () => {
    setLoading(true)
    let loadedFromApi = false
    try {
      let res = await fetch(`${API_BASE_URL}/locations`)
      if (res.status === 500) {
        try {
          const setupRes = await fetch('http://localhost:3001/api/setup-database')
          if (setupRes.ok) res = await fetch(`${API_BASE_URL}/locations`)
        } catch { /* ignore */ }
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
    } catch { /* backend unreachable */ }

    if (!loadedFromApi) {
      setDbConnected(false)
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        try { setLocations(JSON.parse(cached)) } catch (e) { console.error('Failed to parse cached locations', e) }
      }
    }
    setLoading(false)
  }, [])

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
    } catch { /* backend unreachable */ }

    if (!loadedFromApi) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try { setAllInvoices(JSON.parse(cached)) } catch { setAllInvoices([]) }
      }
    }
    setLoadingAllInvoices(false)
  }, [])

  const loadIndividualCollectionsCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/individual-collections`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.collections)) {
          setIndividualCollectionsCount(data.collections.length)
        }
      }
    } catch { /* backend unreachable */ }
  }, [])

  useEffect(() => {
    loadLocations()
    loadAllInvoices()
    loadIndividualCollectionsCount()
  }, [loadLocations, loadAllInvoices, loadIndividualCollectionsCount])

  const handleToggleInvoicePaymentInList = async (inv) => {
    const updatedStatus = !inv.payment_received
    const updated = allInvoices.map((i) => (i.id === inv.id ? { ...i, payment_received: updatedStatus } : i))
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
      } catch (err) { console.error('Failed to toggle invoice payment:', err) }
    }
  }

  const handleDeleteInvoiceFromList = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice record?')) return
    const updated = allInvoices.filter((i) => i.id !== invoiceId)
    setAllInvoices(updated)
    localStorage.setItem('jivandisha_all_invoices_cache', JSON.stringify(updated))
    if (dbConnected && typeof invoiceId === 'number') {
      try { await fetch(`${API_BASE_URL}/invoices/${invoiceId}`, { method: 'DELETE' }) } catch (err) { console.error('Failed to delete invoice:', err) }
    }
  }

  const handleDeleteLocation = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return
    setLocations((prev) => {
      const updatedList = prev.filter((loc) => loc.id !== id)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))
      return updatedList
    })
    try { await fetch(`${API_BASE_URL}/locations/${id}`, { method: 'DELETE' }) } catch (err) { console.warn('Could not delete on server:', err) }
  }, [])

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(locations, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `jivandisha_locations_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return {
    locations, setLocations, loading, dbConnected, allInvoices, loadingAllInvoices,
    individualCollectionsCount, setIndividualCollectionsCount, loadLocations, loadAllInvoices,
    loadIndividualCollectionsCount, handleToggleInvoicePaymentInList, handleDeleteInvoiceFromList,
    handleDeleteLocation, handleExportJSON
  }
}
