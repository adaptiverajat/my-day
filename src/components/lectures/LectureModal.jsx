import React, { useState, useEffect } from 'react';
import LectureFormFields from './LectureFormFields';

const DEFAULT_FORM = {
  lecture_id: '',
  title: '',
  year: '',
  duration: '00:45:00',
  section_no: '',
  section: '',
  sub_section: '',
  status: 'pending',
  scheduled_date: '',
  notes: ''
};

export default function LectureModal({ isOpen, onClose, lecture, onSave }) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
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
        ...DEFAULT_FORM,
        year: String(new Date().getFullYear())
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
            <LectureFormFields formData={formData} setFormData={setFormData} />

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
