const express = require('express');
const {
  getAllInvoices, getLocationInvoices, createInvoice, updateInvoice, deleteInvoice
} = require('../services/invoicesDbService.cjs');
const { batchCreateInvoices, mergeInvoices } = require('../services/invoicesBatchDbService.cjs');

const router = express.Router();

router.get('/invoices', async (req, res) => {
  try {
    const invoices = await getAllInvoices();
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const invoice = await createInvoice(req.body);
    res.json({ success: true, id: invoice.id, invoice });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ success: false, message: error.message || 'Error adding invoice' });
  }
});

router.post('/invoices/batch', async (req, res) => {
  try {
    const { invoices } = req.body;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ success: false, message: 'No invoice entries provided in batch.' });
    }
    const insertedInvoices = await batchCreateInvoices(invoices);
    if (insertedInvoices.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not save any invoice records.' });
    }
    res.json({ success: true, count: insertedInvoices.length, invoices: insertedInvoices });
  } catch (error) {
    console.error('Error batch adding invoices:', error);
    res.status(500).json({ success: false, message: 'Error batch adding invoices', error: error.message });
  }
});

router.get('/locations/:id/invoices', async (req, res) => {
  try {
    const invoices = await getLocationInvoices(req.params.id);
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices for location:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
});

router.post('/locations/:id/invoices', async (req, res) => {
  try {
    const invoice = await createInvoice({ ...req.body, location_id: req.params.id });
    res.json({ success: true, id: invoice.id, invoice });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ success: false, message: error.message || 'Error adding invoice' });
  }
});

router.put('/invoices/:invoiceId', async (req, res) => {
  try {
    await updateInvoice(req.params.invoiceId, req.body);
    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating invoice' });
  }
});

router.delete('/invoices/:invoiceId', async (req, res) => {
  try {
    await deleteInvoice(req.params.invoiceId);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: 'Error deleting invoice', error: error.message });
  }
});

router.post('/invoices/merge', async (req, res) => {
  try {
    const { primary_id, duplicate_id, merged_fields } = req.body;
    const primId = parseInt(primary_id, 10);
    const dupId = parseInt(duplicate_id, 10);
    if (!primId || !dupId || primId === dupId) {
      return res.status(400).json({ success: false, message: 'Two distinct invoice IDs required.' });
    }
    await mergeInvoices(primId, dupId, merged_fields);
    res.json({ success: true, message: 'Invoices merged successfully.', primary_id: primId });
  } catch (error) {
    console.error('Error merging invoices:', error);
    res.status(500).json({ success: false, message: error.message || 'Error merging invoices' });
  }
});

module.exports = router;
