const { getPool, ensureJivanDishaTable } = require('../db.cjs');

async function mergeLocations(primId, dupId, fields) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const [rows] = await pool.query('SELECT * FROM jivandisha_locations WHERE id IN (?, ?)', [primId, dupId]);
  if (!rows || rows.length < 2) throw new Error('One or both contact/location records could not be found.');
  const primaryRow = rows.find(r => r.id === primId);

  await pool.query(
    `UPDATE jivandisha_locations SET
     country = COALESCE(?, country), title = COALESCE(?, title), category = COALESCE(?, category),
     city = COALESCE(?, city), state = COALESCE(?, state), address = COALESCE(?, address), notes = COALESCE(?, notes),
     decision_maker_name = COALESCE(?, decision_maker_name), decision_maker_phone = COALESCE(?, decision_maker_phone),
     inventory_keeper_name = COALESCE(?, inventory_keeper_name), inventory_keeper_phone = COALESCE(?, inventory_keeper_phone),
     contact_person = COALESCE(?, contact_person), contact_phone = COALESCE(?, contact_phone),
     contact_email = COALESCE(?, contact_email), website = COALESCE(?, website),
     next_follow_up_date = CASE WHEN ? IS NOT NULL THEN ? ELSE next_follow_up_date END,
     remarks = COALESCE(?, remarks), lat = COALESCE(?, lat), lng = COALESCE(?, lng) WHERE id = ?`,
    [
      fields.country || primaryRow.country, fields.title || primaryRow.title, fields.category || primaryRow.category,
      fields.city !== undefined ? fields.city : primaryRow.city, fields.state !== undefined ? fields.state : primaryRow.state,
      fields.address !== undefined ? fields.address : primaryRow.address, fields.notes !== undefined ? fields.notes : primaryRow.notes,
      fields.decision_maker_name !== undefined ? fields.decision_maker_name : primaryRow.decision_maker_name,
      fields.decision_maker_phone !== undefined ? fields.decision_maker_phone : primaryRow.decision_maker_phone,
      fields.inventory_keeper_name !== undefined ? fields.inventory_keeper_name : primaryRow.inventory_keeper_name,
      fields.inventory_keeper_phone !== undefined ? fields.inventory_keeper_phone : primaryRow.inventory_keeper_phone,
      fields.contact_person !== undefined ? fields.contact_person : primaryRow.contact_person,
      fields.contact_phone !== undefined ? fields.contact_phone : primaryRow.contact_phone,
      fields.contact_email !== undefined ? fields.contact_email : primaryRow.contact_email,
      fields.website !== undefined ? fields.website : primaryRow.website,
      fields.next_follow_up_date !== undefined ? 1 : null,
      fields.next_follow_up_date ? String(fields.next_follow_up_date).slice(0, 10) : null,
      fields.remarks !== undefined ? fields.remarks : primaryRow.remarks,
      fields.lat !== undefined && fields.lat !== null ? parseFloat(fields.lat) : primaryRow.lat,
      fields.lng !== undefined && fields.lng !== null ? parseFloat(fields.lng) : primaryRow.lng,
      primId
    ]
  );

  await pool.query('UPDATE jivandisha_invoices SET location_id = ? WHERE location_id = ?', [primId, dupId]);
  await pool.query('DELETE FROM jivandisha_locations WHERE id = ?', [dupId]);

  const [sumRows] = await pool.query('SELECT SUM(books_sent) as total_books, MAX(invoice_date) as latest_date FROM jivandisha_invoices WHERE location_id = ?', [primId]);
  if (sumRows && sumRows.length > 0) {
    await pool.query('UPDATE jivandisha_locations SET books_sent = ?, invoice_date = ? WHERE id = ?', [sumRows[0].total_books || 0, sumRows[0].latest_date || null, primId]);
  }
}

module.exports = { mergeLocations };
