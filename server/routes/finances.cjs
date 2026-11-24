const express = require('express');
const financesDb = require('../services/financesDbService.cjs');
const assetsDb = require('../services/assetsDbService.cjs');

const router = express.Router();

router.get('/initialize', async (req, res) => {
  try {
    await financesDb.initializeFinances();
    res.json({ success: true, message: 'Finances initialized' });
  } catch (error) {
    console.error('Error initializing finances:', error);
    res.status(500).json({ success: false, message: 'Error initializing finances', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const months = await financesDb.getAllFinances();
    res.json({ success: true, months });
  } catch (error) {
    console.error('Error fetching finances:', error);
    res.status(500).json({ success: false, message: 'Error fetching finances', error: error.message });
  }
});

router.post('/parse', async (req, res) => {
  try {
    res.json({ success: false, message: 'Document parsing not yet implemented' });
  } catch (error) {
    console.error('Error parsing document:', error);
    res.status(500).json({ success: false, message: 'Error parsing document', error: error.message });
  }
});

router.post('/income', async (req, res) => {
  try {
    const { monthId, income, incomeConfirmed, incomeItems } = req.body;
    await financesDb.updateIncome(monthId, income, incomeConfirmed, incomeItems);
    res.json({ success: true, message: 'Income updated' });
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ success: false, message: 'Error updating income', error: error.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const { monthId, knownExpenses } = req.body;
    await financesDb.updateKnownExpenses(monthId, knownExpenses);
    res.json({ success: true, message: 'Expenses updated' });
  } catch (error) {
    console.error('Error updating expenses:', error);
    res.status(500).json({ success: false, message: 'Error updating expenses', error: error.message });
  }
});

router.post('/unpredictable-expenses', async (req, res) => {
  try {
    const { monthId, unpredictableExpenses } = req.body;
    await financesDb.updateUnpredictableExpenses(monthId, unpredictableExpenses);
    res.json({ success: true, message: 'Unpredictable expenses updated' });
  } catch (error) {
    console.error('Error updating unpredictable expenses:', error);
    res.status(500).json({ success: false, message: 'Error updating unpredictable expenses', error: error.message });
  }
});

router.post('/invested', async (req, res) => {
  try {
    const { monthId, type, amount, transactions } = req.body;
    await financesDb.updateInvested(monthId, type, amount, transactions);
    res.json({ success: true, message: 'Invested updated' });
  } catch (error) {
    console.error('Error updating invested:', error);
    res.status(500).json({ success: false, message: 'Error updating invested', error: error.message });
  }
});

router.get('/assets', async (req, res) => {
  try {
    const assets = await assetsDb.getAllAssets();
    res.json({ success: true, assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, message: 'Error fetching assets', error: error.message });
  }
});

router.post('/assets', async (req, res) => {
  try {
    const id = await assetsDb.addAsset(req.body);
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error adding asset:', error);
    res.status(500).json({ success: false, message: 'Error adding asset', error: error.message });
  }
});

router.put('/assets/:id', async (req, res) => {
  try {
    await assetsDb.updateAsset(req.params.id, req.body);
    res.json({ success: true, message: 'Asset updated' });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ success: false, message: 'Error updating asset', error: error.message });
  }
});

router.delete('/assets/:id', async (req, res) => {
  try {
    await assetsDb.deleteAsset(req.params.id);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ success: false, message: 'Error deleting asset', error: error.message });
  }
});

router.post('/assets/reorder', async (req, res) => {
  try {
    await assetsDb.reorderAssets(req.body.assetIds);
    res.json({ success: true, message: 'Assets reordered' });
  } catch (error) {
    console.error('Error reordering assets:', error);
    res.status(500).json({ success: false, message: 'Error reordering assets', error: error.message });
  }
});

module.exports = router;
