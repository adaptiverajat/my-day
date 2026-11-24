import React from 'react';
import ExcelImportModal from './ExcelImportModal';
import LectureModal from './LectureModal';
import LectureAudioPlayer from './LectureAudioPlayer';

export default function LectureModalsAndPlayer({
  showImportModal,
  onCloseImport,
  onImportSuccess,
  showLectureModal,
  onCloseLecture,
  editingLecture,
  onSaveLecture,
  currentPlayingLecture,
  audioLocation,
  onClosePlayer,
  onToggleStatus,
  onNextTrack,
  onPrevTrack,
  hasNext,
  hasPrev,
  onToggleTranscript,
  showTranscriptPanel
}) {
  return (
    <>
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={onCloseImport}
        onImportSuccess={onImportSuccess}
      />

      <LectureModal
        isOpen={showLectureModal}
        onClose={onCloseLecture}
        lecture={editingLecture}
        onSave={onSaveLecture}
      />

      {currentPlayingLecture && (
        <LectureAudioPlayer
          lecture={currentPlayingLecture}
          audioLocation={audioLocation}
          onClose={onClosePlayer}
          onToggleStatus={onToggleStatus}
          onNext={onNextTrack}
          onPrev={onPrevTrack}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onToggleTranscript={onToggleTranscript}
          showTranscript={showTranscriptPanel}
        />
      )}
    </>
  );
}
