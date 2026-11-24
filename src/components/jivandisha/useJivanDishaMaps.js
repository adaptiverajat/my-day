import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import { escapeHtml, getPdfViewUrl, createCustomPinIcon } from './jivandishaHelpers'

export function useJivanDishaMaps({
  locations,
  viewMode,
  sidebarOpen,
  mainTab,
  handleMapClick,
  handleOpenHistory,
  handleOpenEdit,
  handleDeleteLocation
}) {
  const indiaContainerRef = useRef(null)
  const usaContainerRef = useRef(null)
  const indiaMapInstance = useRef(null)
  const usaMapInstance = useRef(null)
  const markersRef = useRef({ IN: {}, US: {} })

  // Invalidate Leaflet maps when switching back to 'maps' tab
  useEffect(() => {
    if (mainTab === 'maps') {
      const timer = setTimeout(() => {
        if (indiaMapInstance.current) {
          try { indiaMapInstance.current.invalidateSize() } catch {}
        }
        if (usaMapInstance.current) {
          try { usaMapInstance.current.invalidateSize() } catch {}
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mainTab])

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

  // Fly to location
  const handleFlyTo = useCallback((loc) => {
    const country = loc.country === 'US' ? 'US' : 'IN'
    const map = country === 'US' ? usaMapInstance.current : indiaMapInstance.current
    if (map) {
      map.flyTo([loc.lat, loc.lng], 13, { duration: 1.5 })
      const marker = markersRef.current[country][loc.id]
      if (marker) {
        setTimeout(() => marker.openPopup(), 1600)
      }
    }
  }, [])

  return {
    indiaContainerRef,
    usaContainerRef,
    handleFlyTo
  }
}
