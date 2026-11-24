import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import { createCustomPinIcon } from './jivandishaHelpers'
import { createLeafletMap, buildLocationPopupHtml, bindLocationPopupEvents } from './mapPopupBuilder'

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

  useEffect(() => {
    if (mainTab === 'maps') {
      const timer = setTimeout(() => {
        try { indiaMapInstance.current?.invalidateSize() } catch {}
        try { usaMapInstance.current?.invalidateSize() } catch {}
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mainTab])

  useEffect(() => {
    if (!indiaContainerRef.current || indiaMapInstance.current) return
    const map = createLeafletMap(indiaContainerRef.current, [22.8, 79.5], 4, (lat, lng) => handleMapClick('IN', lat, lng))
    indiaMapInstance.current = map
    return () => {
      map.remove()
      indiaMapInstance.current = null
    }
  }, [handleMapClick])

  useEffect(() => {
    if (!usaContainerRef.current || usaMapInstance.current) return
    const map = createLeafletMap(usaContainerRef.current, [39.5, -98.35], 4, (lat, lng) => handleMapClick('US', lat, lng))
    usaMapInstance.current = map
    return () => {
      map.remove()
      usaMapInstance.current = null
    }
  }, [handleMapClick])

  useEffect(() => {
    const timer = setTimeout(() => {
      indiaMapInstance.current?.invalidateSize()
      usaMapInstance.current?.invalidateSize()
    }, 250)
    return () => clearTimeout(timer)
  }, [viewMode, sidebarOpen])

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

      const popupDiv = buildLocationPopupHtml(loc, isPaid)
      marker.bindPopup(popupDiv)
      bindLocationPopupEvents(marker, loc, { handleOpenHistory, handleOpenEdit, handleDeleteLocation })

      markersRef.current[country][loc.id] = marker
    })
  }, [locations, handleDeleteLocation, handleOpenEdit, handleOpenHistory])

  const handleFlyTo = useCallback((loc) => {
    const country = loc.country === 'US' ? 'US' : 'IN'
    const map = country === 'US' ? usaMapInstance.current : indiaMapInstance.current
    if (map) {
      map.flyTo([loc.lat, loc.lng], 13, { duration: 1.5 })
      const marker = markersRef.current[country][loc.id]
      if (marker) setTimeout(() => marker.openPopup(), 1600)
    }
  }, [])

  return {
    indiaContainerRef,
    usaContainerRef,
    handleFlyTo
  }
}
