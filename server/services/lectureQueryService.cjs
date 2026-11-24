const path = require('path');
const { getPool, formatDateOnly } = require('../db.cjs');
const { formatSecondsHuman } = require('../utils/durationHelper.cjs');
const {
  DEFAULT_AUDIO_DIR,
  getCurrentAudioDir,
  getAudioFilesSet,
  checkHasAudio
} = require('./lectureAudioService.cjs');

const getLecturesWithSummary = async ({ section, year, status, search, directory }) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');

  let query = 'SELECT * FROM lectures WHERE 1=1';
  const params = [];
  if (section) { query += ' AND section = ?'; params.push(section); }
  if (year) { query += ' AND year = ?'; params.push(year); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) {
    query += ' AND (title LIKE ? OR lecture_id LIKE ? OR section LIKE ? OR sub_section LIKE ? OR notes LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }
  query += ' ORDER BY CAST(section_no AS UNSIGNED) ASC, section_no ASC, id ASC';

  const [rows] = await pool.query(query, params);
  const [allRows] = await pool.query('SELECT status, duration_seconds, section, year FROM lectures');

  let totalSeconds = 0;
  let completedSeconds = 0;
  let completedCount = 0;
  const sectionsSet = new Set();
  const yearsSet = new Set();

  allRows.forEach(row => {
    const sec = Number(row.duration_seconds) || 0;
    totalSeconds += sec;
    if (row.status === 'completed') {
      completedCount++;
      completedSeconds += sec;
    }
    if (row.section) sectionsSet.add(row.section.trim());
    if (row.year) yearsSet.add(String(row.year).trim());
  });

  const totalCount = allRows.length;
  const pendingCount = totalCount - completedCount;
  const pendingSeconds = Math.max(0, totalSeconds - completedSeconds);
  const completionRate = totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(1)) : 0;

  const activeDir = directory ? String(directory).trim() : getCurrentAudioDir();
  const audioFilesSet = getAudioFilesSet(activeDir);
  const driveConnected = !!audioFilesSet;

  const lectures = rows.map(r => ({
    ...r,
    scheduled_date: formatDateOnly(r.scheduled_date),
    completed_date: formatDateOnly(r.completed_date),
    hasAudio: checkHasAudio(audioFilesSet, r.lecture_id || r.id),
    audioPath: path.join(activeDir, `${r.lecture_id || r.id}.mp3`)
  }));

  return {
    driveConnected,
    audioDirectory: activeDir,
    lectures,
    summary: {
      totalCount,
      totalSeconds,
      totalDurationFormatted: formatSecondsHuman(totalSeconds),
      completedCount,
      completedSeconds,
      completedDurationFormatted: formatSecondsHuman(completedSeconds),
      pendingCount,
      pendingSeconds,
      pendingDurationFormatted: formatSecondsHuman(pendingSeconds),
      completionRate,
      sections: Array.from(sectionsSet).sort(),
      years: Array.from(yearsSet).sort(),
      driveConnected,
      audioDirectory: DEFAULT_AUDIO_DIR
    }
  };
};

const getLectureTranscript = async (id) => {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  const [rows] = await pool.query(
    'SELECT id, lecture_id, title, transcript FROM lectures WHERE id = ? OR lecture_id = ? LIMIT 1',
    [id, id]
  );
  return rows[0] || null;
};

module.exports = {
  getLecturesWithSummary,
  getLectureTranscript
};
