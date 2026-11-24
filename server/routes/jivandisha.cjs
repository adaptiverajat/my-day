const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPool, ensureJivanDishaTable } = require('../db.cjs');

const router = express.Router();

// Uploads directory for invoices
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all JivanDisha locations (optional filter: ?country=IN or ?country=US)
router.get('/locations', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { country } = req.query;
    let query = 'SELECT * FROM jivandisha_locations';
    const params = [];
    if (country) {
      query += ' WHERE country = ?';
      params.push(country.toUpperCase());
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    const locations = rows.map(loc => ({
      ...loc,
      lat: parseFloat(loc.lat),
      lng: parseFloat(loc.lng),
      books_sent: Number(loc.books_sent || 0),
      invoice_date: loc.invoice_date ? String(loc.invoice_date).slice(0, 10) : '',
      payment_received: Boolean(loc.payment_received),
      decision_maker_name: loc.decision_maker_name || '',
      decision_maker_phone: loc.decision_maker_phone || '',
      inventory_keeper_name: loc.inventory_keeper_name || '',
      inventory_keeper_phone: loc.inventory_keeper_phone || '',
      invoice_pdf_url: loc.invoice_pdf_url || '',
      invoice_pdf_name: loc.invoice_pdf_name || '',
      next_follow_up_date: loc.next_follow_up_date ? String(loc.next_follow_up_date).slice(0, 10) : '',
      remarks: loc.remarks || ''
    }));
    res.json({ success: true, locations });
  } catch (error) {
    console.error('Error fetching JivanDisha locations:', error);
    res.status(500).json({ success: false, message: 'Error fetching locations', error: error.message });
  }
});

// Add a new JivanDisha location
router.post('/locations', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const {
      country = 'IN',
      title,
      category = 'General',
      lat,
      lng,
      city = '',
      state = '',
      address = '',
      notes = '',
      books_sent = 0,
      invoice_date = null,
      payment_received = false,
      decision_maker_name = '',
      decision_maker_phone = '',
      inventory_keeper_name = '',
      inventory_keeper_phone = '',
      invoice_pdf_url = '',
      invoice_pdf_name = '',
      contact_person = '',
      contact_phone = '',
      contact_email = '',
      website = '',
      invoice_number = '',
      amount = null
    } = req.body;

    if (!title || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Title, latitude, and longitude are required' });
    }

    const sanitizedBooksSent = parseInt(books_sent, 10) || 0;
    const sanitizedInvoiceDate = invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : null;
    const sanitizedPaymentReceived = Boolean(payment_received);

    const [result] = await pool.query(
      `INSERT INTO jivandisha_locations 
       (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone, inventory_keeper_name, inventory_keeper_phone, invoice_pdf_url, invoice_pdf_name, contact_person, contact_phone, contact_email, website)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        country.toUpperCase(),
        title,
        category,
        lat,
        lng,
        city,
        state,
        address,
        notes,
        sanitizedBooksSent,
        sanitizedInvoiceDate,
        sanitizedPaymentReceived,
        decision_maker_name,
        decision_maker_phone,
        inventory_keeper_name,
        inventory_keeper_phone,
        invoice_pdf_url,
        invoice_pdf_name,
        contact_person,
        contact_phone,
        contact_email,
        website
      ]
    );

    const newLocationId = result.insertId;

    if (sanitizedInvoiceDate || sanitizedBooksSent > 0 || invoice_pdf_url) {
      try {
        await pool.query(
          `INSERT INTO jivandisha_invoices (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newLocationId,
            invoice_number || 'Initial Shipment',
            sanitizedInvoiceDate || new Date().toISOString().slice(0, 10),
            sanitizedBooksSent,
            amount ? parseFloat(amount) : null,
            sanitizedPaymentReceived,
            invoice_pdf_url,
            invoice_pdf_name,
            notes ? notes.slice(0, 255) : 'Initial location setup entry'
          ]
        );
      } catch (invErr) {
        console.error('Error inserting initial invoice:', invErr);
      }
    }

    res.json({
      success: true,
      id: newLocationId,
      location: {
        id: newLocationId,
        country: country.toUpperCase(),
        title,
        category,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        city,
        state,
        address,
        notes,
        books_sent: sanitizedBooksSent,
        invoice_date: sanitizedInvoiceDate || '',
        payment_received: sanitizedPaymentReceived,
        decision_maker_name,
        decision_maker_phone,
        inventory_keeper_name,
        inventory_keeper_phone,
        invoice_pdf_url,
        invoice_pdf_name,
        contact_person,
        contact_phone,
        contact_email,
        website
      }
    });
  } catch (error) {
    console.error('Error adding JivanDisha location:', error);
    res.status(500).json({ success: false, message: 'Error adding location', error: error.message });
  }
});

