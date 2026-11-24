import React, { useState } from 'react';

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

export default function LectureAudioControls({
  lecture,
  playbackSpeed,
  onSpeedChange,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onToggleStatus,
  onToggleTranscript,
  showTranscript,
  onClose
}) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  return (
    <div className="player-actions-right">
      {onToggleTranscript && (
        <button
          type="button"
          className={`player-transcript-btn ${showTranscript ? 'active' : ''}`}
          onClick={onToggleTranscript}
          title={showTranscript ? 'Hide transcript panel' : 'Open transcript panel'}
        >
          📝 Transcript
        </button>
      )}

      <button
        type="button"
        className={`player-heard-btn ${lecture.status === 'completed' ? 'completed' : ''}`}
        onClick={() => onToggleStatus(lecture.id, lecture.status)}
        title={lecture.status === 'completed' ? 'Click to mark as pending' : 'Click to mark as heard'}
      >
        {lecture.status === 'completed' ? '✅ Heard' : 'Mark as Heard'}
      </button>

      <div className="player-speed-wrapper">
        <button
          type="button"
          className="player-speed-btn"
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          title="Playback speed"
        >
          {playbackSpeed}x
        </button>
        {showSpeedMenu && (
          <div className="player-speed-menu">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={`speed-menu-item ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => { onSpeedChange(speed); setShowSpeedMenu(false); }}
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="player-volume-wrapper">
        <button
          type="button"
          className="player-volume-icon"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          type="range"
          className="player-volume-slider"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={onVolumeChange}
          title="Volume"
        />
      </div>

      <button type="button" className="player-close-btn" onClick={onClose} title="Close audio player">
        ✕
      </button>
    </div>
  );
}
