const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db.cjs');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/upload-invoice-pdf', express.raw({ type: 'application/pdf', limit: '50mb' }), async (req, res) => {
  try {
    const isBinaryUpload = Buffer.isBuffer(req.body);
    const filename = isBinaryUpload ? decodeURIComponent(req.get('x-file-name') || 'invoice.pdf') : (req.body?.filename || 'invoice.pdf');
    const country = isBinaryUpload ? (req.get('x-country') || 'IN') : (req.body?.country || 'IN');
    let buffer;
    if (isBinaryUpload) {
      buffer = req.body;
    } else if (req.body?.fileBase64) {
      const raw = req.body.fileBase64.includes('base64,') ? req.body.fileBase64.split('base64,')[1] : req.body.fileBase64;
      buffer = Buffer.from(raw, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }
    if (buffer.length === 0) return res.status(400).json({ success: false, message: 'Empty file buffer' });

    const ext = '.pdf';
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const savedName = `${Date.now()}_${baseName}${ext}`;
    const targetPath = path.join(uploadsDir, savedName);
    await fs.promises.writeFile(targetPath, buffer);
    const pdfUrl = `/uploads/invoices/${savedName}`;

    let parser;
    try {
      const parserPath = path.join(__dirname, '..', '..', 'invoiceParser.cjs');
      delete require.cache[require.resolve(parserPath)];
      parser = require(parserPath);
    } catch {
      parser = require('../../invoiceParser.cjs');
    }

    const parseResult = await parser.extractFromPdfBuffer(buffer, country);
    if (!parseResult.success) {
      return res.status(200).json({ success: false, pdfUrl, pdfFilename: filename, message: parseResult.error || 'Failed to extract values', parseError: parseResult.error });
    }
    res.json({ success: true, pdfUrl, pdfFilename: filename, extracted: parseResult.data, rawPreview: parseResult.rawText || '' });
  } catch (error) {
    console.error('Error uploading/parsing invoice PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to process invoice PDF', error: error.message });
  }
});

router.post('/parse-invoice-text', async (req, res) => {
  try {
    const { text, country = 'IN' } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ success: false, message: 'Text is required' });

    let parser;
    try {
      const parserPath = path.join(__dirname, '..', '..', 'invoiceParser.cjs');
      delete require.cache[require.resolve(parserPath)];
      parser = require(parserPath);
    } catch {
      parser = require('../../invoiceParser.cjs');
    }
    const parsed = parser.parseInvoiceText(text, country);

    let matchedLocation = null;
    const pool = getPool();
    if (pool && (parsed.title || parsed.city)) {
      let query = 'SELECT id, title, city, state, country, decision_maker_name, decision_maker_phone FROM jivandisha_locations WHERE ';
      const params = [];
      const conditions = [];
      if (parsed.title) {
        conditions.push('LOWER(title) LIKE ?');
        params.push(`%${parsed.title.toLowerCase().trim()}%`);
      }
      if (parsed.city) {
        conditions.push('LOWER(city) = ?');
        params.push(parsed.city.toLowerCase().trim());
      }
      query += conditions.join(' OR ') + ' LIMIT 1';
      const [rows] = await pool.query(query, params);
      if (rows && rows.length > 0) matchedLocation = rows[0];
    }
    res.json({ success: true, data: parsed, matchedLocation });
  } catch (error) {
    console.error('Error parsing invoice text:', error);
    res.status(500).json({ success: false, message: 'Failed to parse invoice text', error: error.message });
  }
});

module.exports = router;
