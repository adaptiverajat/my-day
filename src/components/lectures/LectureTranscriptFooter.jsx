import React from 'react';

export default function LectureTranscriptFooter({ wordCount, charCount, lectureId }) {
  return (
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
  );
}
