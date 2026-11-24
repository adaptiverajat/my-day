import L from 'leaflet'
import { escapeHtml, getPdfViewUrl } from './jivandishaHelpers'

export function createLeafletMap(container, center, zoom, onClick) {
  const map = L.map(container, {
    center,
    zoom,
    minZoom: 3,
    maxZoom: 18,
    zoomControl: true
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
  map.on('click', (e) => onClick(e.latlng.lat, e.latlng.lng))
  return map
}

export function buildLocationPopupHtml(loc, isPaid) {
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
  return popupDiv
}

export function bindLocationPopupEvents(marker, loc, { handleOpenHistory, handleOpenEdit, handleDeleteLocation }) {
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
}
