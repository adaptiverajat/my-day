const express = require('express');
const { getPool, formatDateOnly } = require('../db.cjs');

const router = express.Router();

// Health log endpoints
router.get('/health-logs', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const [rows] = await pool.query('SELECT * FROM health_logs ORDER BY log_date ASC');
    const logs = rows.map(log => ({
      id: log.id,
      date: new Date(`${log.log_date}T00:00:00`),
      sleepTime: log.sleep_time,
      sleepDuration: Number(log.sleep_duration),
      workoutTime: log.workout_time,
      workoutDuration: Number(log.workout_duration || 0),
      meals: typeof log.meals === 'string' ? JSON.parse(log.meals) : (log.meals || [])
    }));

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching health logs:', error);
    res.status(500).json({ success: false, message: 'Error fetching health logs', error: error.message });
  }
});

router.post('/health-logs', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }

    const { date, sleepTime, sleepDuration, workoutTime, workoutDuration, meals } = req.body;
    const logDate = formatDateOnly(date);

    if (!logDate) {
      return res.status(400).json({ success: false, message: 'Health log date is required' });
    }

    const payloadMeals = Array.isArray(meals) ? meals : [];

    await pool.query(`
      INSERT INTO health_logs (log_date, sleep_time, sleep_duration, workout_time, workout_duration, meals)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sleep_time = VALUES(sleep_time),
        sleep_duration = VALUES(sleep_duration),
        workout_time = VALUES(workout_time),
        workout_duration = VALUES(workout_duration),
        meals = VALUES(meals),
        updated_at = CURRENT_TIMESTAMP
    `, [
      logDate,
      sleepTime,
      Number(sleepDuration || 0),
      workoutTime || null,
      Number(workoutDuration || 0),
      JSON.stringify(payloadMeals)
    ]);

    const [rows] = await pool.query('SELECT * FROM health_logs WHERE log_date = ?', [logDate]);
    const savedLog = rows[0];

    res.json({
      success: true,
      log: {
        id: savedLog.id,
        date: new Date(`${savedLog.log_date}T00:00:00`),
        sleepTime: savedLog.sleep_time,
        sleepDuration: Number(savedLog.sleep_duration),
        workoutTime: savedLog.workout_time,
        workoutDuration: Number(savedLog.workout_duration || 0),
        meals: typeof savedLog.meals === 'string' ? JSON.parse(savedLog.meals) : (savedLog.meals || [])
      }
    });
  } catch (error) {
    console.error('Error saving health log:', error);
    res.status(500).json({ success: false, message: 'Error saving health log', error: error.message });
  }
});

module.exports = router;