// Update an existing JivanDisha location
router.put('/locations/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const {
      country,
      title,
      category,
      lat,
      lng,
      city,
      state,
      address,
      notes,
      books_sent,
      invoice_date,
      payment_received,
      decision_maker_name,
      decision_maker_phone,
      inventory_keeper_name,
      inventory_keeper_phone,
      invoice_pdf_url,
      invoice_pdf_name,
      contact_person,
      contact_phone,
      contact_email,
      website,
      next_follow_up_date,
      remarks
    } = req.body;

    const sanitizedBooksSent = books_sent !== undefined ? (parseInt(books_sent, 10) || 0) : null;
    const sanitizedInvoiceDate = invoice_date !== undefined ? (invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : null) : null;
    const sanitizedPaymentReceived = payment_received !== undefined ? Boolean(payment_received) : null;
    const sanitizedFollowUpDate = next_follow_up_date !== undefined ? (next_follow_up_date && next_follow_up_date.trim() ? next_follow_up_date.trim().slice(0, 10) : null) : undefined;

    await pool.query(
      `UPDATE jivandisha_locations SET 
       country = COALESCE(?, country),
       title = COALESCE(?, title),
       category = COALESCE(?, category),
       lat = COALESCE(?, lat),
       lng = COALESCE(?, lng),
       city = COALESCE(?, city),
       state = COALESCE(?, state),
       address = COALESCE(?, address),
       notes = COALESCE(?, notes),
       books_sent = CASE WHEN ? IS NOT NULL THEN ? ELSE books_sent END,
       invoice_date = CASE WHEN ? IS NOT NULL THEN ? ELSE invoice_date END,
       payment_received = CASE WHEN ? IS NOT NULL THEN ? ELSE payment_received END,
       decision_maker_name = COALESCE(?, decision_maker_name),
       decision_maker_phone = COALESCE(?, decision_maker_phone),
       inventory_keeper_name = COALESCE(?, inventory_keeper_name),
       inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
       invoice_pdf_url = COALESCE(?, invoice_pdf_url),
       invoice_pdf_name = COALESCE(?, invoice_pdf_name),
       contact_person = COALESCE(?, contact_person),
       contact_phone = COALESCE(?, contact_phone),
       contact_email = COALESCE(?, contact_email),
       website = COALESCE(?, website),
       next_follow_up_date = CASE WHEN ? IS NOT NULL THEN ? ELSE next_follow_up_date END,
       remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [
        country ? country.toUpperCase() : null,
        title,
        category,
        lat,
        lng,
        city,
        state,
        address,
        notes,
        sanitizedBooksSent !== null ? 1 : null,
        sanitizedBooksSent,
        invoice_date !== undefined ? 1 : null,
        sanitizedInvoiceDate,
        payment_received !== undefined ? 1 : null,
        sanitizedPaymentReceived,
        decision_maker_name,
        decision_maker_phone,
        inventory_keeper_name,
        inventory_keeper_phone,
        invoice_pdf_url,
        invoice_pdf_name,
        contact_person,
        contact_phone,
        contact_email,
        website,
        sanitizedFollowUpDate !== undefined ? 1 : null,
        sanitizedFollowUpDate !== undefined ? sanitizedFollowUpDate : null,
        remarks,
        id
      ]
    );

    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating JivanDisha location:', error);
    res.status(500).json({ success: false, message: 'Error updating location', error: error.message });
  }
});

// Update follow-up date and remarks specifically
router.put('/locations/:id/follow-up', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const {
      next_follow_up_date,
      remarks,
      decision_maker_name,
      decision_maker_phone,
      inventory_keeper_name,
      inventory_keeper_phone,
      contact_person,
      contact_phone,
      contact_email
    } = req.body;

    const sanitizedFollowUpDate = next_follow_up_date && next_follow_up_date.trim() ? next_follow_up_date.trim().slice(0, 10) : null;

    await pool.query(
      `UPDATE jivandisha_locations SET 
       next_follow_up_date = ?,
       remarks = COALESCE(?, remarks),
       decision_maker_name = COALESCE(?, decision_maker_name),
       decision_maker_phone = COALESCE(?, decision_maker_phone),
       inventory_keeper_name = COALESCE(?, inventory_keeper_name),
       inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
       contact_person = COALESCE(?, contact_person),
       contact_phone = COALESCE(?, contact_phone),
       contact_email = COALESCE(?, contact_email)
       WHERE id = ?`,
      [
        sanitizedFollowUpDate,
        remarks !== undefined ? remarks : null,
        decision_maker_name !== undefined ? decision_maker_name : null,
        decision_maker_phone !== undefined ? decision_maker_phone : null,
        inventory_keeper_name !== undefined ? inventory_keeper_name : null,
        inventory_keeper_phone !== undefined ? inventory_keeper_phone : null,
        contact_person !== undefined ? contact_person : null,
        contact_phone !== undefined ? contact_phone : null,
        contact_email !== undefined ? contact_email : null,
        id
      ]
    );

    res.json({ success: true, message: 'Follow-up details updated successfully' });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ success: false, message: 'Error updating follow-up', error: error.message });
  }
});

// Delete a JivanDisha location and its invoices
router.delete('/locations/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    await pool.query('DELETE FROM jivandisha_invoices WHERE location_id = ?', [id]);
    await pool.query('DELETE FROM jivandisha_locations WHERE id = ?', [id]);
    res.json({ success: true, message: 'Location and history deleted successfully' });
  } catch (error) {
    console.error('Error deleting JivanDisha location:', error);
    res.status(500).json({ success: false, message: 'Error deleting location', error: error.message });
  }
});

// Upload and parse an invoice PDF
router.post('/upload-invoice-pdf', express.raw({ type: 'application/pdf', limit: '50mb' }), async (req, res) => {
  try {
    const isBinaryUpload = Buffer.isBuffer(req.body);
    const filename = isBinaryUpload
      ? decodeURIComponent(req.get('x-file-name') || 'invoice.pdf')
      : req.body?.filename || 'invoice.pdf';
    const country = isBinaryUpload ? (req.get('x-country') || 'IN') : (req.body?.country || 'IN');
    let buffer;

    if (isBinaryUpload) {
      buffer = req.body;
    } else if (req.body?.fileBase64) {
      const rawBase64 = req.body.fileBase64.includes('base64,')
        ? req.body.fileBase64.split('base64,')[1]
        : req.body.fileBase64;
      buffer = Buffer.from(rawBase64, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'No file data provided' });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Empty file buffer' });
    }

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
    } catch (requireErr) {
      console.warn('Failed to dynamically require invoiceParser:', requireErr.message);
      parser = require('../../invoiceParser.cjs');
    }

    const parseResult = await parser.extractFromPdfBuffer(buffer, country);
    if (!parseResult.success) {
      return res.status(200).json({
        success: false,
        pdfUrl,
        pdfFilename: filename,
        message: parseResult.error || 'Failed to extract values from PDF',
        parseError: parseResult.error
      });
    }

    res.json({
      success: true,
      pdfUrl,
      pdfFilename: filename,
      extracted: parseResult.data,
      rawPreview: parseResult.rawText || ''
    });
  } catch (error) {
    console.error('Error uploading/parsing invoice PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to process invoice PDF', error: error.message });
  }
});

// Get all invoices across all locations
router.get('/invoices', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const [rows] = await pool.query(`
      SELECT 
        inv.*,
        loc.title as location_title,
        loc.city as location_city,
        loc.state as location_state,
        loc.country as location_country,
        loc.decision_maker_name,
        loc.decision_maker_phone,
        loc.inventory_keeper_name,
        loc.inventory_keeper_phone
      FROM jivandisha_invoices inv
      LEFT JOIN jivandisha_locations loc ON inv.location_id = loc.id
      ORDER BY inv.invoice_date DESC, inv.id DESC
    `);

    const invoices = rows.map(inv => ({
      ...inv,
      invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
      books_sent: Number(inv.books_sent || 0),
      amount: inv.amount ? parseFloat(inv.amount) : null,
      payment_received: Boolean(inv.payment_received),
      pdf_url: inv.pdf_url || '',
      pdf_name: inv.pdf_name || '',
      location_title: inv.location_title || 'Unknown Location',
      location_city: inv.location_city || '',
      location_state: inv.location_state || '',
      location_country: inv.location_country || 'IN'
    }));

    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
});

// Parse invoice text and auto-match location
router.post('/parse-invoice-text', async (req, res) => {
  try {
    const { text, country = 'IN' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    let parser;
    try {
      const parserPath = path.join(__dirname, '..', '..', 'invoiceParser.cjs');
      delete require.cache[require.resolve(parserPath)];
      parser = require(parserPath);
    } catch (e) {
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
      if (rows && rows.length > 0) {
        matchedLocation = rows[0];
      }
    }

    res.json({
      success: true,
      data: parsed,
      matchedLocation
    });
  } catch (error) {
    console.error('Error parsing invoice text:', error);
    res.status(500).json({ success: false, message: 'Failed to parse invoice text', error: error.message });
  }
});

// Add a new invoice (with optional automatic location creation or linking)
router.post('/invoices', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    let {
      location_id,
      location_title,
      country = 'IN',
      city = '',
      state = '',
      address = '',
      invoice_number = '',
      invoice_date = new Date().toISOString().slice(0, 10),
      books_sent = 0,
      amount = null,
      payment_received = false,
      pdf_url = '',
      pdf_name = '',
      notes = '',
      decision_maker_name = '',
      decision_maker_phone = ''
    } = req.body;

    let targetLocationId = location_id ? parseInt(location_id, 10) : null;

    if (!targetLocationId && location_title) {
      const [existingLoc] = await pool.query(
        'SELECT id FROM jivandisha_locations WHERE LOWER(title) = ? LIMIT 1',
        [location_title.trim().toLowerCase()]
      );

      if (existingLoc && existingLoc.length > 0) {
        targetLocationId = existingLoc[0].id;
      } else {
        const defaultLat = country.toUpperCase() === 'US' ? 37.0902 : 20.5937;
        const defaultLng = country.toUpperCase() === 'US' ? -95.7129 : 78.9629;

        const [newLocResult] = await pool.query(
          `INSERT INTO jivandisha_locations 
           (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone)
           VALUES (?, ?, 'General', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            country.toUpperCase(),
            location_title.trim(),
            defaultLat,
            defaultLng,
            city,
            state,
            address || city,
            notes,
            parseInt(books_sent, 10) || 0,
            invoice_date ? invoice_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            Boolean(payment_received),
            decision_maker_name,
            decision_maker_phone
          ]
        );
        targetLocationId = newLocResult.insertId;
      }
    }

    if (!targetLocationId) {
      return res.status(400).json({ success: false, message: 'A location must be selected or specified for the invoice.' });
    }

    const sanitizedBooks = parseInt(books_sent, 10) || 0;
    const sanitizedDate = invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const sanitizedPayment = Boolean(payment_received);
    const sanitizedAmount = amount ? parseFloat(amount) : null;

    const [result] = await pool.query(
      `INSERT INTO jivandisha_invoices 
       (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [targetLocationId, invoice_number, sanitizedDate, sanitizedBooks, sanitizedAmount, sanitizedPayment, pdf_url, pdf_name, notes]
    );

    const [sumRows] = await pool.query(
      'SELECT SUM(books_sent) as total_books FROM jivandisha_invoices WHERE location_id = ?',
      [targetLocationId]
    );
    const totalBooks = sumRows[0]?.total_books || sanitizedBooks;
    await pool.query(
      'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
      [totalBooks, sanitizedDate, targetLocationId]
    );

    const [createdRows] = await pool.query(
      `SELECT 
        inv.*,
        loc.title as location_title,
        loc.city as location_city,
        loc.state as location_state,
        loc.country as location_country
       FROM jivandisha_invoices inv
       LEFT JOIN jivandisha_locations loc ON inv.location_id = loc.id
       WHERE inv.id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      id: result.insertId,
      invoice: createdRows[0] || {
        id: result.insertId,
        location_id: targetLocationId,
        invoice_number,
        invoice_date: sanitizedDate,
        books_sent: sanitizedBooks,
        amount: sanitizedAmount,
        payment_received: sanitizedPayment,
        pdf_url,
        pdf_name,
        notes
      }
    });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ success: false, message: 'Error adding invoice', error: error.message });
  }
});

