const express = require('express');
const {
  fetchCalendarTasks,
  createCalendarTask,
  deleteCalendarTask,
  updateCalendarTask
} = require('../services/taskDbService.cjs');
const todoItemsRouter = require('./todoItems.cjs');

const router = express.Router();

// Mount todo-items router
router.use('/todo-items', todoItemsRouter);

// GET /api/calendar-tasks & GET /api/tasks
const handleGetTasks = async (req, res) => {
  try {
    const tasks = await fetchCalendarTasks(req.query.startDate, req.query.endDate);
    res.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get('/calendar-tasks', handleGetTasks);
router.get('/tasks', handleGetTasks);

// POST /api/calendar-tasks
router.post('/calendar-tasks', async (req, res) => {
  try {
    const result = await createCalendarTask(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error adding calendar task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/calendar-tasks/:id
router.delete('/calendar-tasks/:id', async (req, res) => {
  try {
    const result = await deleteCalendarTask(req.params.id, req.query.mode);
    if (result.notFound) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/calendar-tasks/:id
router.put('/calendar-tasks/:id', async (req, res) => {
  try {
    const result = await updateCalendarTask(req.params.id, req.body);
    if (result.notFound) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: result.message || 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating calendar task:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
