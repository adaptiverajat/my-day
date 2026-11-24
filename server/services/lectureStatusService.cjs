const { getPool, formatDateOnly } = require('../db.cjs');

const updateLectureTranscript = async (id, transcript) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  await pool.query(
    'UPDATE lectures SET transcript = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR lecture_id = ?',
    [transcript !== undefined ? transcript : null, id, id]
  );

  const [updatedRows] = await pool.query(
    'SELECT id, lecture_id, title, transcript FROM lectures WHERE id = ? OR lecture_id = ? LIMIT 1',
    [id, id]
  );
  return updatedRows[0] || null;
};

const toggleLectureStatus = async (id, explicitStatus = null) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  let status = explicitStatus;
  if (!status) {
    const [curr] = await pool.query('SELECT status FROM lectures WHERE id = ?', [id]);
    if (curr.length === 0) return null;
    status = curr[0].status === 'completed' ? 'pending' : 'completed';
  }

  const completed_date = status === 'completed' ? formatDateOnly(new Date()) : null;

  await pool.query(
    'UPDATE lectures SET status = ?, completed_date = ? WHERE id = ?',
    [status, completed_date, id]
  );

  const [updatedRows] = await pool.query('SELECT * FROM lectures WHERE id = ?', [id]);
  return updatedRows[0];
};

module.exports = {
  updateLectureTranscript,
  toggleLectureStatus
};
