import React, { useState, useEffect } from 'react';

export default function LectureModal({ isOpen, onClose, lecture, onSave }) {
  const [formData, setFormData] = useState({
    lecture_id: '',
    title: '',
    year: '',
    duration: '00:00:00',
    section_no: '',
    section: '',
    sub_section: '',
    status: 'pending',
    scheduled_date: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lecture) {
      setFormData({
        lecture_id: lecture.lecture_id || '',
        title: lecture.title || '',
        year: lecture.year || '',
        duration: lecture.duration || '00:00:00',
        section_no: lecture.section_no || '',
        section: lecture.section || '',
        sub_section: lecture.sub_section || '',
        status: lecture.status || 'pending',
        scheduled_date: lecture.scheduled_date || '',
        notes: lecture.notes || ''
      });
    } else {
      setFormData({
        lecture_id: '',
        title: '',
        year: String(new Date().getFullYear()),
        duration: '00:45:00',
        section_no: '',
        section: '',
        sub_section: '',
        status: 'pending',
        scheduled_date: '',
        notes: ''
      });
    }
    setError('');
  }, [lecture, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Lecture title is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving lecture:', err);
      setError(err.message || 'Failed to save lecture');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lecture-modal-overlay" onClick={onClose}>
      <div className="lecture-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{lecture ? '✏️ Edit Lecture' : '➕ Add New Lecture'}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="lecture-form-grid">
              <div className="form-group-item">
                <label>Lecture ID</label>
                <input
                  type="text"
                  value={formData.lecture_id}
                  onChange={(e) => setFormData({ ...formData, lecture_id: e.target.value })}
                  placeholder="e.g. 1 or L-01"
                />
                <span className="form-hint">Unique lecture reference ID</span>
              </div>

              <div className="form-group-item">
                <label>Year</label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g. 2024"
                />
              </div>

              <div className="form-group-item form-full">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter full lecture title or topic"
                  required
                />
              </div>

              <div className="form-group-item">
                <label>Duration (hh:mm:ss)</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="01:15:30"
                />
                <span className="form-hint">Format: hh:mm:ss or mm:ss</span>
              </div>

              <div className="form-group-item">
                <label>Section No.</label>
                <input
                  type="text"
                  value={formData.section_no}
                  onChange={(e) => setFormData({ ...formData, section_no: e.target.value })}
                  placeholder="e.g. 1 or 2.1"
                />
              </div>

              <div className="form-group-item">
                <label>Section</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g. Part 1: Philosophy"
                />
              </div>

              <div className="form-group-item">
                <label>Sub-section</label>
                <input
                  type="text"
                  value={formData.sub_section}
                  onChange={(e) => setFormData({ ...formData, sub_section: e.target.value })}
                  placeholder="e.g. Chapter 3: Fundamentals"
                />
              </div>

              <div className="form-group-item">
                <label>Hearing Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">⏳ Pending (Not Heard)</option>
                  <option value="completed">✅ Completed (Heard)</option>
                </select>
              </div>

              <div className="form-group-item">
                <label>Scheduled Hearing Date</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="form-group-item form-full">
                <label>Notes / Reflections</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key takeaways, audio link, or notes..."
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="lec-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="lec-btn primary" disabled={saving}>
              {saving ? 'Saving...' : lecture ? 'Update Lecture' : 'Create Lecture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
