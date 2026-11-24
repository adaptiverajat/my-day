import { useState } from 'react'
import { searchLocalCities, fetchRemoteCities } from '../../utils/cityData'
import { API_BASE_URL, LOCAL_STORAGE_KEY, uploadInvoicePdf } from './jivandishaHelpers'

export function useJivanDishaBatch(dbConnected, setLocations) {
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchCountry, setBatchCountry] = useState('IN')
  const [batchFiles, setBatchFiles] = useState([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchProcessedCount, setBatchProcessedCount] = useState(0)

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
      status: 'pending',
      result: null,
      error: null
    }))
    setBatchFiles((prev) => [...prev, ...newItems])
    if (e.target) e.target.value = ''
  }

  const handleRemoveBatchFile = (id) => {
    if (isBatchProcessing) return
    setBatchFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleClearBatchFiles = () => {
    if (isBatchProcessing) return
    setBatchFiles([])
    setBatchProcessedCount(0)
  }

  const runBatchImport = async () => {
    if (batchFiles.length === 0 || isBatchProcessing) return

    setIsBatchProcessing(true)
    const newlyAdded = []

    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i]
      if (item.status === 'success') continue

      setBatchFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processing', error: null } : f))
      )

      try {
        const uploadRes = await uploadInvoicePdf(item.file, batchCountry)
        const ext = uploadRes.extracted || {}

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

  const batchPendingCount = batchFiles.filter((f) => f.status === 'pending').length
  const batchSuccessCount = batchFiles.filter((f) => f.status === 'success').length

  return {
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
  }
}
