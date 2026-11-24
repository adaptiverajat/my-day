import React from 'react';
import LectureStatsCards from './LectureStatsCards';
import LectureCollapsedBar from './LectureCollapsedBar';
import LectureToolbar from './LectureToolbar';

export default function LectureHeaderSection({
  isHeaderCollapsed,
  summary,
  filters,
  drive,
  onToggleCollapse,
  onOpenImport,
  onOpenAdd,
  onExport,
  onClearAll,
  lecturesCount
}) {
  if (isHeaderCollapsed) {
    return (
      <LectureCollapsedBar
        summary={summary}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        selectedSection={filters.selectedSection}
        setSelectedSection={filters.setSelectedSection}
        selectedStatus={filters.selectedStatus}
        setSelectedStatus={filters.setSelectedStatus}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        audioLocation={drive.audioLocation}
        setAudioLocation={drive.setAudioLocation}
        driveConnected={drive.driveConnected}
        checkingDrive={drive.checkingDrive}
        checkDriveStatus={drive.checkDriveStatus}
        onToggleCollapse={onToggleCollapse}
      />
    );
  }

  return (
    <>
      <LectureStatsCards summary={summary} />
      <LectureToolbar
        summary={summary}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        selectedSection={filters.selectedSection}
        setSelectedSection={filters.setSelectedSection}
        selectedYear={filters.selectedYear}
        setSelectedYear={filters.setSelectedYear}
        selectedStatus={filters.selectedStatus}
        setSelectedStatus={filters.setSelectedStatus}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        audioLocation={drive.audioLocation}
        setAudioLocation={drive.setAudioLocation}
        driveConnected={drive.driveConnected}
        checkingDrive={drive.checkingDrive}
        driveInfo={drive.driveInfo}
        checkDriveStatus={drive.checkDriveStatus}
        onToggleCollapse={onToggleCollapse}
        onOpenImport={onOpenImport}
        onOpenAdd={onOpenAdd}
        onExport={onExport}
        onClearAll={onClearAll}
        lecturesCount={lecturesCount}
      />
    </>
  );
}
