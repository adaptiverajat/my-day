const { getPool } = require('../db.cjs');
const { parseDuration } = require('../utils/durationHelper.cjs');

const bulkImportLectures = async (lectures, mode = 'append') => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  if (!Array.isArray(lectures) || lectures.length === 0) {
    throw new Error('No lecture records provided for import');
  }

  if (mode === 'replace') {
    await pool.query('TRUNCATE TABLE lectures');
  }

  const values = [];
  for (const lec of lectures) {
    const title = (lec.title || lec.Title || '').trim();
    if (!title) continue;

    const lecture_id = lec.lecture_id !== undefined ? lec.lecture_id : (lec.id !== undefined ? lec.id : lec.ID);
    const year = lec.year || lec.Year;
    const rawDuration = lec.duration !== undefined ? lec.duration : (lec.Duration !== undefined ? lec.Duration : lec['Duration (hh:mm:ss)']);
    const parsedDur = parseDuration(rawDuration);

    const section_no = lec.section_no !== undefined ? lec.section_no : (lec['Section No.'] || lec['Section No'] || lec.sectionNo);
    const section = lec.section || lec.Section;
    const sub_section = lec.sub_section !== undefined ? lec.sub_section : (lec['Sub-section'] || lec.subsection || lec.SubSection);
    const status = lec.status || 'pending';
    const scheduled_date = lec.scheduled_date || null;
    const notes = lec.notes || null;

    values.push([
      lecture_id ? String(lecture_id).trim() : null,
      title,
      year ? String(year).trim() : null,
      parsedDur.text,
      parsedDur.seconds,
      section_no ? String(section_no).trim() : null,
      section ? String(section).trim() : null,
      sub_section ? String(sub_section).trim() : null,
      status,
      scheduled_date,
      notes
    ]);
  }

  if (values.length === 0) {
    throw new Error('No valid lecture rows found with titles');
  }

  const query = `
    INSERT INTO lectures 
      (lecture_id, title, year, duration, duration_seconds, section_no, section, sub_section, status, scheduled_date, notes) 
    VALUES ?
  `;

  const [result] = await pool.query(query, [values]);
  return { affectedRows: result.affectedRows };
};

const bulkDeleteLectures = async (ids) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('No lecture ids provided');
  }
  await pool.query('DELETE FROM lectures WHERE id IN (?)', [ids]);
  return { deletedCount: ids.length };
};

const clearAllLectures = async () => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query('TRUNCATE TABLE lectures');
  return { success: true };
};

module.exports = {
  bulkImportLectures,
  bulkDeleteLectures,
  clearAllLectures
};
