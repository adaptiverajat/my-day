import React from 'react';

export default function TranscriptGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="transcript-modal-overlay" onClick={onClose}>
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
            onClick={onClose}
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
            onClick={onClose}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