// Batch add multiple invoices
router.post('/invoices/batch', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { invoices } = req.body;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ success: false, message: 'No invoice entries provided in batch.' });
    }

    const insertedInvoices = [];
    const affectedLocationIds = new Set();

    for (let i = 0; i < invoices.length; i++) {
      const item = invoices[i];
      let {
        location_id,
        location_title = '',
        country = 'IN',
        city = '',
        state = '',
        address = '',
        invoice_number = '',
        invoice_date = new Date().toISOString().slice(0, 10),
        books_sent = 0,
        amount = null,
        payment_received = false,
        pdf_url = '',
        pdf_name = '',
        notes = '',
        decision_maker_name = '',
        decision_maker_phone = ''
      } = item;

      let targetLocationId = location_id ? parseInt(location_id, 10) : null;

      // Verify location_id exists if provided
      if (targetLocationId) {
        const [locCheck] = await pool.query('SELECT id FROM jivandisha_locations WHERE id = ?', [targetLocationId]);
        if (!locCheck || locCheck.length === 0) {
          targetLocationId = null;
        }
      }

      // Safe non-empty location title
      const cleanTitle = (location_title || '').trim() ||
        (city ? `${city} Center` : (invoice_number ? `Order #${invoice_number}` : `Location ${i + 1}`));

      // Date sanitization (guarantee YYYY-MM-DD for MySQL)
      let sanitizedDate = invoice_date && String(invoice_date).trim()
        ? String(invoice_date).trim().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedDate)) {
        const parsed = Date.parse(sanitizedDate);
        if (!isNaN(parsed)) {
          sanitizedDate = new Date(parsed).toISOString().slice(0, 10);
        } else {
          sanitizedDate = new Date().toISOString().slice(0, 10);
        }
      }

      const sanitizedBooks = parseInt(books_sent, 10) || 0;
      const sanitizedPayment = Boolean(payment_received);
      const sanitizedAmount = amount !== null && amount !== undefined && !isNaN(parseFloat(amount))
        ? parseFloat(amount)
        : null;

      if (!targetLocationId) {
        const [existingLoc] = await pool.query(
          'SELECT id FROM jivandisha_locations WHERE LOWER(title) = ? LIMIT 1',
          [cleanTitle.toLowerCase()]
        );

        if (existingLoc && existingLoc.length > 0) {
          targetLocationId = existingLoc[0].id;
        } else {
          const defaultLat = String(country).toUpperCase() === 'US' ? 37.0902 : 20.5937;
          const defaultLng = String(country).toUpperCase() === 'US' ? -95.7129 : 78.9629;

          const [newLocResult] = await pool.query(
            `INSERT INTO jivandisha_locations 
             (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone)
             VALUES (?, ?, 'General', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              String(country).toUpperCase() === 'US' ? 'US' : 'IN',
              cleanTitle,
              defaultLat,
              defaultLng,
              city || '',
              state || '',
              address || city || cleanTitle,
              notes || '',
              sanitizedBooks,
              sanitizedDate,
              sanitizedPayment,
              decision_maker_name || '',
              decision_maker_phone || ''
            ]
          );
          targetLocationId = newLocResult.insertId;
        }
      }

      if (!targetLocationId) {
        console.error('Could not determine targetLocationId for item:', item);
        continue;
      }

      const [result] = await pool.query(
        `INSERT INTO jivandisha_invoices 
         (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetLocationId,
          invoice_number || '',
          sanitizedDate,
          sanitizedBooks,
          sanitizedAmount,
          sanitizedPayment,
          pdf_url || '',
          pdf_name || '',
          notes || ''
        ]
      );

      affectedLocationIds.add(targetLocationId);
      insertedInvoices.push({
        id: result.insertId,
        location_id: targetLocationId,
        invoice_number: invoice_number || ''
      });
    }

    // Recalculate aggregates for all affected locations
    for (const locId of affectedLocationIds) {
      const [sumRows] = await pool.query(
        'SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?',
        [locId]
      );
      if (sumRows && sumRows.length > 0) {
        await pool.query(
          'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
          [sumRows[0].total_books || 0, sumRows[0].latest_date || null, locId]
        );
      }
    }

    if (insertedInvoices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not save any invoice records. Please check that each entry has a valid Location.'
      });
    }

    res.json({
      success: true,
      count: insertedInvoices.length,
      invoices: insertedInvoices
    });
  } catch (error) {
    console.error('Error batch adding invoices:', error);
    res.status(500).json({ success: false, message: 'Error batch adding invoices', error: error.message });
  }
});

