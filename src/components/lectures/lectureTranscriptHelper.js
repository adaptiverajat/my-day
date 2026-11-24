/**
 * Cleans SRT or VTT subtitle text to plain transcript text
 */
export function cleanSubtitleContent(content) {
  return content
    .replace(/^\d+[\r\n]+/gm, '')
    .replace(/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,\.]\d{3}[\r\n]+/gm, '')
    .replace(/^WEBVTT[\r\n]+/gm, '')
    .trim();
}

/**
 * Reads a text/subtitle file and invokes callback with cleaned content
 */
export function readTranscriptFile(file, onLoaded) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    let content = event.target?.result || '';
    if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
      content = cleanSubtitleContent(content);
    }
    onLoaded(file.name, content);
  };
  reader.readAsText(file);
}

/**
 * Computes word count and character count for transcript text
 */
export function getTranscriptStats(text) {
  const trimmed = (text || '').trim();
  return {
    wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
    charCount: (text || '').length
  };
}
