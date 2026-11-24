import React, { useState, useMemo } from 'react';
import { exportLecturesToExcel } from './lectures/excelLectureHelper';
import LectureTranscriptPanel from './lectures/LectureTranscriptPanel';
import LectureHeader from './lectures/LectureHeader';
import LectureHeaderSection from './lectures/LectureHeaderSection';
import LectureEmptyState from './lectures/LectureEmptyState';
import LectureFlatTable from './lectures/LectureFlatTable';
import LectureGroupedTable from './lectures/LectureGroupedTable';
import LectureModalsAndPlayer from './lectures/LectureModalsAndPlayer';
import { useLectureData } from './lectures/hooks/useLectureData';
import { useLectureDrive } from './lectures/hooks/useLectureDrive';
import { useLectureFilters } from './lectures/hooks/useLectureFilters';
import './lectures/LectureHearingSchedule.css';

export default function Report() {
  const lectureData = useLectureData();
  const drive = useLectureDrive(lectureData.showToast);
  const filters = useLectureFilters(lectureData.lectures);

  const [currentPlayingLecture, setCurrentPlayingLecture] = useState(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => localStorage.getItem('lectureHeaderCollapsed') !== 'false');
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('lectureHeaderCollapsed', String(next));
      return next;
    });
  };

  const currentTrackIndex = useMemo(() => {
    return currentPlayingLecture ? filters.filteredLectures.findIndex((l) => l.id === currentPlayingLecture.id) : -1;
  }, [filters.filteredLectures, currentPlayingLecture]);

  const handlePlayLecture = (lec) => {
    setCurrentPlayingLecture(lec);
    setShowTranscriptPanel(true);
  };

  return (
    <div className={`lectures-page ${currentPlayingLecture ? 'with-player' : ''}`}>
      <LectureHeader summary={lectureData.summary} isHeaderCollapsed={isHeaderCollapsed} onToggleCollapse={toggleHeaderCollapse} />

      <div className="lectures-container">
        {lectureData.notification && (
          <div style={{ padding: '12px 18px', background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', borderRadius: '8px', fontWeight: 600 }}>
            {lectureData.notification}
          </div>
        )}

        <LectureHeaderSection
          isHeaderCollapsed={isHeaderCollapsed}
          summary={lectureData.summary}
          filters={filters}
          drive={drive}
          onToggleCollapse={toggleHeaderCollapse}
          onOpenImport={() => setShowImportModal(true)}
          onOpenAdd={() => { setEditingLecture(null); setShowLectureModal(true); }}
          onExport={() => exportLecturesToExcel(filters.filteredLectures)}
          onClearAll={lectureData.handleClearAll}
          lecturesCount={lectureData.lectures.length}
        />

        {currentPlayingLecture && showTranscriptPanel && (
          <LectureTranscriptPanel lecture={currentPlayingLecture} onClose={() => setShowTranscriptPanel(false)} onSaveTranscript={lectureData.handleSaveTranscript} />
        )}

        {lectureData.loading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
            <div className="loading-spinner" />
            <p style={{ marginTop: '14px', color: '#64748b' }}>Loading lecture hearing schedule...</p>
          </div>
        ) : lectureData.error ? (
          <div style={{ padding: '24px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
            <strong>Error:</strong> {lectureData.error}
          </div>
        ) : lectureData.lectures.length === 0 ? (
          <LectureEmptyState onOpenImport={() => setShowImportModal(true)} onOpenAdd={() => { setEditingLecture(null); setShowLectureModal(true); }} />
        ) : filters.viewMode === 'flat' ? (
          <LectureFlatTable
            filteredLectures={filters.filteredLectures}
            totalCount={lectureData.lectures.length}
            driveConnected={drive.driveConnected}
            audioLocation={drive.audioLocation}
            currentPlayingId={currentPlayingLecture?.id}
            onPlay={handlePlayLecture}
            onToggleStatus={lectureData.handleToggleStatus}
            onEdit={(lec) => { setEditingLecture(lec); setShowLectureModal(true); }}
            onDelete={lectureData.handleDeleteLecture}
            onOpenTranscript={handlePlayLecture}
          />
        ) : (
          <LectureGroupedTable
            groupedSections={filters.groupedSections}
            collapsedSections={filters.collapsedSections}
            onToggleSection={filters.toggleSectionCollapse}
            driveConnected={drive.driveConnected}
            audioLocation={drive.audioLocation}
            currentPlayingId={currentPlayingLecture?.id}
            onPlay={handlePlayLecture}
            onToggleStatus={lectureData.handleToggleStatus}
            onEdit={(lec) => { setEditingLecture(lec); setShowLectureModal(true); }}
            onDelete={lectureData.handleDeleteLecture}
            onOpenTranscript={handlePlayLecture}
          />
        )}
      </div>

      <LectureModalsAndPlayer
        showImportModal={showImportModal}
        onCloseImport={() => setShowImportModal(false)}
        onImportSuccess={(count) => { lectureData.showToast(`Successfully imported ${count} lectures!`); lectureData.fetchLectures(); }}
        showLectureModal={showLectureModal}
        onCloseLecture={() => { setShowLectureModal(false); setEditingLecture(null); }}
        editingLecture={editingLecture}
        onSaveLecture={(data) => lectureData.handleSaveLecture(data, editingLecture)}
        currentPlayingLecture={currentPlayingLecture}
        audioLocation={drive.audioLocation}
        onClosePlayer={() => setCurrentPlayingLecture(null)}
        onToggleStatus={lectureData.handleToggleStatus}
        onNextTrack={() => currentTrackIndex < filters.filteredLectures.length - 1 && setCurrentPlayingLecture(filters.filteredLectures[currentTrackIndex + 1])}
        onPrevTrack={() => currentTrackIndex > 0 && setCurrentPlayingLecture(filters.filteredLectures[currentTrackIndex - 1])}
        hasNext={currentTrackIndex >= 0 && currentTrackIndex < filters.filteredLectures.length - 1}
        hasPrev={currentTrackIndex > 0}
        onToggleTranscript={() => setShowTranscriptPanel((prev) => !prev)}
        showTranscriptPanel={showTranscriptPanel}
      />
    </div>
  );
}