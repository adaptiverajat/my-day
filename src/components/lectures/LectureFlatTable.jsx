import React from 'react';
import LectureTableRow from './LectureTableRow';

export default function LectureFlatTable({
  filteredLectures,
  totalCount,
  driveConnected,
  audioLocation,
  currentPlayingId,
  onPlay,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenTranscript
}) {
  return (
    <div className="lectures-table-card">
      <div className="table-header-bar">
        <div className="table-header-title">
          <span>Lecture Hearing Schedule</span>
          <span className="count-tag">{filteredLectures.length} of {totalCount} lectures</span>
        </div>
      </div>

      <div className="lectures-table-wrapper">
        <table className="lectures-table">
          <thead>
            <tr>
              <th className="col-checkbox">Heard</th>
              <th className="col-id">ID</th>
              <th className="col-title">Title</th>
              <th className="col-year">Year</th>
              <th className="col-duration">Duration</th>
              <th className="col-sec-no">Sec No.</th>
              <th className="col-section">Section</th>
              <th className="col-subsection">Sub-section</th>
              <th className="col-schedule">Schedule Date</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLectures.map((lec) => (
              <LectureTableRow
                key={lec.id}
                lec={lec}
                isCompleted={lec.status === 'completed'}
                driveConnected={driveConnected}
                audioLocation={audioLocation}
                isPlaying={currentPlayingId === lec.id}
                onPlay={onPlay}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenTranscript={onOpenTranscript}
                showSection={true}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
