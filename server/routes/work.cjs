const express = require('express');
const {
  fetchWorkColumnsWithItems,
  createWorkColumn,
  updateWorkColumn,
  deleteWorkColumn,
  reorderWorkColumns,
  createWorkItem,
  updateWorkItem,
  deleteWorkItem
} = require('../services/workDbService.cjs');

const router = express.Router();

router.get('/columns', async (req, res) => {
  try {
    const columns = await fetchWorkColumnsWithItems();
    res.json({ success: true, columns });
  } catch (error) {
    console.error('Error fetching work columns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/columns', async (req, res) => {
  try {
    const id = await createWorkColumn(req.body.title, req.body.color);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error creating work column:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/columns/:id', async (req, res) => {
  try {
    await updateWorkColumn(req.params.id, req.body.title, req.body.color);
    res.json({ success: true, message: 'Column updated' });
  } catch (error) {
    console.error('Error updating work column:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/columns/:id', async (req, res) => {
  try {
    await deleteWorkColumn(req.params.id);
    res.json({ success: true, message: 'Column deleted' });
  } catch (error) {
    console.error('Error deleting work column:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/columns/reorder', async (req, res) => {
  try {
    await reorderWorkColumns(req.body.columnIds);
    res.json({ success: true, message: 'Columns reordered' });
  } catch (error) {
    console.error('Error reordering work columns:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { columnId, text, notes } = req.body;
    const id = await createWorkItem(columnId, text, notes);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error creating work item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    await updateWorkItem(req.params.id, req.body);
    res.json({ success: true, message: 'Item updated' });
  } catch (error) {
    console.error('Error updating work item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    await deleteWorkItem(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting work item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
