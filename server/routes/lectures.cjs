const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool, formatDateOnly } = require('../db.cjs');

const DEFAULT_AUDIO_DIR = 'E:\\MaharajLectures';
let currentAudioDir = DEFAULT_AUDIO_DIR;

// Locate audio file in configured directory for a given lecture ID
const findAudioFile = (lectureId, dirOverride = null) => {
  if (!lectureId) return null;
  const idStr = String(lectureId).trim();
  const targetDir = (dirOverride && String(dirOverride).trim()) ? String(dirOverride).trim() : currentAudioDir;
  if (!fs.existsSync(targetDir)) return null;

  const candidateNames = [
    `${idStr}.mp3`,
    `${idStr.padStart(4, '0')}.mp3`,
    `${idStr.padStart(3, '0')}.mp3`,
    `${idStr.replace(/^0+/, '')}.mp3`,
    `Lecture_${idStr}.mp3`,
    `Lecture-${idStr}.mp3`
  ];

  for (const name of candidateNames) {
    const fullPath = path.join(targetDir, name);
    if (fs.existsSync(fullPath)) {
      return { filePath: fullPath, fileName: name };
    }
  }

  return null;
};

// Utility to normalize duration into 'hh:mm:ss' and total seconds
const parseDuration = (val) => {
  if (val === null || val === undefined || val === '') {
    return { text: '00:00:00', seconds: 0 };
  }

  if (typeof val === 'number') {
    // Check if Excel fractional day (< 1) or seconds or decimal hours
    let totalSec = 0;
    if (val < 1) {
      totalSec = Math.round(val * 86400);
    } else if (val > 1000) {
      totalSec = Math.round(val);
    } else {
      totalSec = Math.round(val * 3600);
    }
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return {
      text: [h, m, s].map(n => String(n).padStart(2, '0')).join(':'),
      seconds: totalSec
    };
  }

  const str = String(val).trim();
  const parts = str.split(':').map(p => parseInt(p, 10) || 0);
  let totalSec = 0;
  if (parts.length === 3) {
    totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSec = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    totalSec = parts[0];
  }

  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return {
    text: [h, m, s].map(n => String(n).padStart(2, '0')).join(':'),
    seconds: totalSec
  };
};

const formatSecondsHuman = (totalSec) => {
  if (!totalSec || totalSec <= 0) return '0h 0m';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return s > 0 ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
};

// GET /api/lectures/drive-status - check if drive & audio directory exist
router.get('/drive-status', (req, res) => {
  try {
    const queryDir = req.query.directory ? String(req.query.directory).trim() : '';
    if (queryDir) {
      currentAudioDir = queryDir;
    }
    const targetDir = currentAudioDir || DEFAULT_AUDIO_DIR;

    const parsed = path.parse(targetDir);
    const rootDrive = parsed.root || (targetDir.includes(':') ? targetDir.slice(0, 3) : '');
    const drivePresent = rootDrive ? fs.existsSync(rootDrive) : true;
    const directoryPresent = fs.existsSync(targetDir);

    let fileCount = 0;
    if (directoryPresent) {
      try {
        const files = fs.readdirSync(targetDir);
        fileCount = files.filter(f => f.toLowerCase().endsWith('.mp3')).length;
      } catch (err) {
        console.warn(`Could not read directory ${targetDir}:`, err.message);
      }
    }

    res.json({
      success: true,
      connected: directoryPresent,
      drivePresent,
      directoryPresent,
      drive: rootDrive,
      directory: targetDir,
      fileCount
    });
  } catch (error) {
    console.error('Error checking drive status:', error);
    res.status(500).json({ success: false, message: 'Error checking drive status', error: error.message });
  }
});

// GET /api/lectures/audio/:lectureId - stream MP3 audio with HTTP Range support
router.get('/audio/:lectureId', (req, res) => {
  try {
    const { lectureId } = req.params;
    const dirOverride = req.query.directory ? String(req.query.directory).trim() : currentAudioDir;
    const fileInfo = findAudioFile(lectureId, dirOverride);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: `Audio file for ID "${lectureId}" not found in ${dirOverride}`,
        expectedPath: path.join(dirOverride, `${lectureId}.mp3`)
      });
    }

    const stat = fs.statSync(fileInfo.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(fileInfo.filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg'
      };
      res.writeHead(206, head);
      fileStream.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(fileInfo.filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming audio:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream audio', error: error.message });
    }
  }
});

// GET /api/lectures - list all lectures with stats
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized' });
    }

    const { section, year, status, search } = req.query;
    let query = 'SELECT * FROM lectures WHERE 1=1';
    const params = [];

    if (section) {
      query += ' AND section = ?';
      params.push(section);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (title LIKE ? OR lecture_id LIKE ? OR section LIKE ? OR sub_section LIKE ? OR notes LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY CAST(section_no AS UNSIGNED) ASC, section_no ASC, id ASC';

    const [rows] = await pool.query(query, params);

    // Compute summary stats across all lectures (unfiltered or from full table)
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

    // Check if configured directory is present to verify audio presence for each lecture
    const activeDir = req.query.directory ? String(req.query.directory).trim() : currentAudioDir;
    let audioFilesSet = null;
    let driveConnected = false;
    if (fs.existsSync(activeDir)) {
      try {
        audioFilesSet = new Set(fs.readdirSync(activeDir).map(f => f.toLowerCase()));
        driveConnected = true;
      } catch (e) {}
    }

    const checkHasAudio = (lecId) => {
      if (!audioFilesSet || !lecId) return false;
      const idStr = String(lecId).trim().toLowerCase();
      return (
        audioFilesSet.has(`${idStr}.mp3`) ||
        audioFilesSet.has(`${idStr.padStart(4, '0')}.mp3`) ||
        audioFilesSet.has(`${idStr.padStart(3, '0')}.mp3`) ||
        audioFilesSet.has(`${idStr.replace(/^0+/, '')}.mp3`)
      );
    };

    res.json({
      success: true,
      driveConnected,
      audioDirectory: activeDir,
      lectures: rows.map(r => ({
        ...r,
        scheduled_date: formatDateOnly(r.scheduled_date),
        completed_date: formatDateOnly(r.completed_date),
        hasAudio: checkHasAudio(r.lecture_id || r.id),
        audioPath: path.join(activeDir, `${r.lecture_id || r.id}.mp3`)
      })),
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
    });
  } catch (error) {
    console.error('Error fetching lectures:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lectures', error: error.message });
  }
});

