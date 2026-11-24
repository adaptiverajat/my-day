import React from 'react';

export default function LectureTranscriptHeader({
  lectureId,
  title,
  isDirty,
  saveStatus,
  isListening,
  speechLanguage,
  onLanguageChange,
  onToggleSpeech,
  onImportClick,
  onCopyClick,
  onShowGuide,
  onSave,
  isSaving,
  onClose,
  copied,
  hasText
}) {
  return (
    <div className="transcript-panel-header">
      <div className="transcript-header-title">
        <span className="transcript-badge">📝 TRANSCRIPT</span>
        <span className="transcript-lecture-id">ID: {lectureId}</span>
        <span className="transcript-lecture-title" title={title}>
          {title}
        </span>
        {isDirty && <span className="transcript-dirty-tag">● Unsaved Changes</span>}
        {saveStatus === 'saved' && <span className="transcript-saved-tag">✓ Saved to Database</span>}
      </div>

      <div className="transcript-header-actions">
        {/* Live Dictate Toggle */}
        <button
          type="button"
          className={`transcript-tool-btn live-dictate ${isListening ? 'listening' : ''}`}
          onClick={onToggleSpeech}
          title={
            isListening
              ? 'Stop listening'
              : 'Transcribe speech in real-time via Web Speech Recognition (Chrome/Edge)'
          }
        >
          <span className={`mic-dot ${isListening ? 'active' : ''}`} />
          {isListening ? '🔴 Transcribing...' : '🎙️ Live Dictate'}
        </button>

        {/* Language Selector */}
        <select
          className="transcript-lang-select"
          value={speechLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          title="Speech Recognition Language"
        >
          <option value="en-US">English (US)</option>
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi</option>
        </select>

        {/* Import File Button */}
        <button
          type="button"
          className="transcript-tool-btn"
          onClick={onImportClick}
          title="Load transcript text or subtitle file (.txt, .srt, .vtt)"
        >
          📂 Import File
        </button>

        {/* Copy Button */}
        <button
          type="button"
          className="transcript-tool-btn"
          onClick={onCopyClick}
          disabled={!hasText}
          title="Copy transcript to clipboard"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>

        {/* AI Tools Info Button */}
        <button
          type="button"
          className="transcript-tool-btn info"
          onClick={onShowGuide}
          title="View available MP3-to-Text transcription tools and AI services"
        >
          💡 MP3 to Text Services
        </button>

        {/* Save Button */}
        <button
          type="button"
          className={`transcript-save-btn ${isDirty ? 'has-changes' : ''}`}
          onClick={onSave}
          disabled={isSaving}
          title="Save transcript to database against this lecture (Ctrl + S)"
        >
          {isSaving ? 'Saving...' : '💾 Save Transcript'}
        </button>

        {/* Close Panel Button */}
        <button
          type="button"
          className="transcript-close-btn"
          onClick={onClose}
          title="Hide Transcript Panel"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
