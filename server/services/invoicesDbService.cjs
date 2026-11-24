const { getPool, ensureJivanDishaTable } = require('../db.cjs');

async function getAllInvoices() {
  const pool = getPool();
  await ensureJivanDishaTable();
  const [rows] = await pool.query(`
    SELECT inv.*, loc.title as location_title, loc.city as location_city, loc.state as location_state,
           loc.country as location_country, loc.decision_maker_name, loc.decision_maker_phone,
           loc.inventory_keeper_name, loc.inventory_keeper_phone
    FROM jivandisha_invoices inv
    LEFT JOIN jivandisha_locations loc ON inv.location_id = loc.id
    ORDER BY inv.invoice_date DESC, inv.id DESC
  `);
  return rows.map(inv => ({
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
}

async function getLocationInvoices(locationId) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const [rows] = await pool.query('SELECT * FROM jivandisha_invoices WHERE location_id = ? ORDER BY invoice_date DESC, id DESC', [locationId]);
  return rows.map(inv => ({
    ...inv,
    invoice_date: inv.invoice_date ? String(inv.invoice_date).slice(0, 10) : '',
    books_sent: Number(inv.books_sent || 0),
    amount: inv.amount ? parseFloat(inv.amount) : null,
    payment_received: Boolean(inv.payment_received),
    pdf_url: inv.pdf_url || '',
    pdf_name: inv.pdf_name || ''
  }));
}

async function createInvoice(data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  let targetLocId = data.location_id ? parseInt(data.location_id, 10) : null;

  if (!targetLocId && data.location_title) {
    const [existingLoc] = await pool.query('SELECT id FROM jivandisha_locations WHERE LOWER(title) = ? LIMIT 1', [data.location_title.trim().toLowerCase()]);
    if (existingLoc && existingLoc.length > 0) {
      targetLocId = existingLoc[0].id;
    } else {
      const defaultLat = (data.country || 'IN').toUpperCase() === 'US' ? 37.0902 : 20.5937;
      const defaultLng = (data.country || 'IN').toUpperCase() === 'US' ? -95.7129 : 78.9629;
      const [newLoc] = await pool.query(
        `INSERT INTO jivandisha_locations (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone)
         VALUES (?, ?, 'General', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [(data.country || 'IN').toUpperCase(), data.location_title.trim(), defaultLat, defaultLng, data.city || '', data.state || '', data.address || data.city || '', data.notes || '', parseInt(data.books_sent, 10) || 0, data.invoice_date ? data.invoice_date.slice(0, 10) : new Date().toISOString().slice(0, 10), Boolean(data.payment_received), data.decision_maker_name || '', data.decision_maker_phone || '']
      );
      targetLocId = newLoc.insertId;
    }
  }
  if (!targetLocId) throw new Error('A location must be selected or specified.');

  const books = parseInt(data.books_sent, 10) || 0;
  const dateStr = data.invoice_date && data.invoice_date.trim() ? data.invoice_date.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const payment = Boolean(data.payment_received);
  const amt = data.amount ? parseFloat(data.amount) : null;

  const [res] = await pool.query(
    `INSERT INTO jivandisha_invoices (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [targetLocId, data.invoice_number || '', dateStr, books, amt, payment, data.pdf_url || '', data.pdf_name || '', data.notes || '']
  );

  const [sumRows] = await pool.query('SELECT SUM(books_sent) as total_books FROM jivandisha_invoices WHERE location_id = ?', [targetLocId]);
  await pool.query('UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?', [sumRows[0]?.total_books || books, dateStr, targetLocId]);

  return { id: res.insertId, location_id: targetLocId, invoice_number: data.invoice_number || '', invoice_date: dateStr, books_sent: books, amount: amt, payment_received: payment, pdf_url: data.pdf_url || '', pdf_name: data.pdf_name || '', notes: data.notes || '' };
}

async function updateInvoice(invoiceId, data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const [existing] = await pool.query('SELECT * FROM jivandisha_invoices WHERE id = ?', [invoiceId]);
  if (!existing || existing.length === 0) throw new Error('Invoice not found.');
  const oldInv = existing[0];
  const targetLocId = (data.location_id !== undefined && data.location_id !== null && data.location_id !== '') ? parseInt(data.location_id, 10) : oldInv.location_id;
  const books = data.books_sent !== undefined && data.books_sent !== null ? parseInt(data.books_sent, 10) || 0 : null;
  const dateStr = data.invoice_date ? String(data.invoice_date).trim().slice(0, 10) : null;
  const amt = (data.amount !== undefined && data.amount !== null && data.amount !== '' && !isNaN(parseFloat(data.amount))) ? parseFloat(data.amount) : null;

  await pool.query(
    `UPDATE jivandisha_invoices SET location_id = ?, invoice_number = COALESCE(?, invoice_number),
     invoice_date = COALESCE(?, invoice_date), books_sent = CASE WHEN ? IS NOT NULL THEN ? ELSE books_sent END,
     amount = CASE WHEN ? = 1 THEN ? ELSE amount END, payment_received = CASE WHEN ? = 1 THEN ? ELSE payment_received END,
     pdf_url = CASE WHEN ? IS NOT NULL THEN ? ELSE pdf_url END, pdf_name = CASE WHEN ? IS NOT NULL THEN ? ELSE pdf_name END,
     notes = COALESCE(?, notes) WHERE id = ?`,
    [targetLocId, data.invoice_number !== undefined ? data.invoice_number : null, dateStr, books !== null ? 1 : null, books, data.amount !== undefined ? 1 : 0, amt, data.payment_received !== undefined ? 1 : 0, Boolean(data.payment_received), data.pdf_url !== undefined ? 1 : null, data.pdf_url || '', data.pdf_name !== undefined ? 1 : null, data.pdf_name || '', data.notes !== undefined ? data.notes : null, invoiceId]
  );

  const locs = new Set([oldInv.location_id, targetLocId].filter(Boolean));
  for (const lId of locs) {
    const [sumRows] = await pool.query('SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?', [lId]);
    if (sumRows && sumRows.length > 0) {
      await pool.query('UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?', [sumRows[0].total_books || 0, sumRows[0].latest_date || null, lId]);
    }
  }
}

async function deleteInvoice(invoiceId) {
  const pool = getPool();
  await ensureJivanDishaTable();
  await pool.query('DELETE FROM jivandisha_invoices WHERE id = ?', [invoiceId]);
}

module.exports = {
  getAllInvoices, getLocationInvoices, createInvoice, updateInvoice, deleteInvoice
};
