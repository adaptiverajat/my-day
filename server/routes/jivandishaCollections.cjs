const express = require('express');
const {
  getIndividualCollections, createIndividualCollection, bulkCreateIndividualCollections,
  updateIndividualCollection, deleteIndividualCollection, bulkDeleteIndividualCollections,
  mergeIndividualCollections
} = require('../services/collectionsDbService.cjs');

const router = express.Router();

router.get('/individual-collections', async (req, res) => {
  try {
    const data = await getIndividualCollections(req.query.search);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching individual collections:', error);
    res.status(500).json({ success: false, message: 'Error fetching collections', error: error.message });
  }
});

router.post('/individual-collections', async (req, res) => {
  try {
    const id = await createIndividualCollection(req.body);
    res.json({ success: true, message: 'Individual collection saved successfully', id });
  } catch (error) {
    console.error('Error adding individual collection:', error);
    res.status(500).json({ success: false, message: error.message || 'Error adding collection' });
  }
});

router.post('/individual-collections/bulk', async (req, res) => {
  try {
    const { records = [] } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided for bulk insert' });
    }
    const count = await bulkCreateIndividualCollections(records);
    res.json({ success: true, message: `Successfully saved ${count} records`, inserted_count: count });
  } catch (error) {
    console.error('Error bulk saving individual collections:', error);
    res.status(500).json({ success: false, message: 'Error bulk saving', error: error.message });
  }
});

router.put('/individual-collections/:id', async (req, res) => {
  try {
    await updateIndividualCollection(req.params.id, req.body);
    res.json({ success: true, message: 'Individual collection updated successfully' });
  } catch (error) {
    console.error('Error updating individual collection:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating collection' });
  }
});

router.delete('/individual-collections/:id', async (req, res) => {
  try {
    await deleteIndividualCollection(req.params.id);
    res.json({ success: true, message: 'Individual collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting individual collection:', error);
    res.status(500).json({ success: false, message: 'Error deleting collection', error: error.message });
  }
});

router.post('/individual-collections/bulk-delete', async (req, res) => {
  try {
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided for deletion' });
    }
    await bulkDeleteIndividualCollections(ids);
    res.json({ success: true, message: `Deleted ${ids.length} records`, deleted_count: ids.length });
  } catch (error) {
    console.error('Error bulk deleting individual collections:', error);
    res.status(500).json({ success: false, message: 'Error bulk deleting', error: error.message });
  }
});

router.post('/individual-collections/merge', async (req, res) => {
  try {
    const { primary_id, duplicate_id, merged_fields } = req.body;
    const primId = parseInt(primary_id, 10);
    const dupId = parseInt(duplicate_id, 10);
    if (!primId || !dupId || primId === dupId) {
      return res.status(400).json({ success: false, message: 'Two distinct IDs required' });
    }
    await mergeIndividualCollections(primId, dupId, merged_fields);
    res.json({ success: true, message: 'Individual collection records merged successfully', primary_id: primId });
  } catch (error) {
    console.error('Error merging individual collection records:', error);
    res.status(500).json({ success: false, message: error.message || 'Error merging records' });
  }
});

module.exports = router;
