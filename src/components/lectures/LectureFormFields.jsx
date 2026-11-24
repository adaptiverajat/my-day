import React from 'react';

export default function LectureFormFields({ formData, setFormData }) {
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="lecture-form-grid">
      <div className="form-group-item">
        <label>Lecture ID</label>
        <input
          type="text"
          value={formData.lecture_id}
          onChange={(e) => updateField('lecture_id', e.target.value)}
          placeholder="e.g. 1 or L-01"
        />
        <span className="form-hint">Unique lecture reference ID</span>
      </div>

      <div className="form-group-item">
        <label>Year</label>
        <input
          type="text"
          value={formData.year}
          onChange={(e) => updateField('year', e.target.value)}
          placeholder="e.g. 2024"
        />
      </div>

      <div className="form-group-item form-full">
        <label>Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Enter full lecture title or topic"
          required
        />
      </div>

      <div className="form-group-item">
        <label>Duration (hh:mm:ss)</label>
        <input
          type="text"
          value={formData.duration}
          onChange={(e) => updateField('duration', e.target.value)}
          placeholder="01:15:30"
        />
        <span className="form-hint">Format: hh:mm:ss or mm:ss</span>
      </div>

      <div className="form-group-item">
        <label>Section No.</label>
        <input
          type="text"
          value={formData.section_no}
          onChange={(e) => updateField('section_no', e.target.value)}
          placeholder="e.g. 1 or 2.1"
        />
      </div>

      <div className="form-group-item">
        <label>Section</label>
        <input
          type="text"
          value={formData.section}
          onChange={(e) => updateField('section', e.target.value)}
          placeholder="e.g. Part 1: Philosophy"
        />
      </div>

      <div className="form-group-item">
        <label>Sub-section</label>
        <input
          type="text"
          value={formData.sub_section}
          onChange={(e) => updateField('sub_section', e.target.value)}
          placeholder="e.g. Chapter 3: Fundamentals"
        />
      </div>

      <div className="form-group-item">
        <label>Hearing Status</label>
        <select
          value={formData.status}
          onChange={(e) => updateField('status', e.target.value)}
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
          onChange={(e) => updateField('scheduled_date', e.target.value)}
        />
      </div>

      <div className="form-group-item form-full">
        <label>Notes / Reflections</label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Key takeaways, audio link, or notes..."
        />
      </div>
    </div>
  );
}
