import { useState, useEffect } from 'react';

export function useLectureDrive(showToast) {
  const [audioLocation, setAudioLocation] = useState(() => {
    return localStorage.getItem('lectureAudioLocation') || 'E:\\MaharajLectures';
  });
  const [driveConnected, setDriveConnected] = useState(false);
  const [checkingDrive, setCheckingDrive] = useState(false);
  const [driveInfo, setDriveInfo] = useState(null);

  const checkDriveStatus = async (isManualClick = false, locationOverride = null) => {
    try {
      setCheckingDrive(true);
      const targetLocation = locationOverride !== null ? locationOverride : audioLocation;
      const trimmed = (targetLocation || '').trim();

      if (!trimmed) {
        if (isManualClick && showToast) showToast('⚠️ Please enter an audio folder path.');
        setDriveConnected(false);
        return;
      }

      localStorage.setItem('lectureAudioLocation', trimmed);
      const url = `http://localhost:3001/api/lectures/drive-status?directory=${encodeURIComponent(trimmed)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.connected) {
        setDriveConnected(true);
        setDriveInfo(data);
        if (isManualClick && showToast) {
          showToast(`🟢 Connected to ${trimmed}! Found ${data.fileCount} audio files.`);
        }
      } else {
        setDriveConnected(false);
        setDriveInfo(data);
        if (isManualClick && showToast) {
          if (!data.drivePresent) {
            showToast(`⚠️ Drive for "${trimmed}" not detected. Please ensure the drive is plugged in.`);
          } else if (!data.directoryPresent) {
            showToast(`⚠️ Folder "${trimmed}" was not found.`);
          } else {
            showToast(`⚠️ Could not connect to "${trimmed}".`);
          }
        }
      }
    } catch (err) {
      console.error('Error checking drive:', err);
      if (isManualClick && showToast) {
        showToast('⚠️ Error connecting to audio location: ' + err.message);
      }
    } finally {
      setCheckingDrive(false);
    }
  };

  useEffect(() => {
    checkDriveStatus(false);
  }, []);

  return {
    audioLocation,
    setAudioLocation,
    driveConnected,
    setDriveConnected,
    checkingDrive,
    driveInfo,
    checkDriveStatus
  };
}
