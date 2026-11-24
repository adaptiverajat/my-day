import React from 'react';

export default function LectureTableRow({
  lec,
  isCompleted,
  driveConnected,
  audioLocation,
  isPlaying,
  onPlay,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenTranscript,
  showSection = true
}) {
  return (
    <tr className={isCompleted ? 'completed-row' : ''}>
      <td className="col-checkbox">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggleStatus(lec.id, lec.status)}
          title={isCompleted ? 'Mark as pending' : 'Mark as heard/completed'}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      </td>
      <td className="col-id">
        {driveConnected ? (
          <button
            type="button"
            className={`lecture-id-audio-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => onPlay(lec)}
            title={`Play audio: ${audioLocation}\\${lec.lecture_id || lec.id}.mp3`}
          >
            <span className="audio-play-icon">{isPlaying ? '🔊' : '▶'}</span>
            <span>{lec.lecture_id || lec.id}</span>
          </button>
        ) : (
          <span
            className="lecture-id-plain"
            title={`Click 'Connect' in the toolbar to enable playback from ${audioLocation}`}
          >
            {lec.lecture_id || lec.id}
          </span>
        )}
      </td>
      <td className="col-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>{lec.title}</span>
          {lec.transcript && (
            <button
              type="button"
              className="transcript-mini-badge"
              title="Click to view/edit saved transcript"
              onClick={(e) => {
                e.stopPropagation();
                onOpenTranscript(lec);
              }}
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                border: '1px solid #c7d2fe',
                borderRadius: '4px',
                padding: '1px 6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              📝 Transcript
            </button>
          )}
        </div>
        {lec.notes && (
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
            📝 {lec.notes}
          </div>
        )}
      </td>
      <td className="col-year">{lec.year || '—'}</td>
      <td className="col-duration">{lec.duration || '00:00:00'}</td>
      <td className="col-sec-no">{lec.section_no || '—'}</td>
      {showSection && (
        <td className="col-section">
          {lec.section ? <span className="badge-section">{lec.section}</span> : '—'}
        </td>
      )}
      <td className="col-subsection">{lec.sub_section || '—'}</td>
      <td className="col-schedule">
        <span style={{ fontSize: '0.8rem', color: isCompleted ? '#047857' : '#475569' }}>
          {isCompleted
            ? `✅ ${lec.completed_date || 'Heard'}`
            : lec.scheduled_date
            ? `📅 ${lec.scheduled_date}`
            : '—'}
        </span>
      </td>
      <td className="col-actions">
        <button
          type="button"
          className="action-btn-sm"
          title="View / edit transcript"
          onClick={() => onOpenTranscript(lec)}
        >
          📝
        </button>
        <button
          type="button"
          className="action-btn-sm"
          title="Edit lecture"
          onClick={() => onEdit(lec)}
        >
          ✏️
        </button>
        <button
          type="button"
          className="action-btn-sm delete"
          title="Delete lecture"
          onClick={() => onDelete(lec.id, lec.title)}
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}
