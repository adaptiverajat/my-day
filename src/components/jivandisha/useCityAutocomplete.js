import { useState, useRef } from 'react'
import { searchLocalCities, fetchRemoteCities } from '../../utils/cityData'

export function useCityAutocomplete(country, setFormData) {
  const [citySuggestions, setCitySuggestions] = useState([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [isSearchingCity, setIsSearchingCity] = useState(false)
  const cityInputRef = useRef(null)
  const cityDebounceRef = useRef(null)

  const handleCityChange = (e) => {
    const query = e.target.value
    setFormData((prev) => ({ ...prev, city: query }))

    if (!query.trim()) {
      setCitySuggestions([])
      setShowCityDropdown(false)
      return
    }

    // 1. Instant local matches
    const localMatches = searchLocalCities(query, country)
    setCitySuggestions(localMatches)
    setShowCityDropdown(true)

    // 2. Debounced remote Nominatim search
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    cityDebounceRef.current = setTimeout(async () => {
      setIsSearchingCity(true)
      try {
        const remoteMatches = await fetchRemoteCities(query, country)
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

  return {
    citySuggestions,
    setCitySuggestions,
    showCityDropdown,
    setShowCityDropdown,
    isSearchingCity,
    cityInputRef,
    handleCityChange,
    handleSelectCitySuggestion
  }
}
