const { pool } = require('../config/database');

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      e.id,
      e.from_user_id,
      from_user.name AS from_user_name,
      e.to_user_id,
      to_user.name AS to_user_name,
      e.status,
      e.message,
      e.created_at,
      e.updated_at
     FROM alumni_card_exchanges e
     INNER JOIN alumni_users from_user ON from_user.id = e.from_user_id
     INNER JOIN alumni_users to_user ON to_user.id = e.to_user_id
     WHERE e.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findByPair(fromUserId, toUserId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM alumni_card_exchanges
     WHERE from_user_id = ? AND to_user_id = ?
     LIMIT 1`,
    [fromUserId, toUserId]
  );

  return rows[0] || null;
}

async function listExchanges({ current, pageSize, status, fromUserId, toUserId }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (typeof status === 'number') {
    conditions.push('e.status = ?');
    params.push(status);
  }

  if (typeof fromUserId === 'number') {
    conditions.push('e.from_user_id = ?');
    params.push(fromUserId);
  }

  if (typeof toUserId === 'number') {
    conditions.push('e.to_user_id = ?');
    params.push(toUserId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM alumni_card_exchanges e
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.from_user_id,
      from_user.name AS from_user_name,
      e.to_user_id,
      to_user.name AS to_user_name,
      e.status,
      e.message,
      e.created_at,
      e.updated_at
     FROM alumni_card_exchanges e
     INNER JOIN alumni_users from_user ON from_user.id = e.from_user_id
     INNER JOIN alumni_users to_user ON to_user.id = e.to_user_id
     ${whereClause}
     ORDER BY e.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows,
    total: countRows[0].total,
    current,
    pageSize,
  };
}

async function createExchange({ fromUserId, toUserId, status = 0, message = null }) {
  const [result] = await pool.execute(
    `INSERT INTO alumni_card_exchanges
      (from_user_id, to_user_id, status, message)
     VALUES (?, ?, ?, ?)`,
    [fromUserId, toUserId, status, message]
  );

  return findById(result.insertId);
}

async function updateExchangeStatus(id, status) {
  await pool.execute(
    `UPDATE alumni_card_exchanges
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );

  return findById(id);
}

module.exports = {
  findById,
  findByPair,
  listExchanges,
  createExchange,
  updateExchangeStatus,
};
