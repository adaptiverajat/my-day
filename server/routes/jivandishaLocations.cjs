const express = require('express');
const {
  getLocations, createLocation, updateLocation, updateFollowUp, deleteLocation, mergeLocations
} = require('../services/locationsDbService.cjs');

const router = express.Router();

router.get('/locations', async (req, res) => {
  try {
    const locations = await getLocations(req.query.country);
    res.json({ success: true, locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, message: 'Error fetching locations', error: error.message });
  }
});

router.post('/locations', async (req, res) => {
  try {
    const { title, lat, lng } = req.body;
    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Title, latitude, and longitude are required' });
    }
    const location = await createLocation(req.body);
    res.json({ success: true, id: location.id, location });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ success: false, message: 'Error adding location', error: error.message });
  }
});

router.put('/locations/:id', async (req, res) => {
  try {
    await updateLocation(req.params.id, req.body);
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ success: false, message: 'Error updating location', error: error.message });
  }
});

router.put('/locations/:id/follow-up', async (req, res) => {
  try {
    await updateFollowUp(req.params.id, req.body);
    res.json({ success: true, message: 'Follow-up details updated successfully' });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ success: false, message: 'Error updating follow-up', error: error.message });
  }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    await deleteLocation(req.params.id);
    res.json({ success: true, message: 'Location and history deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ success: false, message: 'Error deleting location', error: error.message });
  }
});

router.post('/locations/merge', async (req, res) => {
  try {
    const { primary_id, duplicate_id, merged_fields } = req.body;
    const primId = parseInt(primary_id, 10);
    const dupId = parseInt(duplicate_id, 10);
    if (!primId || !dupId || primId === dupId) {
      return res.status(400).json({ success: false, message: 'Two distinct location IDs required.' });
    }
    await mergeLocations(primId, dupId, merged_fields);
    res.json({ success: true, message: 'Locations merged successfully.', primary_id: primId });
  } catch (error) {
    console.error('Error merging locations:', error);
    res.status(500).json({ success: false, message: error.message || 'Error merging locations' });
  }
});

module.exports = router;
