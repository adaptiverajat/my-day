import React from 'react'
import { useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './JivanDisha.css'
import JivanDishaHeader from './jivandisha/JivanDishaHeader'
import JivanDishaMapsView from './jivandisha/JivanDishaMapsView'
import JivanDishaSidebar from './jivandisha/JivanDishaSidebar'
import JivanDishaInvoicesView from './jivandisha/JivanDishaInvoicesView'
import JivanDishaContactsView from './jivandisha/JivanDishaContactsView'
import JivanDishaIndividualCollectionsView from './jivandisha/JivanDishaIndividualCollectionsView'
import JivanDishaAllModals from './jivandisha/JivanDishaAllModals'
import { useCityAutocomplete } from './jivandisha/useCityAutocomplete'
import { useJivanDishaBatch } from './jivandisha/useJivanDishaBatch'
import { useJivanDishaMaps } from './jivandisha/useJivanDishaMaps'
import { useJivanDishaData } from './jivandisha/useJivanDishaData'
import { useJivanDishaFilters } from './jivandisha/useJivanDishaFilters'
import { useLocationModal } from './jivandisha/useLocationModal'
import { useInvoiceHistoryModal } from './jivandisha/useInvoiceHistoryModal'
import { useFollowUpModal } from './jivandisha/useFollowUpModal'

export default function JivanDisha() {
  const navigate = useNavigate()
  const data = useJivanDishaData()
  const filters = useJivanDishaFilters({ locations: data.locations, allInvoices: data.allInvoices })
  const cityAuto = useCityAutocomplete(filters.filterCountry)

  const locModal = useLocationModal({
    locations: data.locations,
    setLocations: data.setLocations,
    dbConnected: data.dbConnected,
    setCitySuggestions: cityAuto.setCitySuggestions,
    setShowCityDropdown: cityAuto.setShowCityDropdown
  })

  const historyModal = useInvoiceHistoryModal({
    dbConnected: data.dbConnected,
    setLocations: data.setLocations,
    loadLocations: data.loadLocations
  })

  const followUpModal = useFollowUpModal({ setLocations: data.setLocations })
  const batchImport = useJivanDishaBatch(data.dbConnected, data.setLocations)

  const { indiaContainerRef, usaContainerRef, handleFlyTo } = useJivanDishaMaps({
    locations: data.locations,
    viewMode: filters.viewMode,
    sidebarOpen: filters.sidebarOpen,
    mainTab: filters.mainTab,
    handleMapClick: locModal.handleMapClick,
    handleOpenHistory: historyModal.handleOpenHistory,
    handleOpenEdit: locModal.handleOpenEdit,
    handleDeleteLocation: data.handleDeleteLocation
  })

  return (
    <div className={`jivandisha-container jd-view-${filters.mainTab}`}>
      <JivanDishaHeader
        {...filters}
        {...data}
        locationsCount={data.locations.length}
        allInvoicesCount={data.allInvoices.length}
        navigate={navigate}
        onOpenAddLocationModal={locModal.resetLocationForm}
        onOpenBatchModal={() => batchImport.setBatchModalOpen(true)}
        loadIndividualCollections={data.loadIndividualCollectionsCount}
      />

      <div className="jd-workspace" style={{ display: filters.mainTab === 'maps' ? 'flex' : 'none' }}>
        <JivanDishaMapsView
          {...filters}
          indiaContainerRef={indiaContainerRef}
          usaContainerRef={usaContainerRef}
        />
        <JivanDishaSidebar
          {...filters}
          {...data}
          handleFlyTo={handleFlyTo}
          handleOpenHistory={historyModal.handleOpenHistory}
          handleOpenEdit={locModal.handleOpenEdit}
        />
      </div>

      <JivanDishaInvoicesView {...filters} {...data} />

      <JivanDishaContactsView
        {...filters}
        {...data}
        handleOpenFollowUpModal={followUpModal.handleOpenFollowUpModal}
        handleOpenEdit={locModal.handleOpenEdit}
      />

      <JivanDishaIndividualCollectionsView
        mainTab={filters.mainTab}
        onCollectionsCountChange={data.setIndividualCollectionsCount}
      />

      <JivanDishaAllModals
        locModal={locModal}
        historyModal={historyModal}
        batchModal={batchImport}
        followUpModal={followUpModal}
        cityAuto={cityAuto}
      />
    </div>
  )
}
