import { useState, useEffect } from 'react';

export function useIdleScreensaver(idleTimeoutMs = 60000) {
  const [showScreensaver, setShowScreensaver] = useState(false);

  useEffect(() => {
    let timeoutId;

    const resetIdleTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowScreensaver(true);
      }, idleTimeoutMs);
    };

    const handleActivity = () => {
      resetIdleTimer();
      setShowScreensaver(false);
    };

    resetIdleTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearTimeout(timeoutId);
    };
  }, [idleTimeoutMs]);

  return { showScreensaver, setShowScreensaver };
}
