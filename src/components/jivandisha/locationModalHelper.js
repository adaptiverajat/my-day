export const initialLocationForm = {
  country: 'IN', title: '', lat: '', lng: '', city: '', state: '', address: '',
  books_sent: 0, invoice_date: '', payment_received: false, decision_maker_name: '',
  decision_maker_phone: '', inventory_keeper_name: '', inventory_keeper_phone: '',
  notes: '', contact_email: '', invoice_pdf_url: '', invoice_pdf_name: '', invoice_number: ''
}

export function extractLocationForm(loc) {
  return {
    country: loc.country || 'IN', title: loc.title || '', lat: loc.lat, lng: loc.lng,
    city: loc.city || '', state: loc.state || '', address: loc.address || '',
    books_sent: loc.books_sent || 0, invoice_date: loc.invoice_date || '',
    payment_received: Boolean(loc.payment_received), decision_maker_name: loc.decision_maker_name || '',
    decision_maker_phone: loc.decision_maker_phone || '', inventory_keeper_name: loc.inventory_keeper_name || '',
    inventory_keeper_phone: loc.inventory_keeper_phone || '', notes: loc.notes || '',
    contact_email: loc.contact_email || '', invoice_pdf_url: loc.invoice_pdf_url || '',
    invoice_pdf_name: loc.invoice_pdf_name || '', invoice_number: loc.invoice_number || ''
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`)
    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      return {
        city: addr.city || addr.town || addr.village || addr.county || '',
        state: addr.state || '',
        address: data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : ''
      }
    }
  } catch { /* ignore geocoding */ }
  return null
}

export function mergePdfExtraction(prev, data, ext) {
  const updated = {
    ...prev,
    invoice_pdf_url: data.pdfUrl || prev.invoice_pdf_url,
    invoice_pdf_name: data.pdfFilename || prev.invoice_pdf_name
  }
  const fields = [
    'title', 'country', 'city', 'state', 'address', 'books_sent',
    'invoice_date', 'decision_maker_name', 'decision_maker_phone',
    'inventory_keeper_name', 'inventory_keeper_phone', 'contact_email',
    'invoice_number', 'notes'
  ]
  fields.forEach((f) => {
    if (ext[f] !== undefined && ext[f] !== null && ext[f] !== '') {
      updated[f] = ext[f]
    }
  })
  if (ext.payment_received !== undefined) updated.payment_received = ext.payment_received
  return updated
}