// Get all past invoices for a location
router.get('/locations/:id/invoices', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM jivandisha_invoices WHERE location_id = ? ORDER BY invoice_date DESC, id DESC',
      [id]
    );

    const invoices = rows.map(inv => ({
      ...inv,
      invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
      books_sent: Number(inv.books_sent || 0),
      amount: inv.amount ? parseFloat(inv.amount) : null,
      payment_received: Boolean(inv.payment_received),
      pdf_url: inv.pdf_url || '',
      pdf_name: inv.pdf_name || ''
    }));

    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices for location:', error);
    res.status(500).json({ success: false, message: 'Error fetching invoices', error: error.message });
  }
});

// Add a new invoice for a location
router.post('/locations/:id/invoices', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const {
      invoice_number = '',
      invoice_date = new Date().toISOString().slice(0, 10),
      books_sent = 0,
      amount = null,
      payment_received = false,
      pdf_url = '',
      pdf_name = '',
      notes = ''
    } = req.body;

    const sanitizedBooks = parseInt(books_sent, 10) || 0;
    const sanitizedDate = invoice_date && invoice_date.trim() ? invoice_date.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const sanitizedPayment = Boolean(payment_received);
    const sanitizedAmount = amount ? parseFloat(amount) : null;

    const [result] = await pool.query(
      `INSERT INTO jivandisha_invoices 
       (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, invoice_number, sanitizedDate, sanitizedBooks, sanitizedAmount, sanitizedPayment, pdf_url, pdf_name, notes]
    );

    const [sumRows] = await pool.query(
      'SELECT SUM(books_sent) as total_books FROM jivandisha_invoices WHERE location_id = ?',
      [id]
    );
    const totalBooks = sumRows[0]?.total_books || sanitizedBooks;
    await pool.query(
      'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
      [totalBooks, sanitizedDate, id]
    );

    res.json({
      success: true,
      id: result.insertId,
      invoice: {
        id: result.insertId,
        location_id: Number(id),
        invoice_number,
        invoice_date: sanitizedDate,
        books_sent: sanitizedBooks,
        amount: sanitizedAmount,
        payment_received: sanitizedPayment,
        pdf_url,
        pdf_name,
        notes
      }
    });
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ success: false, message: 'Error adding invoice', error: error.message });
  }
});

// Update an invoice
router.put('/invoices/:invoiceId', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { invoiceId } = req.params;
    const {
      location_id,
      invoice_number,
      invoice_date,
      books_sent,
      amount,
      payment_received,
      pdf_url,
      pdf_name,
      notes
    } = req.body;

    // Check that existing invoice exists
    const [existingRows] = await pool.query('SELECT * FROM jivandisha_invoices WHERE id = ?', [invoiceId]);
    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const oldInv = existingRows[0];
    const targetLocationId =
      location_id !== undefined && location_id !== null && location_id !== ''
        ? parseInt(location_id, 10)
        : oldInv.location_id;

    const sanitizedBooks = books_sent !== undefined && books_sent !== null ? parseInt(books_sent, 10) || 0 : null;
    const sanitizedDate =
      invoice_date !== undefined
        ? invoice_date && String(invoice_date).trim()
          ? String(invoice_date).trim().slice(0, 10)
          : null
        : null;
    const hasAmount = amount !== undefined;
    const sanitizedAmount =
      amount !== undefined && amount !== null && amount !== '' && !isNaN(parseFloat(amount))
        ? parseFloat(amount)
        : null;
    const hasPayment = payment_received !== undefined;
    const sanitizedPayment = Boolean(payment_received);

    await pool.query(
      `UPDATE jivandisha_invoices SET 
       location_id = ?,
       invoice_number = COALESCE(?, invoice_number),
       invoice_date = COALESCE(?, invoice_date),
       books_sent = CASE WHEN ? IS NOT NULL THEN ? ELSE books_sent END,
       amount = CASE WHEN ? = 1 THEN ? ELSE amount END,
       payment_received = CASE WHEN ? = 1 THEN ? ELSE payment_received END,
       pdf_url = CASE WHEN ? IS NOT NULL THEN ? ELSE pdf_url END,
       pdf_name = CASE WHEN ? IS NOT NULL THEN ? ELSE pdf_name END,
       notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        targetLocationId,
        invoice_number !== undefined ? invoice_number : null,
        sanitizedDate,
        sanitizedBooks !== null ? 1 : null,
        sanitizedBooks,
        hasAmount ? 1 : 0,
        sanitizedAmount,
        hasPayment ? 1 : 0,
        sanitizedPayment,
        pdf_url !== undefined ? 1 : null,
        pdf_url || '',
        pdf_name !== undefined ? 1 : null,
        pdf_name || '',
        notes !== undefined ? notes : null,
        invoiceId
      ]
    );

    // Recalculate aggregates for affected locations
    const affectedLocations = new Set([oldInv.location_id, targetLocationId].filter(Boolean));
    for (const locId of affectedLocations) {
      const [sumRows] = await pool.query(
        'SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?',
        [locId]
      );
      if (sumRows && sumRows.length > 0) {
        await pool.query(
          'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
          [sumRows[0].total_books || 0, sumRows[0].latest_date || null, locId]
        );
      }
    }

    const [updatedRows] = await pool.query(
      `SELECT 
        inv.*,
        loc.title as location_title,
        loc.city as location_city,
        loc.state as location_state,
        loc.country as location_country,
        loc.decision_maker_name,
        loc.decision_maker_phone
       FROM jivandisha_invoices inv
       LEFT JOIN jivandisha_locations loc ON inv.location_id = loc.id
       WHERE inv.id = ?`,
      [invoiceId]
    );

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedRows[0] || null
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: 'Error updating invoice', error: error.message });
  }
});

