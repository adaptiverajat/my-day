import React, { useState, useEffect, useRef } from 'react';
import LectureTranscriptHeader from './LectureTranscriptHeader';
import LectureTranscriptFooter from './LectureTranscriptFooter';
import TranscriptGuideModal from './TranscriptGuideModal';
import { useSpeechDictate } from './hooks/useSpeechDictate';
import { readTranscriptFile, getTranscriptStats } from './lectureTranscriptHelper';

export default function LectureTranscriptPanel({
  lecture,
  onClose,
  onSaveTranscript
}) {
  const [transcriptText, setTranscriptText] = useState('');
  const [initialText, setInitialText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showToolsGuide, setShowToolsGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const lectureId = lecture?.lecture_id || lecture?.id || '';

  useEffect(() => {
    if (lecture) {
      const text = lecture.transcript || '';
      setTranscriptText(text);
      setInitialText(text);
      setSaveStatus('');
    }
  }, [lecture?.id, lecture?.lecture_id]);

  const handleAppendSpeech = (newText) => {
    setTranscriptText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${newText}` : newText;
    });
  };

  const {
    isListening,
    speechLanguage,
    setSpeechLanguage,
    toggleSpeechRecognition
  } = useSpeechDictate(lectureId, handleAppendSpeech);

  const isDirty = transcriptText !== initialText;

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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readTranscriptFile(file, (fileName, content) => {
      setTranscriptText((prev) => (prev.trim() ? `${prev.trim()}\n\n--- Imported from ${fileName} ---\n${content}` : content));
    });
    e.target.value = '';
  };

  const copyToClipboard = () => {
    if (!transcriptText) return;
    navigator.clipboard?.writeText(transcriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { wordCount, charCount } = getTranscriptStats(transcriptText);

  if (!lecture) return null;

  return (
    <div className="lecture-transcript-panel" onKeyDown={handleKeyDown}>
      <LectureTranscriptHeader
        lectureId={lectureId}
        title={lecture.title}
        isDirty={isDirty}
        saveStatus={saveStatus}
        isListening={isListening}
        speechLanguage={speechLanguage}
        onLanguageChange={setSpeechLanguage}
        onToggleSpeech={toggleSpeechRecognition}
        onImportClick={() => fileInputRef.current?.click()}
        onCopyClick={copyToClipboard}
        onShowGuide={() => setShowToolsGuide(true)}
        onSave={handleSave}
        isSaving={isSaving}
        onClose={onClose}
        copied={copied}
        hasText={!!transcriptText}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.srt,.vtt,.text"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <div className="transcript-panel-body">
        <textarea
          ref={textareaRef}
          className="transcript-textarea"
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
          placeholder={`Enter or paste lecture transcript here...\n\nTips:\n• Click "🎙️ Live Dictate" to transcribe audio as it plays in real-time.\n• Click "📂 Import File" to load an existing .txt, .srt, or .vtt subtitle file.\n• Press "Ctrl + S" or click "💾 Save Transcript" to store permanently in the database.`}
        />
      </div>

      <LectureTranscriptFooter
        wordCount={wordCount}
        charCount={charCount}
        lectureId={lectureId}
      />

      <TranscriptGuideModal
        isOpen={showToolsGuide}
        onClose={() => setShowToolsGuide(false)}
      />
    </div>
  );
}
