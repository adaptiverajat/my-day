import { useState, useEffect } from 'react';

const INITIAL_SUMMARY = {
  totalCount: 0, totalSeconds: 0, totalDurationFormatted: '0h 0m',
  completedCount: 0, completedSeconds: 0, completedDurationFormatted: '0h 0m',
  pendingCount: 0, pendingSeconds: 0, pendingDurationFormatted: '0h 0m',
  completionRate: 0, sections: [], years: []
};

export function useLectureData() {
  const [lectures, setLectures] = useState([]);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/lectures');
      const data = await response.json();
      if (data.success) {
        setLectures(data.lectures || []);
        if (data.summary) setSummary(data.summary);
      } else {
        setError(data.message || 'Failed to load lectures');
      }
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Could not connect to lectures API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const response = await fetch(`http://localhost:3001/api/lectures/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchLectures();
        showToast(newStatus === 'completed' ? 'Marked as completed!' : 'Marked as pending');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleSaveLecture = async (formData, editingLecture) => {
    const url = editingLecture ? `http://localhost:3001/api/lectures/${editingLecture.id}` : 'http://localhost:3001/api/lectures';
    const method = editingLecture ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Operation failed');
    showToast(editingLecture ? 'Lecture updated successfully' : 'New lecture added successfully');
    fetchLectures();
  };

  const handleDeleteLecture = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete lecture "${title}"?`)) return;
    try {
      const response = await fetch(`http://localhost:3001/api/lectures/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Lecture deleted');
        fetchLectures();
      }
    } catch (err) {
      console.error('Error deleting lecture:', err);
      alert('Failed to delete lecture: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL lectures in the hearing schedule. Are you sure?')) return;
    try {
      const response = await fetch('http://localhost:3001/api/lectures/clear', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        showToast('All lectures cleared');
        fetchLectures();
      }
    } catch (err) {
      console.error('Error clearing lectures:', err);
      alert('Failed to clear lectures: ' + err.message);
    }
  };

  const handleSaveTranscript = async (id, transcriptText) => {
    const response = await fetch(`http://localhost:3001/api/lectures/${id}/transcript`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: transcriptText })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to save transcript');
    setLectures((prev) => prev.map((lec) => (lec.id === id ? { ...lec, transcript: transcriptText } : lec)));
    showToast('✓ Transcript saved to database!');
  };

  return {
    lectures, summary, loading, error, notification, showToast,
    fetchLectures, handleToggleStatus, handleSaveLecture,
    handleDeleteLecture, handleClearAll, handleSaveTranscript
  };
}