// Delete an invoice
router.delete('/invoices/:invoiceId', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized. Please run setup first.' });
    }
    await ensureJivanDishaTable();

    const { invoiceId } = req.params;
    await pool.query('DELETE FROM jivandisha_invoices WHERE id = ?', [invoiceId]);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: 'Error deleting invoice', error: error.message });
  }
});

// Merge two invoices into one and delete the duplicate
router.post('/invoices/merge', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { primary_id, duplicate_id, merged_fields } = req.body;
    const primId = parseInt(primary_id, 10);
    const dupId = parseInt(duplicate_id, 10);

    if (!primId || !dupId || primId === dupId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: Two distinct invoice IDs (primary_id and duplicate_id) are required.'
      });
    }

    // Verify both invoices exist
    const [rows] = await pool.query(
      'SELECT id, location_id, books_sent, invoice_date FROM jivandisha_invoices WHERE id IN (?, ?)',
      [primId, dupId]
    );
    if (!rows || rows.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'One or both invoices could not be found in the database.'
      });
    }

    const primaryRow = rows.find((r) => r.id === primId);
    const dupRow = rows.find((r) => r.id === dupId);

    const fields = merged_fields || {};
    const sanitizedBooks =
      fields.books_sent !== undefined && fields.books_sent !== null
        ? parseInt(fields.books_sent, 10) || 0
        : primaryRow.books_sent;
    const sanitizedDate =
      fields.invoice_date && String(fields.invoice_date).trim()
        ? String(fields.invoice_date).trim().slice(0, 10)
        : primaryRow.invoice_date
        ? String(primaryRow.invoice_date).slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const sanitizedAmount =
      fields.amount !== undefined && fields.amount !== null && !isNaN(parseFloat(fields.amount))
        ? parseFloat(fields.amount)
        : null;
    const sanitizedPayment =
      fields.payment_received !== undefined ? Boolean(fields.payment_received) : false;
    const targetLocationId = fields.location_id ? parseInt(fields.location_id, 10) : primaryRow.location_id;

    // Update primary invoice with merged details
    await pool.query(
      `UPDATE jivandisha_invoices SET
       location_id = ?,
       invoice_number = ?,
       invoice_date = ?,
       books_sent = ?,
       amount = ?,
       payment_received = ?,
       pdf_url = ?,
       pdf_name = ?,
       notes = ?
       WHERE id = ?`,
      [
        targetLocationId,
        fields.invoice_number !== undefined ? fields.invoice_number : '',
        sanitizedDate,
        sanitizedBooks,
        sanitizedAmount,
        sanitizedPayment,
        fields.pdf_url || '',
        fields.pdf_name || '',
        fields.notes || '',
        primId
      ]
    );

    // Delete duplicate invoice from DB
    await pool.query('DELETE FROM jivandisha_invoices WHERE id = ?', [dupId]);

    // Recalculate aggregates for all affected locations
    const affectedLocations = new Set(
      [primaryRow.location_id, dupRow.location_id, targetLocationId].filter(Boolean)
    );
    for (const locId of affectedLocations) {
      const [sumRows] = await pool.query(
        'SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?',
        [locId]
      );
      if (sumRows && sumRows.length > 0) {
        await pool.query(
          'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
          [sumRows[0].total_books || 0, sumRows[0].latest_date || null, locId]
        );
      }
    }

    res.json({
      success: true,
      message: 'Invoices merged successfully and duplicate removed.',
      primary_id: primId
    });
  } catch (error) {
    console.error('Error merging invoices:', error);
    res.status(500).json({ success: false, message: 'Error merging invoices', error: error.message });
  }
});

