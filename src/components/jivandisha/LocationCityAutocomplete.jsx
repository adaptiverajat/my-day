import React from 'react'

export default function LocationCityAutocomplete({
  cityInputRef,
  isSearchingCity,
  formData,
  setFormData,
  handleCityChange,
  citySuggestions,
  showCityDropdown,
  setShowCityDropdown,
  handleSelectCitySuggestion
}) {
  return (
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
  )
}