// POST /api/lectures - create single lecture
router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

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
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Lecture title is required' });
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
    res.status(201).json({ success: true, lecture: createdRows[0] });
  } catch (error) {
    console.error('Error creating lecture:', error);
    res.status(500).json({ success: false, message: 'Failed to create lecture', error: error.message });
  }
});

// POST /api/lectures/bulk - import multiple lectures from excel
router.post('/bulk', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { lectures, mode = 'append' } = req.body;

    if (!Array.isArray(lectures) || lectures.length === 0) {
      return res.status(400).json({ success: false, message: 'No lecture records provided for import' });
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
      return res.status(400).json({ success: false, message: 'No valid lecture rows found with titles' });
    }

    const query = `
      INSERT INTO lectures 
        (lecture_id, title, year, duration, duration_seconds, section_no, section, sub_section, status, scheduled_date, notes) 
      VALUES ?
    `;

    const [result] = await pool.query(query, [values]);

    res.json({
      success: true,
      message: `Successfully imported ${result.affectedRows} lectures`,
      importedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error bulk importing lectures:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk import lectures', error: error.message });
  }
});

// PUT /api/lectures/:id - update lecture
router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
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
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Lecture title cannot be empty' });
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
    res.json({ success: true, lecture: updatedRows[0] });
  } catch (error) {
    console.error('Error updating lecture:', error);
    res.status(500).json({ success: false, message: 'Failed to update lecture', error: error.message });
  }
});

// PATCH /api/lectures/:id/transcript - save transcript for a lecture
router.patch('/:id/transcript', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
    const { transcript } = req.body;

    await pool.query(
      'UPDATE lectures SET transcript = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? OR lecture_id = ?',
      [transcript !== undefined ? transcript : null, id, id]
    );

    const [updatedRows] = await pool.query('SELECT id, lecture_id, title, transcript FROM lectures WHERE id = ? OR lecture_id = ? LIMIT 1', [id, id]);
    if (updatedRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    res.json({
      success: true,
      message: 'Transcript saved successfully',
      lecture: updatedRows[0]
    });
  } catch (error) {
    console.error('Error saving lecture transcript:', error);
    res.status(500).json({ success: false, message: 'Failed to save transcript', error: error.message });
  }
});

// GET /api/lectures/:id/transcript - get transcript for a lecture
router.get('/:id/transcript', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, lecture_id, title, transcript FROM lectures WHERE id = ? OR lecture_id = ? LIMIT 1', [id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    res.json({ success: true, transcript: rows[0].transcript || '' });
  } catch (error) {
    console.error('Error getting lecture transcript:', error);
    res.status(500).json({ success: false, message: 'Failed to get transcript', error: error.message });
  }
});

// PATCH /api/lectures/:id/status - toggle or set status
router.patch('/:id/status', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
    let { status } = req.body;

    if (!status) {
      // Toggle if not provided
      const [curr] = await pool.query('SELECT status FROM lectures WHERE id = ?', [id]);
      if (curr.length === 0) return res.status(404).json({ success: false, message: 'Lecture not found' });
      status = curr[0].status === 'completed' ? 'pending' : 'completed';
    }

    const completed_date = status === 'completed' ? formatDateOnly(new Date()) : null;

    await pool.query(
      'UPDATE lectures SET status = ?, completed_date = ? WHERE id = ?',
      [status, completed_date, id]
    );

    const [updatedRows] = await pool.query('SELECT * FROM lectures WHERE id = ?', [id]);
    res.json({ success: true, lecture: updatedRows[0] });
  } catch (error) {
    console.error('Error updating lecture status:', error);
    res.status(500).json({ success: false, message: 'Failed to update lecture status', error: error.message });
  }
});

// DELETE /api/lectures/:id - delete single lecture
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { id } = req.params;
    await pool.query('DELETE FROM lectures WHERE id = ?', [id]);
    res.json({ success: true, message: 'Lecture deleted successfully' });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lecture', error: error.message });
  }
});

// POST /api/lectures/bulk-delete - delete multiple lectures
router.post('/bulk-delete', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No lecture ids provided' });
    }

    await pool.query('DELETE FROM lectures WHERE id IN (?)', [ids]);
    res.json({ success: true, message: `Deleted ${ids.length} lectures successfully` });
  } catch (error) {
    console.error('Error bulk deleting lectures:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk delete lectures', error: error.message });
  }
});

// POST /api/lectures/clear - clear all lectures
router.post('/clear', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not initialized' });

    await pool.query('TRUNCATE TABLE lectures');
    res.json({ success: true, message: 'All lectures cleared successfully' });
  } catch (error) {
    console.error('Error clearing lectures:', error);
    res.status(500).json({ success: false, message: 'Failed to clear lectures', error: error.message });
  }
});

module.exports = router;
