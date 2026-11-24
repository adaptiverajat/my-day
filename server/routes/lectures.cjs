const express = require('express');
const router = express.Router();

const {
  checkDriveStatus,
  streamAudioFile
} = require('../services/lectureAudioService.cjs');
const {
  getLecturesWithSummary,
  getLectureTranscript
} = require('../services/lectureQueryService.cjs');
const {
  createLecture,
  updateLecture,
  deleteLecture
} = require('../services/lectureMutationService.cjs');
const {
  bulkImportLectures,
  bulkDeleteLectures,
  clearAllLectures
} = require('../services/lectureImportService.cjs');
const {
  updateLectureTranscript,
  toggleLectureStatus
} = require('../services/lectureStatusService.cjs');

const asyncHandler = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error('Lecture route error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
  });
};

// GET /api/lectures/drive-status - check if drive & audio directory exist
router.get('/drive-status', (req, res) => {
  try {
    const status = checkDriveStatus(req.query.directory ? String(req.query.directory).trim() : '');
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/lectures/audio/:lectureId - stream MP3 audio with HTTP Range support
router.get('/audio/:lectureId', (req, res) => {
  try {
    streamAudioFile(req.params.lectureId, req.query.directory, req, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/lectures - list all lectures with stats
router.get('/', asyncHandler(async (req, res) => {
  const data = await getLecturesWithSummary(req.query);
  res.json({ success: true, ...data });
}));

// POST /api/lectures - create single lecture
router.post('/', asyncHandler(async (req, res) => {
  const lecture = await createLecture(req.body);
  res.status(201).json({ success: true, lecture });
}));

// POST /api/lectures/bulk - import multiple lectures from excel
router.post('/bulk', asyncHandler(async (req, res) => {
  const result = await bulkImportLectures(req.body.lectures, req.body.mode);
  res.json({
    success: true,
    message: `Successfully imported ${result.affectedRows} lectures`,
    importedCount: result.affectedRows
  });
}));

// PUT /api/lectures/:id - update lecture
router.put('/:id', asyncHandler(async (req, res) => {
  const lecture = await updateLecture(req.params.id, req.body);
  res.json({ success: true, lecture });
}));

// PATCH /api/lectures/:id/transcript - save transcript for a lecture
router.patch('/:id/transcript', asyncHandler(async (req, res) => {
  const lecture = await updateLectureTranscript(req.params.id, req.body.transcript);
  if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });
  res.json({ success: true, message: 'Transcript saved successfully', lecture });
}));

// GET /api/lectures/:id/transcript - get transcript for a lecture
router.get('/:id/transcript', asyncHandler(async (req, res) => {
  const lecture = await getLectureTranscript(req.params.id);
  if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });
  res.json({ success: true, transcript: lecture.transcript || '' });
}));

// PATCH /api/lectures/:id/status - toggle or set status
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const lecture = await toggleLectureStatus(req.params.id, req.body.status);
  if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });
  res.json({ success: true, lecture });
}));

// DELETE /api/lectures/:id - delete single lecture
router.delete('/:id', asyncHandler(async (req, res) => {
  await deleteLecture(req.params.id);
  res.json({ success: true, message: 'Lecture deleted successfully' });
}));

// POST /api/lectures/bulk-delete - delete multiple lectures
router.post('/bulk-delete', asyncHandler(async (req, res) => {
  const result = await bulkDeleteLectures(req.body.ids);
  res.json({ success: true, message: `Deleted ${result.deletedCount} lectures successfully` });
}));

// POST /api/lectures/clear - clear all lectures
router.post('/clear', asyncHandler(async (req, res) => {
  await clearAllLectures();
  res.json({ success: true, message: 'All lectures cleared successfully' });
}));

module.exports = router;
