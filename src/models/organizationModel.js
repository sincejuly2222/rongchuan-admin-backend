const { pool } = require('../config/database');

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      type,
      principal,
      city,
      member_count,
      pending_count,
      active_count,
      founded_at,
      status,
      description,
      created_at,
      updated_at
     FROM alumni_organizations
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function listOrganizations({ current, pageSize, keyword, type, status, city }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(name LIKE ? OR principal LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (typeof status === 'number') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (city) {
    conditions.push('city LIKE ?');
    params.push(`%${city}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM alumni_organizations
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      id,
      name,
      type,
      principal,
      city,
      member_count,
      pending_count,
      active_count,
      founded_at,
      status,
      description,
      created_at,
      updated_at
     FROM alumni_organizations
     ${whereClause}
     ORDER BY updated_at DESC, id DESC
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

async function createOrganization({
  name,
  type,
  principal = null,
  city = null,
  memberCount = 0,
  pendingCount = 0,
  activeCount = 0,
  foundedAt = null,
  status = 1,
  description = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO alumni_organizations
      (name, type, principal, city, member_count, pending_count, active_count, founded_at, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, principal, city, memberCount, pendingCount, activeCount, foundedAt, status, description]
  );

  return findById(result.insertId);
}

async function updateOrganization(id, {
  name,
  type,
  principal = null,
  city = null,
  memberCount = 0,
  pendingCount = 0,
  activeCount = 0,
  foundedAt = null,
  status = 1,
  description = null,
}) {
  await pool.execute(
    `UPDATE alumni_organizations
     SET name = ?, type = ?, principal = ?, city = ?, member_count = ?, pending_count = ?, active_count = ?,
         founded_at = ?, status = ?, description = ?
     WHERE id = ?`,
    [name, type, principal, city, memberCount, pendingCount, activeCount, foundedAt, status, description, id]
  );

  return findById(id);
}

async function updateStatus(id, status) {
  await pool.execute(
    `UPDATE alumni_organizations
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );
}

module.exports = {
  createOrganization,
  findById,
  listOrganizations,
  updateOrganization,
  updateStatus,
};
