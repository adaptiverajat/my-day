import L from 'leaflet'

export const API_BASE_URL = 'http://localhost:3001/api/jivandisha'
export const LOCAL_STORAGE_KEY = 'jivandisha_locations_backup'

// Helper to escape HTML in Leaflet popups
export function escapeHtml(text) {
  if (text === null || text === undefined) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Helper to construct link to access retained invoice PDFs
export function getPdfViewUrl(url) {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const clean = url.startsWith('/') ? url : `/${url}`
  return `http://localhost:3001${clean}`
}

// Upload invoice PDF
export async function uploadInvoicePdf(file, country) {
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
export function createCustomPinIcon(isPaid) {
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

// Helper to determine follow-up status label and color badge
export function getFollowUpStatusInfo(dateStr) {
  if (!dateStr) return { status: 'none', label: 'Not Scheduled', className: 'none' }
  const cleanDateStr = String(dateStr).slice(0, 10)
  const todayStr = new Date().toISOString().slice(0, 10)

  if (cleanDateStr < todayStr) {
    const diffMs = new Date(todayStr) - new Date(cleanDateStr)
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    return {
      status: 'overdue',
      label: `⚠️ Overdue (${diffDays}d ago - ${cleanDateStr})`,
      className: 'overdue'
    }
  } else if (cleanDateStr === todayStr) {
    return {
      status: 'today',
      label: `🔔 Due Today (${cleanDateStr})`,
      className: 'today'
    }
  } else {
    const diffMs = new Date(cleanDateStr) - new Date(todayStr)
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    return {
      status: 'upcoming',
      label: `📅 In ${diffDays}d (${cleanDateStr})`,
      className: 'upcoming'
    }
  }
}
