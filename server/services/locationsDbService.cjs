const { getPool, ensureJivanDishaTable } = require('../db.cjs');

async function getLocations(country) {
  const pool = getPool();
  await ensureJivanDishaTable();
  let query = 'SELECT * FROM jivandisha_locations';
  const params = [];
  if (country) {
    query += ' WHERE country = ?';
    params.push(country.toUpperCase());
  }
  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows.map(loc => ({
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
}

async function createLocation(data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const sanitizedBooks = parseInt(data.books_sent, 10) || 0;
  const sanitizedDate = data.invoice_date && data.invoice_date.trim() ? data.invoice_date.trim().slice(0, 10) : null;
  const sanitizedPayment = Boolean(data.payment_received);

  const [result] = await pool.query(
    `INSERT INTO jivandisha_locations 
     (country, title, category, lat, lng, city, state, address, notes, books_sent, invoice_date, payment_received, decision_maker_name, decision_maker_phone, inventory_keeper_name, inventory_keeper_phone, invoice_pdf_url, invoice_pdf_name, contact_person, contact_phone, contact_email, website)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      (data.country || 'IN').toUpperCase(), data.title, data.category || 'General', data.lat, data.lng,
      data.city || '', data.state || '', data.address || '', data.notes || '',
      sanitizedBooks, sanitizedDate, sanitizedPayment, data.decision_maker_name || '',
      data.decision_maker_phone || '', data.inventory_keeper_name || '', data.inventory_keeper_phone || '',
      data.invoice_pdf_url || '', data.invoice_pdf_name || '', data.contact_person || '',
      data.contact_phone || '', data.contact_email || '', data.website || ''
    ]
  );

  const newLocationId = result.insertId;
  if (sanitizedDate || sanitizedBooks > 0 || data.invoice_pdf_url) {
    try {
      await pool.query(
        `INSERT INTO jivandisha_invoices (location_id, invoice_number, invoice_date, books_sent, amount, payment_received, pdf_url, pdf_name, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newLocationId, data.invoice_number || 'Initial Shipment', sanitizedDate || new Date().toISOString().slice(0, 10), sanitizedBooks, data.amount ? parseFloat(data.amount) : null, sanitizedPayment, data.invoice_pdf_url || '', data.invoice_pdf_name || '', data.notes ? data.notes.slice(0, 255) : 'Initial location setup entry']
      );
    } catch (e) { /* ignore initial invoice error */ }
  }
  return { id: newLocationId, ...data, books_sent: sanitizedBooks, invoice_date: sanitizedDate || '', payment_received: sanitizedPayment };
}

async function updateLocation(id, data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const sanitizedBooks = data.books_sent !== undefined ? (parseInt(data.books_sent, 10) || 0) : null;
  const sanitizedDate = data.invoice_date !== undefined ? (data.invoice_date && data.invoice_date.trim() ? data.invoice_date.trim().slice(0, 10) : null) : null;
  const sanitizedPayment = data.payment_received !== undefined ? Boolean(data.payment_received) : null;
  const sanitizedFollowUp = data.next_follow_up_date !== undefined ? (data.next_follow_up_date && data.next_follow_up_date.trim() ? data.next_follow_up_date.trim().slice(0, 10) : null) : undefined;

  await pool.query(
    `UPDATE jivandisha_locations SET 
     country = COALESCE(?, country), title = COALESCE(?, title), category = COALESCE(?, category),
     lat = COALESCE(?, lat), lng = COALESCE(?, lng), city = COALESCE(?, city), state = COALESCE(?, state),
     address = COALESCE(?, address), notes = COALESCE(?, notes),
     books_sent = CASE WHEN ? IS NOT NULL THEN ? ELSE books_sent END,
     invoice_date = CASE WHEN ? IS NOT NULL THEN ? ELSE invoice_date END,
     payment_received = CASE WHEN ? IS NOT NULL THEN ? ELSE payment_received END,
     decision_maker_name = COALESCE(?, decision_maker_name), decision_maker_phone = COALESCE(?, decision_maker_phone),
     inventory_keeper_name = COALESCE(?, inventory_keeper_name), inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
     invoice_pdf_url = COALESCE(?, invoice_pdf_url), invoice_pdf_name = COALESCE(?, invoice_pdf_name),
     contact_person = COALESCE(?, contact_person), contact_phone = COALESCE(?, contact_phone),
     contact_email = COALESCE(?, contact_email), website = COALESCE(?, website),
     next_follow_up_date = CASE WHEN ? IS NOT NULL THEN ? ELSE next_follow_up_date END,
     remarks = COALESCE(?, remarks) WHERE id = ?`,
    [
      data.country ? data.country.toUpperCase() : null, data.title, data.category, data.lat, data.lng,
      data.city, data.state, data.address, data.notes, sanitizedBooks !== null ? 1 : null, sanitizedBooks,
      data.invoice_date !== undefined ? 1 : null, sanitizedDate, data.payment_received !== undefined ? 1 : null,
      sanitizedPayment, data.decision_maker_name, data.decision_maker_phone, data.inventory_keeper_name,
      data.inventory_keeper_phone, data.invoice_pdf_url, data.invoice_pdf_name, data.contact_person,
      data.contact_phone, data.contact_email, data.website, sanitizedFollowUp !== undefined ? 1 : null,
      sanitizedFollowUp !== undefined ? sanitizedFollowUp : null, data.remarks, id
    ]
  );
}

async function updateFollowUp(id, data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const dateStr = data.next_follow_up_date && data.next_follow_up_date.trim() ? data.next_follow_up_date.trim().slice(0, 10) : null;
  await pool.query(
    `UPDATE jivandisha_locations SET next_follow_up_date = ?, remarks = COALESCE(?, remarks),
     decision_maker_name = COALESCE(?, decision_maker_name), decision_maker_phone = COALESCE(?, decision_maker_phone),
     inventory_keeper_name = COALESCE(?, inventory_keeper_name), inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
     contact_person = COALESCE(?, contact_person), contact_phone = COALESCE(?, contact_phone),
     contact_email = COALESCE(?, contact_email) WHERE id = ?`,
    [dateStr, data.remarks, data.decision_maker_name, data.decision_maker_phone, data.inventory_keeper_name, data.inventory_keeper_phone, data.contact_person, data.contact_phone, data.contact_email, id]
  );
}

async function deleteLocation(id) {
  const pool = getPool();
  await ensureJivanDishaTable();
  await pool.query('DELETE FROM jivandisha_invoices WHERE location_id = ?', [id]);
  await pool.query('DELETE FROM jivandisha_locations WHERE id = ?', [id]);
}

const { mergeLocations } = require('./locationsMergeDbService.cjs');

module.exports = {
  getLocations, createLocation, updateLocation, updateFollowUp, deleteLocation, mergeLocations
};