// Merge two contacts/locations into one and delete the duplicate
router.post('/locations/merge', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { primary_id, duplicate_id, merged_fields } = req.body;
    const primId = parseInt(primary_id, 10);
    const dupId = parseInt(duplicate_id, 10);

    if (!primId || !dupId || primId === dupId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: Two distinct contact/location IDs (primary_id and duplicate_id) are required.'
      });
    }

    // Verify both locations exist
    const [rows] = await pool.query('SELECT * FROM jivandisha_locations WHERE id IN (?, ?)', [
      primId,
      dupId
    ]);
    if (!rows || rows.length < 2) {
      return res.status(404).json({
        success: false,
        message: 'One or both contact/location records could not be found in the database.'
      });
    }

    const primaryRow = rows.find((r) => r.id === primId);
    const dupRow = rows.find((r) => r.id === dupId);
    const fields = merged_fields || {};

    // 1. Update primary location with merged fields
    await pool.query(
      `UPDATE jivandisha_locations SET
       country = COALESCE(?, country),
       title = COALESCE(?, title),
       category = COALESCE(?, category),
       city = COALESCE(?, city),
       state = COALESCE(?, state),
       address = COALESCE(?, address),
       notes = COALESCE(?, notes),
       decision_maker_name = COALESCE(?, decision_maker_name),
       decision_maker_phone = COALESCE(?, decision_maker_phone),
       inventory_keeper_name = COALESCE(?, inventory_keeper_name),
       inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
       contact_person = COALESCE(?, contact_person),
       contact_phone = COALESCE(?, contact_phone),
       contact_email = COALESCE(?, contact_email),
       website = COALESCE(?, website),
       next_follow_up_date = CASE WHEN ? IS NOT NULL THEN ? ELSE next_follow_up_date END,
       remarks = COALESCE(?, remarks),
       lat = COALESCE(?, lat),
       lng = COALESCE(?, lng)
       WHERE id = ?`,
      [
        fields.country || primaryRow.country,
        fields.title || primaryRow.title,
        fields.category || primaryRow.category,
        fields.city !== undefined ? fields.city : primaryRow.city,
        fields.state !== undefined ? fields.state : primaryRow.state,
        fields.address !== undefined ? fields.address : primaryRow.address,
        fields.notes !== undefined ? fields.notes : primaryRow.notes,
        fields.decision_maker_name !== undefined ? fields.decision_maker_name : primaryRow.decision_maker_name,
        fields.decision_maker_phone !== undefined ? fields.decision_maker_phone : primaryRow.decision_maker_phone,
        fields.inventory_keeper_name !== undefined ? fields.inventory_keeper_name : primaryRow.inventory_keeper_name,
        fields.inventory_keeper_phone !== undefined ? fields.inventory_keeper_phone : primaryRow.inventory_keeper_phone,
        fields.contact_person !== undefined ? fields.contact_person : primaryRow.contact_person,
        fields.contact_phone !== undefined ? fields.contact_phone : primaryRow.contact_phone,
        fields.contact_email !== undefined ? fields.contact_email : primaryRow.contact_email,
        fields.website !== undefined ? fields.website : primaryRow.website,
        fields.next_follow_up_date !== undefined ? 1 : null,
        fields.next_follow_up_date !== undefined
          ? fields.next_follow_up_date
            ? String(fields.next_follow_up_date).slice(0, 10)
            : null
          : null,
        fields.remarks !== undefined ? fields.remarks : primaryRow.remarks,
        fields.lat !== undefined && fields.lat !== null ? parseFloat(fields.lat) : primaryRow.lat,
        fields.lng !== undefined && fields.lng !== null ? parseFloat(fields.lng) : primaryRow.lng,
        primId
      ]
    );

    // 2. Re-assign all invoices belonging to duplicate location to primary location
    await pool.query('UPDATE jivandisha_invoices SET location_id = ? WHERE location_id = ?', [
      primId,
      dupId
    ]);

    // 3. Delete duplicate location from DB
    await pool.query('DELETE FROM jivandisha_locations WHERE id = ?', [dupId]);

    // 4. Recalculate books_sent and invoice_date for primary location from all its invoices
    const [sumRows] = await pool.query(
      'SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?',
      [primId]
    );
    if (sumRows && sumRows.length > 0) {
      await pool.query(
        'UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?',
        [sumRows[0].total_books || 0, sumRows[0].latest_date || null, primId]
      );
    }

    res.json({
      success: true,
      message: 'Contacts / Locations merged successfully and duplicate removed.',
      primary_id: primId
    });
  } catch (error) {
    console.error('Error merging locations:', error);
    res.status(500).json({ success: false, message: 'Error merging locations', error: error.message });
  }
});

