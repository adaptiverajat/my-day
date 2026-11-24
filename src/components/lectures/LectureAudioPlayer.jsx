import React from 'react';
import { useLectureAudio } from './hooks/useLectureAudio';
import LectureAudioControls from './LectureAudioControls';

const formatTime = (secs) => {
  if (isNaN(secs) || secs < 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function LectureAudioPlayer({
  lecture,
  audioLocation = 'E:\\MaharajLectures',
  onClose,
  onToggleStatus,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  onToggleTranscript,
  showTranscript
}) {
  const audio = useLectureAudio({ lecture, audioLocation, hasNext, onNext, onToggleStatus });
  if (!lecture) return null;

  const lectureId = lecture.lecture_id || lecture.id || '';

  return (
    <div className="audio-player-dock">
      <audio
        ref={audio.audioRef}
        src={audio.audioSrc}
        onTimeUpdate={() => audio.audioRef.current && audio.setCurrentTime(audio.audioRef.current.currentTime)}
        onLoadedMetadata={() => audio.audioRef.current && audio.setDuration(audio.audioRef.current.duration)}
        onEnded={audio.handleEnded}
        onError={() => audio.setAudioError(`Audio file not found at ${audio.filePathDisplay}`)}
      />

      <div className="player-dock-content">
        <div className="player-track-info">
          <div className="track-badge-icon">🎧</div>
          <div className="track-text-details">
            <div className="track-title-row">
              <span className="track-id-badge">ID: {lectureId}</span>
              <span className="track-title" title={lecture.title}>{lecture.title}</span>
            </div>
            <div className="track-sub-row">
              {lecture.section && <span className="track-section-pill">{lecture.section}</span>}
              <button type="button" className="track-file-link" onClick={audio.copyFilePath} title="Click to copy path">
                📁 {audio.filePathDisplay} {audio.copiedPath ? '✓ Copied' : ''}
              </button>
            </div>
          </div>
        </div>

        <div className="player-controls-center">
          <div className="player-buttons-row">
            <button type="button" className="player-btn prev" onClick={onPrev} disabled={!hasPrev} title="Previous lecture">⏮</button>
            <button type="button" className="player-btn skip" onClick={() => audio.handleSkip(-10)} title="Rewind 10s">↺ 10s</button>
            <button type="button" className="player-btn play-pause-btn" onClick={audio.togglePlay} title={audio.isPlaying ? 'Pause' : 'Play'}>
              {audio.isPlaying ? '⏸' : '▶'}
            </button>
            <button type="button" className="player-btn skip" onClick={() => audio.handleSkip(10)} title="Forward 10s">10s ↻</button>
            <button type="button" className="player-btn next" onClick={onNext} disabled={!hasNext} title="Next lecture">⏭</button>
          </div>

          <div className="player-scrubber-row">
            <span className="time-text current">{formatTime(audio.currentTime)}</span>
            <input
              type="range"
              className="player-scrubber-slider"
              min="0"
              max={audio.duration || 100}
              step="0.5"
              value={audio.currentTime}
              onChange={audio.handleSeek}
            />
            <span className="time-text total">{formatTime(audio.duration || 0)}</span>
          </div>

          {audio.audioError && <div className="player-error-banner">⚠️ {audio.audioError}</div>}
        </div>

        <LectureAudioControls
          lecture={lecture}
          playbackSpeed={audio.playbackSpeed}
          onSpeedChange={audio.handleSpeedChange}
          volume={audio.volume}
          isMuted={audio.isMuted}
          onVolumeChange={audio.handleVolumeChange}
          onToggleMute={audio.toggleMute}
          onToggleStatus={onToggleStatus}
          onToggleTranscript={onToggleTranscript}
          showTranscript={showTranscript}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
