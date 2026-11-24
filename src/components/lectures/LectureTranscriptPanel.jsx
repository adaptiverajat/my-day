import React, { useState, useEffect, useRef } from 'react';

export default function LectureTranscriptPanel({
  lecture,
  onClose,
  onSaveTranscript
}) {
  const [transcriptText, setTranscriptText] = useState('');
  const [initialText, setInitialText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saved' | 'unsaved' | ''
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  const [showToolsGuide, setShowToolsGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const lectureId = lecture?.lecture_id || lecture?.id || '';

  // Initialize transcript when lecture changes
  useEffect(() => {
    if (lecture) {
      const text = lecture.transcript || '';
      setTranscriptText(text);
      setInitialText(text);
      setSaveStatus('');
    }
    // Stop speech recognition if active when switching track
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [lecture?.id, lecture?.lecture_id]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Track unsaved status
  const isDirty = transcriptText !== initialText;

  // Save handler
  const handleSave = async () => {
    if (!lecture) return;
    try {
      setIsSaving(true);
      await onSaveTranscript(lecture.id, transcriptText);
      setInitialText(transcriptText);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error saving transcript:', err);
      alert('Failed to save transcript: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  // Toggle Live Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript + ' ';
          } else {
            interimText += item[0].transcript;
          }
        }

        if (finalText) {
          setTranscriptText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed}\n${finalText.trim()}` : finalText.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone permissions in your browser bar.');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Could not start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Handle importing a text or subtitle file (.txt, .srt, .vtt)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target?.result || '';
      // If SRT or VTT, strip out numeric indices and timestamps if desired, or keep as is
      if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
        // Clean timestamp lines like "00:01:20,000 --> 00:01:23,000" and standalone numbers
        content = content
          .replace(/^\d+[\r\n]+/gm, '')
          .replace(/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,\.]\d{3}[\r\n]+/gm, '')
          .replace(/^WEBVTT[\r\n]+/gm, '')
          .trim();
      }

      setTranscriptText((prev) => {
        if (!prev.trim()) return content;
        return `${prev.trim()}\n\n--- Imported from ${file.name} ---\n${content}`;
      });
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const copyToClipboard = () => {
    if (!transcriptText) return;
    navigator.clipboard?.writeText(transcriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats
  const wordCount = transcriptText.trim() ? transcriptText.trim().split(/\s+/).length : 0;
  const charCount = transcriptText.length;

  if (!lecture) return null;

  return (
    <div className="lecture-transcript-panel" onKeyDown={handleKeyDown}>
      {/* Panel Header */}
      <div className="transcript-panel-header">
        <div className="transcript-header-title">
          <span className="transcript-badge">📝 TRANSCRIPT</span>
          <span className="transcript-lecture-id">ID: {lectureId}</span>
          <span className="transcript-lecture-title" title={lecture.title}>
            {lecture.title}
          </span>
          {isDirty && <span className="transcript-dirty-tag">● Unsaved Changes</span>}
          {saveStatus === 'saved' && <span className="transcript-saved-tag">✓ Saved to Database</span>}
        </div>

        {/* Header Action Buttons */}
        <div className="transcript-header-actions">
          {/* Live Dictate Toggle */}
          <button
            type="button"
            className={`transcript-tool-btn live-dictate ${isListening ? 'listening' : ''}`}
            onClick={toggleSpeechRecognition}
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
            onChange={(e) => setSpeechLanguage(e.target.value)}
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
            onClick={() => fileInputRef.current?.click()}
            title="Load transcript text or subtitle file (.txt, .srt, .vtt)"
          >
            📂 Import File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.srt,.vtt,.text"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {/* Copy Button */}
          <button
            type="button"
            className="transcript-tool-btn"
            onClick={copyToClipboard}
            disabled={!transcriptText}
            title="Copy transcript to clipboard"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>

          {/* AI Tools Info Button */}
          <button
            type="button"
            className="transcript-tool-btn info"
            onClick={() => setShowToolsGuide(true)}
            title="View available MP3-to-Text transcription tools and AI services"
          >
            💡 MP3 to Text Services
          </button>

          {/* Save Button */}
          <button
            type="button"
            className={`transcript-save-btn ${isDirty ? 'has-changes' : ''}`}
            onClick={handleSave}
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

      {/* Panel Body: Textarea */}
      <div className="transcript-panel-body">
        <textarea
          ref={textareaRef}
          className="transcript-textarea"
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          placeholder={`Enter or paste lecture transcript here...\n\nTips:\n• Click "🎙️ Live Dictate" to transcribe audio as it plays in real-time.\n• Click "📂 Import File" to load an existing .txt, .srt, or .vtt subtitle file.\n• Press "Ctrl + S" or click "💾 Save Transcript" to store permanently in the database.`}
        />
      </div>

      {/* Panel Footer: Stats & Shortcuts */}
      <div className="transcript-panel-footer">
        <div className="transcript-stats-text">
          <span><strong>{wordCount.toLocaleString()}</strong> words</span>
          <span>•</span>
          <span><strong>{charCount.toLocaleString()}</strong> characters</span>
          <span>•</span>
          <span className="shortcut-hint">Shortcut: Press <strong>Ctrl + S</strong> to quickly save</span>
        </div>
        <div className="transcript-footer-file-path">
          <span>Audio: <code>E:\MaharajLectures\{lectureId}.mp3</code></span>
        </div>
      </div>

      {/* Services Guide Modal */}
      {showToolsGuide && (
        <div className="transcript-modal-overlay" onClick={() => setShowToolsGuide(false)}>
          <div className="transcript-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="transcript-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>💡</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                  Available MP3 to Text Transcription Services & Tools
                </h3>
              </div>
              <button
                type="button"
                className="transcript-modal-close"
                onClick={() => setShowToolsGuide(false)}
              >
                ✕
              </button>
            </div>

            <div className="transcript-modal-body">
              <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '16px' }}>
                Here are the recommended options to convert your MP3 lectures to text:
              </p>

              <div className="service-guide-item">
                <div className="service-guide-header">
                  <span className="service-icon">🎙️</span>
                  <strong>1. Built-in Browser Live Dictation (Free, 0 Setup)</strong>
                  <span className="badge-free">Current Option</span>
                </div>
                <p>
                  Click the <strong>"🎙️ Live Dictate"</strong> button above while playing the audio through your speakers or Stereo Mix (loopback). Chrome/Edge uses its built-in Web Speech neural engine to transcribe in real-time for free.
                </p>
              </div>

              <div className="service-guide-item">
                <div className="service-guide-header">
                  <span className="service-icon">💻</span>
                  <strong>2. Buzz (Free Open-Source Desktop App - Recommended)</strong>
                  <span className="badge-offline">Offline AI</span>
                </div>
                <p>
                  <strong>Buzz</strong> is a free, open-source Windows application powered by OpenAI's Whisper model that runs 100% offline on your PC without needing any API key.
                </p>
                <ul>
                  <li>Drag and drop any MP3 file from <code>E:\MaharajLectures\</code>.</li>
                  <li>Generates full transcripts and exports as <code>.txt</code> or <code>.srt</code>.</li>
                  <li>Click <strong>"📂 Import File"</strong> here to load it instantly!</li>
                  <li>Download: <a href="https://github.com/chidiwilliams/buzz" target="_blank" rel="noreferrer">github.com/chidiwilliams/buzz</a></li>
                </ul>
              </div>

              <div className="service-guide-item">
                <div className="service-guide-header">
                  <span className="service-icon">⚡</span>
                  <strong>3. Whisper.cpp / Whisper Desktop</strong>
                  <span className="badge-offline">Fast & Offline</span>
                </div>
                <p>
                  A standalone lightweight Windows executable that runs Whisper on CPU/GPU with zero dependencies. Transcribes an hour lecture in a couple of minutes completely offline.
                </p>
              </div>

              <div className="service-guide-item">
                <div className="service-guide-header">
                  <span className="service-icon">☁️</span>
                  <strong>4. Cloud Transcription APIs (Ultra Fast)</strong>
                  <span className="badge-api">Cloud</span>
                </div>
                <ul>
                  <li><strong>Groq Whisper API</strong>: Transcribes a 1-hour MP3 in ~10 seconds with a free tier.</li>
                  <li><strong>AssemblyAI / Deepgram</strong>: Specialized speech-to-text platforms with speaker labels and auto-chapters.</li>
                </ul>
              </div>
            </div>

            <div className="transcript-modal-footer">
              <button
                type="button"
                className="lec-btn primary"
                onClick={() => setShowToolsGuide(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