// ==========================================
// INDIVIDUAL COLLECTIONS ENDPOINTS
// ==========================================

// Get all individual collections with stats
router.get('/individual-collections', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { search } = req.query;
    let query = 'SELECT * FROM jivandisha_individual_collections';
    const params = [];

    if (search && search.trim()) {
      query += ' WHERE individual_name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    query += ' ORDER BY date DESC, id DESC';

    const [rows] = await pool.query(query, params);

    let totalCount = 0;
    let totalCost = 0;
    let totalCollection = 0;

    const collections = rows.map((r) => {
      const cCount = Number(r.count || 0);
      const cCost = Number(r.cost || 0);
      const cCollection = Number(r.collection || 0);

      totalCount += cCount;
      totalCost += cCost;
      totalCollection += cCollection;

      return {
        id: r.id,
        individual_name: r.individual_name || '',
        count: cCount,
        date: r.date ? String(r.date).slice(0, 10) : '',
        cost: cCost,
        collection: cCollection,
        notes: r.notes || '',
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    const stats = {
      total_records: collections.length,
      total_count: totalCount,
      total_cost: parseFloat(totalCost.toFixed(2)),
      total_collection: parseFloat(totalCollection.toFixed(2)),
      net_balance: parseFloat((totalCollection - totalCost).toFixed(2))
    };

    res.json({
      success: true,
      collections,
      stats
    });
  } catch (error) {
    console.error('Error fetching individual collections:', error);
    res.status(500).json({ success: false, message: 'Error fetching individual collections', error: error.message });
  }
});

// Add a single individual collection entry
router.post('/individual-collections', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const {
      individual_name,
      count = 0,
      date = null,
      cost = 0,
      collection = 0,
      notes = ''
    } = req.body;

    if (!individual_name || !String(individual_name).trim()) {
      return res.status(400).json({ success: false, message: 'Individual Name is required' });
    }

    const sanitizedName = String(individual_name).trim();
    const sanitizedCount = parseInt(count, 10) || 0;
    const sanitizedDate = date && String(date).trim() ? String(date).trim().slice(0, 10) : null;
    const sanitizedCost = isNaN(parseFloat(cost)) ? 0 : parseFloat(cost);
    const sanitizedCollection = isNaN(parseFloat(collection)) ? 0 : parseFloat(collection);

    const [result] = await pool.query(
      `INSERT INTO jivandisha_individual_collections (
        individual_name, count, date, cost, collection, notes
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [sanitizedName, sanitizedCount, sanitizedDate, sanitizedCost, sanitizedCollection, notes || '']
    );

    res.json({
      success: true,
      message: 'Individual collection saved successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding individual collection:', error);
    res.status(500).json({ success: false, message: 'Error adding individual collection', error: error.message });
  }
});

// Bulk insert multiple individual collection records (from Excel import)
router.post('/individual-collections/bulk', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { records = [] } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records provided for bulk insert' });
    }

    let insertedCount = 0;
    for (const rec of records) {
      if (!rec.individual_name || !String(rec.individual_name).trim()) continue;

      const sanitizedName = String(rec.individual_name).trim();
      const sanitizedCount = parseInt(rec.count, 10) || 0;
      const sanitizedDate = rec.date && String(rec.date).trim() ? String(rec.date).trim().slice(0, 10) : null;
      const sanitizedCost = isNaN(parseFloat(rec.cost)) ? 0 : parseFloat(rec.cost);
      const sanitizedCollection = isNaN(parseFloat(rec.collection)) ? 0 : parseFloat(rec.collection);

      await pool.query(
        `INSERT INTO jivandisha_individual_collections (
          individual_name, count, date, cost, collection, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [sanitizedName, sanitizedCount, sanitizedDate, sanitizedCost, sanitizedCollection, rec.notes || '']
      );
      insertedCount++;
    }

    res.json({
      success: true,
      message: `Successfully saved ${insertedCount} individual collection records to database`,
      inserted_count: insertedCount
    });
  } catch (error) {
    console.error('Error bulk saving individual collections:', error);
    res.status(500).json({ success: false, message: 'Error bulk saving individual collections', error: error.message });
  }
});

