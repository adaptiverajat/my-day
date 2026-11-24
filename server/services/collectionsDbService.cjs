const { getPool, ensureJivanDishaTable } = require('../db.cjs');

async function getIndividualCollections(search) {
  const pool = getPool();
  await ensureJivanDishaTable();
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
      id: r.id, individual_name: r.individual_name || '', count: cCount,
      date: r.date ? String(r.date).slice(0, 10) : '', cost: cCost,
      collection: cCollection, notes: r.notes || '', created_at: r.created_at, updated_at: r.updated_at
    };
  });

  const stats = {
    total_records: collections.length, total_count: totalCount,
    total_cost: parseFloat(totalCost.toFixed(2)), total_collection: parseFloat(totalCollection.toFixed(2)),
    net_balance: parseFloat((totalCollection - totalCost).toFixed(2))
  };
  return { collections, stats };
}

async function createIndividualCollection(data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const name = String(data.individual_name || '').trim();
  if (!name) throw new Error('Individual Name is required');
  const count = parseInt(data.count, 10) || 0;
  const dateStr = data.date && String(data.date).trim() ? String(data.date).trim().slice(0, 10) : null;
  const cost = isNaN(parseFloat(data.cost)) ? 0 : parseFloat(data.cost);
  const collection = isNaN(parseFloat(data.collection)) ? 0 : parseFloat(data.collection);

  const [res] = await pool.query(
    `INSERT INTO jivandisha_individual_collections (individual_name, count, date, cost, collection, notes) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, count, dateStr, cost, collection, data.notes || '']
  );
  return res.insertId;
}

async function bulkCreateIndividualCollections(records) {
  const pool = getPool();
  await ensureJivanDishaTable();
  let inserted = 0;
  for (const rec of records) {
    if (!rec.individual_name || !String(rec.individual_name).trim()) continue;
    const name = String(rec.individual_name).trim();
    const count = parseInt(rec.count, 10) || 0;
    const dateStr = rec.date && String(rec.date).trim() ? String(rec.date).trim().slice(0, 10) : null;
    const cost = isNaN(parseFloat(rec.cost)) ? 0 : parseFloat(rec.cost);
    const coll = isNaN(parseFloat(rec.collection)) ? 0 : parseFloat(rec.collection);

    await pool.query(
      `INSERT INTO jivandisha_individual_collections (individual_name, count, date, cost, collection, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, count, dateStr, cost, coll, rec.notes || '']
    );
    inserted++;
  }
  return inserted;
}

async function updateIndividualCollection(id, data) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const name = String(data.individual_name || '').trim();
  if (!name) throw new Error('Individual Name is required');
  const count = parseInt(data.count, 10) || 0;
  const dateStr = data.date && String(data.date).trim() ? String(data.date).trim().slice(0, 10) : null;
  const cost = isNaN(parseFloat(data.cost)) ? 0 : parseFloat(data.cost);
  const coll = isNaN(parseFloat(data.collection)) ? 0 : parseFloat(data.collection);

  await pool.query(
    `UPDATE jivandisha_individual_collections SET individual_name = ?, count = ?, date = ?, cost = ?, collection = ?, notes = ? WHERE id = ?`,
    [name, count, dateStr, cost, coll, data.notes || '', id]
  );
}

async function deleteIndividualCollection(id) {
  const pool = getPool();
  await ensureJivanDishaTable();
  await pool.query('DELETE FROM jivandisha_individual_collections WHERE id = ?', [id]);
}

async function bulkDeleteIndividualCollections(ids) {
  const pool = getPool();
  await ensureJivanDishaTable();
  await pool.query(`DELETE FROM jivandisha_individual_collections WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
}

async function mergeIndividualCollections(primId, dupId, fields = {}) {
  const pool = getPool();
  await ensureJivanDishaTable();
  const [rows] = await pool.query('SELECT * FROM jivandisha_individual_collections WHERE id IN (?, ?)', [primId, dupId]);
  if (!rows || rows.length < 2) throw new Error('One or both records not found');
  const primaryRow = rows.find(r => r.id === primId);
  const dupRow = rows.find(r => r.id === dupId);

  const name = fields.individual_name !== undefined ? fields.individual_name : primaryRow.individual_name;
  const count = fields.count !== undefined ? parseInt(fields.count, 10) : primaryRow.count;
  const dateStr = fields.date ? String(fields.date).slice(0, 10) : (primaryRow.date ? String(primaryRow.date).slice(0, 10) : null);
  const cost = fields.cost !== undefined ? parseFloat(fields.cost) : primaryRow.cost;
  const coll = fields.collection !== undefined ? parseFloat(fields.collection) : primaryRow.collection;
  const notes = fields.notes !== undefined ? fields.notes : [primaryRow.notes, dupRow.notes].filter(Boolean).join(' | ');

  await pool.query(
    `UPDATE jivandisha_individual_collections SET individual_name = ?, count = ?, date = ?, cost = ?, collection = ?, notes = ? WHERE id = ?`,
    [name, count, dateStr, cost, coll, notes, primId]
  );
  await pool.query('DELETE FROM jivandisha_individual_collections WHERE id = ?', [dupId]);
}

module.exports = {
  getIndividualCollections, createIndividualCollection, bulkCreateIndividualCollections,
  updateIndividualCollection, deleteIndividualCollection, bulkDeleteIndividualCollections,
  mergeIndividualCollections
};
