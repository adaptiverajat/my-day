import React from 'react';
import LectureToolbarFilterRow from './LectureToolbarFilterRow';
import LectureToolbarActionRow from './LectureToolbarActionRow';

export default function LectureToolbar({
  summary,
  searchQuery,
  setSearchQuery,
  selectedSection,
  setSelectedSection,
  selectedYear,
  setSelectedYear,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  audioLocation,
  setAudioLocation,
  driveConnected,
  checkingDrive,
  driveInfo,
  checkDriveStatus,
  onToggleCollapse,
  onOpenImport,
  onOpenAdd,
  onExport,
  onClearAll,
  lecturesCount
}) {
  return (
    <div className="lectures-toolbar">
      <LectureToolbarFilterRow
        summary={summary}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onToggleCollapse={onToggleCollapse}
      />
      <LectureToolbarActionRow
        audioLocation={audioLocation}
        setAudioLocation={setAudioLocation}
        driveConnected={driveConnected}
        checkingDrive={checkingDrive}
        driveInfo={driveInfo}
        checkDriveStatus={checkDriveStatus}
        onOpenImport={onOpenImport}
        onOpenAdd={onOpenAdd}
        onExport={onExport}
        onClearAll={onClearAll}
        lecturesCount={lecturesCount}
      />
    </div>
  );
}
