const { getPool, ensureJivanDishaTable } = require('../db.cjs');

async function batchCreateInvoices(invoices) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const insertedInvoices = [];
  const affectedLocationIds = new Set();

  for (let i = 0; i < invoices.length; i++) {
    const item = invoices[i];
    let targetLocId = item.location_id ? parseInt(item.location_id, 10) : null;
    if (targetLocId) {
      const [locCheck] = await pool.query('SELECT id FROM jivandisha_locations WHERE id = ?', [targetLocId]);
      if (!locCheck || locCheck.length === 0) targetLocId = null;
    }
    const cleanTitle = (item.location_title || '').trim() || (item.city ? `${item.city} Center` : (item.invoice_number ? `Order #${item.invoice_number}` : `Location ${i + 1}`));
    let dateStr = item.invoice_date && String(item.invoice_date).trim() ? String(item.invoice_date).trim().slice(0, 10) : new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const p = Date.parse(dateStr);
      dateStr = !isNaN(p) ? new Date(p).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    }
    const books = parseInt(item.books_sent, 10) || 0;
    const payment = Boolean(item.payment_received);
    const amt = item.amount !== null && item.amount !== undefined && !isNaN(parseFloat(item.amount)) ? parseFloat(item.amount) : null;

    if (!targetLocId) {
      const [existingLoc] = await pool.query('SELECT id FROM jivandisha_locations WHERE LOWER(title) = ? LIMIT 1', [cleanTitle.toLowerCase()]);
      if (existingLoc && existingLoc.length > 0) {
        targetLocId = existingLoc[0].id;
      } else {
        const dLat = String(item.country).toUpperCase() === 'US' ? 37.0902 : 20.5937;
        const dLng = String(item.country).toUpperCase() === 'US' ? -95.7129 : 78.9629;
        const [newLoc] = await pool.query(
          `INSERT INTO jivandisha_locations (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone)
           VALUES (?, ?, 'General', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [String(item.country).toUpperCase() === 'US' ? 'US' : 'IN', cleanTitle, dLat, dLng, item.city || '', item.state || '', item.address || item.city || cleanTitle, item.notes || '', books, dateStr, payment, item.decision_maker_name || '', item.decision_maker_phone || '']
        );
        targetLocId = newLoc.insertId;
      }
    }
    if (!targetLocId) continue;

    const [res] = await pool.query(
      `INSERT INTO jivandisha_invoices (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [targetLocId, item.invoice_number || '', dateStr, books, amt, payment, item.pdf_url || '', item.pdf_name || '', item.notes || '']
    );
    affectedLocationIds.add(targetLocId);
    insertedInvoices.push({ id: res.insertId, location_id: targetLocId, invoice_number: item.invoice_number || '' });
  }

  for (const locId of affectedLocationIds) {
    const [sumRows] = await pool.query('SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?', [locId]);
    if (sumRows && sumRows.length > 0) {
      await pool.query('UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?', [sumRows[0].total_books || 0, sumRows[0].latest_date || null, locId]);
    }
  }
  return insertedInvoices;
}

async function mergeInvoices(primId, dupId, fields = {}) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const [rows] = await pool.query('SELECT id, location_id, books_sent, invoice_date FROM jivandisha_invoices WHERE id IN (?, ?)', [primId, dupId]);
  if (!rows || rows.length < 2) throw new Error('One or both invoices could not be found.');
  const primaryRow = rows.find(r => r.id === primId);
  const dupRow = rows.find(r => r.id === dupId);

  const books = fields.books_sent !== undefined && fields.books_sent !== null ? parseInt(fields.books_sent, 10) || 0 : primaryRow.books_sent;
  const dateStr = fields.invoice_date && String(fields.invoice_date).trim() ? String(fields.invoice_date).trim().slice(0, 10) : (primaryRow.invoice_date ? String(primaryRow.invoice_date).slice(0, 10) : new Date().toISOString().slice(0, 10));
  const amt = fields.amount !== undefined && fields.amount !== null && !isNaN(parseFloat(fields.amount)) ? parseFloat(fields.amount) : null;
  const payment = fields.payment_received !== undefined ? Boolean(fields.payment_received) : false;
  const targetLocId = fields.location_id ? parseInt(fields.location_id, 10) : primaryRow.location_id;

  await pool.query(
    `UPDATE jivandisha_invoices SET location_id = ?, invoice_number = ?, invoice_date = ?, books_sent = ?,
     amount = ?, payment_received = ?, pdf_url = ?, pdf_name = ?, notes = ? WHERE id = ?`,
    [targetLocId, fields.invoice_number !== undefined ? fields.invoice_number : '', dateStr, books, amt, payment, fields.pdf_url || '', fields.pdf_name || '', fields.notes || '', primId]
  );
  await pool.query('DELETE FROM jivandisha_invoices WHERE id = ?', [dupId]);

  const locs = new Set([primaryRow.location_id, dupRow.location_id, targetLocId].filter(Boolean));
  for (const lId of locs) {
    const [sumRows] = await pool.query('SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?', [lId]);
    if (sumRows && sumRows.length > 0) {
      await pool.query('UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?', [sumRows[0].total_books || 0, sumRows[0].latest_date || null, lId]);
    }
  }
}

module.exports = { batchCreateInvoices, mergeInvoices };
