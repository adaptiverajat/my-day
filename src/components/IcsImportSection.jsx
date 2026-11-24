import React, { useState } from 'react';
import { parseICSFile, convertICSEventsToTasks } from '../utils/icsHelper';

export default function IcsImportSection({ onTasksParsed, onError, loading, setLoading }) {
  const [icsFile, setIcsFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.ics')) {
      setIcsFile(file);
      onError(null);
    } else {
      onError('Please select a valid .ics file');
    }
  };

  const handleICSImport = () => {
    if (!icsFile) {
      onError('Please select an .ics file first');
      return;
    }

    setLoading(true);
    onError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const events = parseICSFile(e.target.result);
        if (events.length === 0) {
          onError('No events found in the ICS file');
          setLoading(false);
          return;
        }

        const tasks = convertICSEventsToTasks(events);
        onTasksParsed(tasks);
      } catch (parseError) {
        onError('Failed to parse ICS file: ' + parseError.message);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      onError('Failed to read file');
      setLoading(false);
    };

    reader.readAsText(icsFile);
  };

  return (
    <div className="ics-import-section">
      <div className="form-group">
        <label>Or import meetings from .ICS file:</label>
        <input
          type="file"
          accept=".ics"
          onChange={handleFileSelect}
          className="ics-file-input"
        />
      </div>
      {icsFile && (
        <button 
          className="btn-import-ics" 
          onClick={handleICSImport}
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import ICS File'}
        </button>
      )}
    </div>
  );
}
