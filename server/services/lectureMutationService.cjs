const { getPool } = require('../db.cjs');
const { parseDuration } = require('../utils/durationHelper.cjs');

const createLecture = async (data) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const {
    lecture_id,
    title,
    year,
    duration,
    section_no,
    section,
    sub_section,
    status = 'pending',
    scheduled_date,
    notes
  } = data;

  if (!title || !title.trim()) {
    throw new Error('Lecture title is required');
  }

  const parsedDur = parseDuration(duration);

  const [result] = await pool.query(
    `INSERT INTO lectures 
      (lecture_id, title, year, duration, duration_seconds, section_no, section, sub_section, status, scheduled_date, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lecture_id ? String(lecture_id).trim() : null,
      title.trim(),
      year ? String(year).trim() : null,
      parsedDur.text,
      parsedDur.seconds,
      section_no ? String(section_no).trim() : null,
      section ? String(section).trim() : null,
      sub_section ? String(sub_section).trim() : null,
      status || 'pending',
      scheduled_date || null,
      notes || null
    ]
  );

  const [createdRows] = await pool.query('SELECT * FROM lectures WHERE id = ?', [result.insertId]);
  return createdRows[0];
};

const updateLecture = async (id, data) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  const {
    lecture_id,
    title,
    year,
    duration,
    section_no,
    section,
    sub_section,
    status,
    scheduled_date,
    completed_date,
    notes,
    transcript
  } = data;

  if (!title || !title.trim()) {
    throw new Error('Lecture title cannot be empty');
  }

  const parsedDur = parseDuration(duration);

  await pool.query(
    `UPDATE lectures SET 
      lecture_id = ?,
      title = ?,
      year = ?,
      duration = ?,
      duration_seconds = ?,
      section_no = ?,
      section = ?,
      sub_section = ?,
      status = ?,
      scheduled_date = ?,
      completed_date = ?,
      notes = ?,
      transcript = COALESCE(?, transcript)
     WHERE id = ?`,
    [
      lecture_id ? String(lecture_id).trim() : null,
      title.trim(),
      year ? String(year).trim() : null,
      parsedDur.text,
      parsedDur.seconds,
      section_no ? String(section_no).trim() : null,
      section ? String(section).trim() : null,
      sub_section ? String(sub_section).trim() : null,
      status || 'pending',
      scheduled_date || null,
      completed_date || null,
      notes || null,
      transcript !== undefined ? transcript : null,
      id
    ]
  );

  const [updatedRows] = await pool.query('SELECT * FROM lectures WHERE id = ?', [id]);
  return updatedRows[0];
};

const deleteLecture = async (id) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query('DELETE FROM lectures WHERE id = ?', [id]);
  return { success: true };
};

module.exports = {
  createLecture,
  updateLecture,
  deleteLecture
};
