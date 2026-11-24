import { useEffect, useRef } from 'react';

const SECRET_CODE = 'mtbt';

export function useSecretKeySequence({
  isActive,
  isSecretMode,
  onSecretTriggered,
  onDismiss
}) {
  const secretKeySequenceRef = useRef('');

  const resetSequence = () => {
    secretKeySequenceRef.current = '';
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isActive) return;

      if (event.key === 'Escape') {
        onDismiss?.();
        resetSequence();
        return;
      }

      if (!isSecretMode && event.key.length === 1) {
        const newSequence = (secretKeySequenceRef.current + event.key.toLowerCase()).slice(-SECRET_CODE.length);
        secretKeySequenceRef.current = newSequence;
        if (newSequence === SECRET_CODE) {
          resetSequence();
          onSecretTriggered?.(true);
        }
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, isSecretMode, onSecretTriggered, onDismiss]);

  return { resetSequence };
}
