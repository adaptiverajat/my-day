import { useState, useEffect, useRef } from 'react';

export function useLectureAudio({ lecture, audioLocation, hasNext, onNext, onToggleStatus }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [copiedPath, setCopiedPath] = useState(false);

  const cleanLocation = (audioLocation || 'E:\\MaharajLectures').replace(/[/\\]+$/, '');
  const lectureId = lecture?.lecture_id || lecture?.id || '';
  const audioSrc = lectureId
    ? `http://localhost:3001/api/lectures/audio/${encodeURIComponent(lectureId)}?directory=${encodeURIComponent(cleanLocation)}`
    : '';
  const filePathDisplay = `${cleanLocation}\\${lectureId}.mp3`;

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

  const handleSeek = (e) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) audioRef.current.currentTime = targetTime;
  };

  const handleSkip = (seconds) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 999999);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (lecture && lecture.status !== 'completed') onToggleStatus?.(lecture.id, 'pending');
    if (hasNext) onNext?.();
  };

  const copyFilePath = () => {
    navigator.clipboard?.writeText(filePathDisplay);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return {
    audioRef,
    audioSrc,
    filePathDisplay,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    volume,
    isMuted,
    audioError,
    copiedPath,
    setAudioError,
    setCurrentTime,
    setDuration,
    togglePlay,
    handleSeek,
    handleSkip,
    handleSpeedChange,
    handleVolumeChange,
    toggleMute,
    handleEnded,
    copyFilePath
  };
}
