import { searchLocalCities, fetchRemoteCities } from '../../utils/cityData'
import { API_BASE_URL, uploadInvoicePdf } from './jivandishaHelpers'

export async function processBatchPdfFile(item, batchCountry, dbConnected) {
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

  const locationTitle = ext.title || item.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')

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

  return {
    location: createdLocation,
    resultSummary: {
      title: locationTitle,
      city: ext.city || '',
      state: detectedState || '',
      books_sent: payload.books_sent,
      invoice_number: payload.invoice_number,
      amount: payload.amount,
      pdfUrl: uploadRes.pdfUrl
    }
  }
}
