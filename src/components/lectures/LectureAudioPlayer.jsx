import React, { useState, useEffect, useRef } from 'react';

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

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
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const cleanLocation = (audioLocation || 'E:\\MaharajLectures').replace(/[/\\]+$/, '');
  const lectureId = lecture?.lecture_id || lecture?.id || '';
  const audioSrc = lectureId
    ? `http://localhost:3001/api/lectures/audio/${encodeURIComponent(lectureId)}?directory=${encodeURIComponent(cleanLocation)}`
    : '';
  const filePathDisplay = `${cleanLocation}\\${lectureId}.mp3`;

  // Format seconds into hh:mm:ss or mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Reset and auto-play when lecture changes
  useEffect(() => {
    setAudioError('');
    setCurrentTime(0);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        console.warn('Autoplay prevented or audio load issue:', err.message);
        setIsPlaying(false);
      });
    }
  }, [lectureId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        setAudioError('Cannot play audio: ' + e.message);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleSkip = (seconds) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 999999);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    // Auto mark as completed if not already completed
    if (lecture && lecture.status !== 'completed') {
      onToggleStatus?.(lecture.id, 'pending');
    }
    // Auto-advance if next lecture available
    if (hasNext) {
      onNext?.();
    }
  };

  const copyFilePath = () => {
    navigator.clipboard?.writeText(filePathDisplay);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  if (!lecture) return null;

  return (
    <div className="audio-player-dock">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setAudioError(`Audio file not found at ${filePathDisplay}`)}
      />

      <div className="player-dock-content">
        {/* Left: Lecture Info */}
        <div className="player-track-info">
          <div className="track-badge-icon">🎧</div>
          <div className="track-text-details">
            <div className="track-title-row">
              <span className="track-id-badge">ID: {lectureId}</span>
              <span className="track-title" title={lecture.title}>{lecture.title}</span>
            </div>
            <div className="track-sub-row">
              {lecture.section && <span className="track-section-pill">{lecture.section}</span>}
              <button
                type="button"
                className="track-file-link"
                onClick={copyFilePath}
                title="Click to copy full audio path"
              >
                📁 {filePathDisplay} {copiedPath ? '✓ Copied' : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="player-controls-center">
          <div className="player-buttons-row">
            <button
              type="button"
              className="player-btn prev"
              onClick={onPrev}
              disabled={!hasPrev}
              title="Previous lecture"
            >
              ⏮
            </button>
            <button
              type="button"
              className="player-btn skip"
              onClick={() => handleSkip(-10)}
              title="Rewind 10 seconds"
            >
              ↺ 10s
            </button>
            <button
              type="button"
              className="player-btn play-pause-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="player-btn skip"
              onClick={() => handleSkip(10)}
              title="Forward 10 seconds"
            >
              10s ↻
            </button>
            <button
              type="button"
              className="player-btn next"
              onClick={onNext}
              disabled={!hasNext}
              title="Next lecture"
            >
              ⏭
            </button>
          </div>

          <div className="player-scrubber-row">
            <span className="time-text current">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="player-scrubber-slider"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={handleSeek}
            />
            <span className="time-text total">{formatTime(duration || 0)}</span>
          </div>

          {audioError && (
            <div className="player-error-banner">
              ⚠️ {audioError}
            </div>
          )}
        </div>

        {/* Right: Actions, Speed, Volume & Close */}
        <div className="player-actions-right">
          {/* Transcript Toggle */}
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

          {/* Status Toggle */}
          <button
            type="button"
            className={`player-heard-btn ${lecture.status === 'completed' ? 'completed' : ''}`}
            onClick={() => onToggleStatus(lecture.id, lecture.status)}
            title={lecture.status === 'completed' ? 'Click to mark as pending' : 'Click to mark as heard'}
          >
            {lecture.status === 'completed' ? '✅ Heard' : 'Mark as Heard'}
          </button>

          {/* Speed Selector */}
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
                    onClick={() => handleSpeedChange(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="player-volume-wrapper">
            <button
              type="button"
              className="player-volume-icon"
              onClick={toggleMute}
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
              onChange={handleVolumeChange}
              title="Volume"
            />
          </div>

          {/* Close button */}
          <button
            type="button"
            className="player-close-btn"
            onClick={onClose}
            title="Close audio player"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