// Update a single individual collection entry
router.put('/individual-collections/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    const {
      individual_name,
      count = 0,
      date = null,
      cost = 0,
      collection = 0,
      notes = ''
    } = req.body;

    if (!individual_name || !String(individual_name).trim()) {
      return res.status(400).json({ success: false, message: 'Individual Name is required' });
    }

    const sanitizedName = String(individual_name).trim();
    const sanitizedCount = parseInt(count, 10) || 0;
    const sanitizedDate = date && String(date).trim() ? String(date).trim().slice(0, 10) : null;
    const sanitizedCost = isNaN(parseFloat(cost)) ? 0 : parseFloat(cost);
    const sanitizedCollection = isNaN(parseFloat(collection)) ? 0 : parseFloat(collection);

    await pool.query(
      `UPDATE jivandisha_individual_collections SET
        individual_name = ?,
        count = ?,
        date = ?,
        cost = ?,
        collection = ?,
        notes = ?
      WHERE id = ?`,
      [sanitizedName, sanitizedCount, sanitizedDate, sanitizedCost, sanitizedCollection, notes || '', id]
    );

    res.json({
      success: true,
      message: 'Individual collection updated successfully'
    });
  } catch (error) {
    console.error('Error updating individual collection:', error);
    res.status(500).json({ success: false, message: 'Error updating individual collection', error: error.message });
  }
});

// Delete a single individual collection entry
router.delete('/individual-collections/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { id } = req.params;
    await pool.query('DELETE FROM jivandisha_individual_collections WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Individual collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting individual collection:', error);
    res.status(500).json({ success: false, message: 'Error deleting individual collection', error: error.message });
  }
});

// Bulk delete multiple individual collection entries
router.post('/individual-collections/bulk-delete', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided for deletion' });
    }

    await pool.query(
      `DELETE FROM jivandisha_individual_collections WHERE id IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    res.json({
      success: true,
      message: `Deleted ${ids.length} individual collection records`,
      deleted_count: ids.length
    });
  } catch (error) {
    console.error('Error bulk deleting individual collections:', error);
    res.status(500).json({ success: false, message: 'Error bulk deleting individual collections', error: error.message });
  }
});

// Merge two duplicate individual collection records
router.post('/individual-collections/merge', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not initialized.' });
    }
    await ensureJivanDishaTable();

    const { primary_id, duplicate_id, merged_fields } = req.body;
    if (!primary_id || !duplicate_id) {
      return res.status(400).json({ success: false, message: 'Both primary_id and duplicate_id are required' });
    }
    const primId = parseInt(primary_id, 10);
    const dupId = parseInt(duplicate_id, 10);
    if (primId === dupId) {
      return res.status(400).json({ success: false, message: 'Primary and duplicate cannot be the same record' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM jivandisha_individual_collections WHERE id IN (?, ?)',
      [primId, dupId]
    );
    if (!rows || rows.length < 2) {
      return res.status(404).json({ success: false, message: 'One or both individual collection records could not be found' });
    }

    const primaryRow = rows.find((r) => r.id === primId);
    const dupRow = rows.find((r) => r.id === dupId);
    const fields = merged_fields || {};

    const updatedName = fields.individual_name !== undefined ? fields.individual_name : primaryRow.individual_name;
    const updatedCount = fields.count !== undefined ? parseInt(fields.count, 10) : primaryRow.count;
    const updatedDate =
      fields.date !== undefined
        ? fields.date
          ? String(fields.date).slice(0, 10)
          : null
        : primaryRow.date
        ? String(primaryRow.date).slice(0, 10)
        : null;
    const updatedCost = fields.cost !== undefined ? parseFloat(fields.cost) : primaryRow.cost;
    const updatedCollection = fields.collection !== undefined ? parseFloat(fields.collection) : primaryRow.collection;
    const updatedNotes = fields.notes !== undefined ? fields.notes : [primaryRow.notes, dupRow.notes].filter(Boolean).join(' | ');

    // 1. Update primary record
    await pool.query(
      `UPDATE jivandisha_individual_collections SET
        individual_name = ?,
        count = ?,
        date = ?,
        cost = ?,
        collection = ?,
        notes = ?
      WHERE id = ?`,
      [updatedName, updatedCount, updatedDate, updatedCost, updatedCollection, updatedNotes, primId]
    );

    // 2. Delete duplicate record
    await pool.query('DELETE FROM jivandisha_individual_collections WHERE id = ?', [dupId]);

    res.json({
      success: true,
      message: 'Individual collection records merged successfully and duplicate removed.',
      primary_id: primId
    });
  } catch (error) {
    console.error('Error merging individual collection records:', error);
    res.status(500).json({ success: false, message: 'Error merging individual collection records', error: error.message });
  }
});

module.exports = router;
