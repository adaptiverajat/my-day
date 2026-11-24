import React from 'react'
import LocationPdfSection from './LocationPdfSection'
import LocationInvoiceFields from './LocationInvoiceFields'
import LocationCityAutocomplete from './LocationCityAutocomplete'
import LocationContactFields from './LocationContactFields'
import LocationAddressFields from './LocationAddressFields'

export default function LocationModal({
  modalOpen,
  setModalOpen,
  editingLocation,
  formData,
  setFormData,
  handleSaveLocation,
  handleRemovePdf,
  uploadingPdf,
  handlePdfUpload,
  setBatchModalOpen,
  pdfStatusMsg,
  cityInputRef,
  isSearchingCity,
  handleCityChange,
  citySuggestions,
  setCitySuggestions,
  showCityDropdown,
  setShowCityDropdown,
  handleSelectCitySuggestion
}) {
  if (!modalOpen) return null

  return (
    <div className="jd-modal-overlay" onClick={() => setModalOpen(false)}>
      <div className="jd-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="jd-modal-header">
          <h3>{editingLocation ? '✏️ Edit Location Details' : '📍 Add New Location Details'}</h3>
          <button className="jd-modal-close" onClick={() => setModalOpen(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSaveLocation}>
          <div className="jd-modal-body">
            <LocationPdfSection
              formData={formData}
              handleRemovePdf={handleRemovePdf}
              uploadingPdf={uploadingPdf}
              handlePdfUpload={handlePdfUpload}
              setModalOpen={setModalOpen}
              setBatchModalOpen={setBatchModalOpen}
              pdfStatusMsg={pdfStatusMsg}
            />

            <LocationInvoiceFields
              formData={formData}
              setFormData={setFormData}
              setCitySuggestions={setCitySuggestions}
              setShowCityDropdown={setShowCityDropdown}
            />

            <LocationCityAutocomplete
              cityInputRef={cityInputRef}
              isSearchingCity={isSearchingCity}
              formData={formData}
              setFormData={setFormData}
              handleCityChange={handleCityChange}
              citySuggestions={citySuggestions}
              showCityDropdown={showCityDropdown}
              setShowCityDropdown={setShowCityDropdown}
              handleSelectCitySuggestion={handleSelectCitySuggestion}
            />

            <LocationContactFields
              formData={formData}
              setFormData={setFormData}
            />

            <LocationAddressFields
              formData={formData}
              setFormData={setFormData}
            />
          </div>

          <div className="jd-modal-footer">
            <button type="button" className="jd-btn" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="jd-btn primary">
              {editingLocation ? 'Save Changes' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
