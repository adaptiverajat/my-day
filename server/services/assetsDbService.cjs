const { getPool } = require('../db.cjs');

async function getAllAssets() {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  const [assets] = await pool.query('SELECT * FROM finances_assets ORDER BY sort_order, id');
  return assets;
}

async function addAsset({ name, amount, category, type, excluded, percent }) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  const [result] = await pool.query(
    'INSERT INTO finances_assets (name, amount, category, type, excluded, percent) VALUES (?, ?, ?, ?, ?, ?)',
    [name, amount, category, type, excluded || false, percent || null]
  );
  return result.insertId;
}

async function updateAsset(id, { name, amount, category, type, excluded, percent }) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query(
    'UPDATE finances_assets SET name = ?, amount = ?, category = ?, type = ?, excluded = ?, percent = ? WHERE id = ?',
    [name, amount, category, type, excluded || false, percent || null, id]
  );
}

async function deleteAsset(id) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  await pool.query('DELETE FROM finances_assets WHERE id = ?', [id]);
}

async function reorderAssets(assetIds) {
  const pool = getPool();
  if (!pool) throw new Error('Database not initialized');
  if (assetIds && Array.isArray(assetIds)) {
    for (let i = 0; i < assetIds.length; i++) {
      await pool.query(
        'UPDATE finances_assets SET sort_order = ? WHERE id = ?',
        [i, assetIds[i]]
      );
    }
  }
}

module.exports = {
  getAllAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  reorderAssets
};
