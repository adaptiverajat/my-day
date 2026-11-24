import React from 'react';

export default function LectureToolbarActionRow({
  audioLocation,
  setAudioLocation,
  driveConnected,
  checkingDrive,
  driveInfo,
  checkDriveStatus,
  onOpenImport,
  onOpenAdd,
  onExport,
  onClearAll,
  lecturesCount
}) {
  return (
    <div className="toolbar-row toolbar-action-row">
      <div className="audio-connect-group" title="Set audio folder location and connect">
        <div className="audio-location-input-wrapper">
          <span className="audio-location-icon" title="Audio directory location">📁</span>
          <input
            type="text"
            className="audio-location-input"
            value={audioLocation}
            onChange={(e) => setAudioLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') checkDriveStatus(true, e.target.value);
            }}
            placeholder="E:\MaharajLectures"
            title="Enter folder path containing lecture MP3 files (Default: E:\MaharajLectures)"
          />
          {audioLocation !== 'E:\\MaharajLectures' && (
            <button
              type="button"
              className="audio-location-reset-btn"
              onClick={() => {
                setAudioLocation('E:\\MaharajLectures');
                checkDriveStatus(true, 'E:\\MaharajLectures');
              }}
              title="Reset to default (E:\MaharajLectures)"
            >
              ↺
            </button>
          )}
        </div>

        <button
          type="button"
          className={`connect-btn ${driveConnected ? 'connected' : ''} ${checkingDrive ? 'connecting' : ''}`}
          onClick={() => checkDriveStatus(true)}
          disabled={checkingDrive}
          title={
            driveConnected
              ? `Connected to ${audioLocation} (${driveInfo?.fileCount ?? 0} MP3 files found). Click to re-verify.`
              : `Check and connect to folder: ${audioLocation || 'E:\\MaharajLectures'}`
          }
        >
          <span className="connect-status-indicator" />
          {checkingDrive
            ? 'Connecting...'
            : driveConnected
            ? `🟢 Connected (${driveInfo?.fileCount ?? 0} files)`
            : '🔌 Connect'}
        </button>
      </div>

      <div className="action-buttons-group">
        <button
          type="button"
          className="lec-btn success"
          onClick={onOpenImport}
          title="Import lecture list from Excel (.xlsx, .xls, .csv)"
        >
          📥 Import Excel
        </button>
        <button
          type="button"
          className="lec-btn primary"
          onClick={onOpenAdd}
          title="Add a new lecture manually"
        >
          ➕ Add Lecture
        </button>
        {lecturesCount > 0 && (
          <>
            <button
              type="button"
              className="lec-btn"
              onClick={onExport}
              title="Export current view to Excel"
            >
              📊 Export
            </button>
            <button
              type="button"
              className="lec-btn danger"
              onClick={onClearAll}
              title="Clear all lectures"
            >
              🗑️ Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );
}
