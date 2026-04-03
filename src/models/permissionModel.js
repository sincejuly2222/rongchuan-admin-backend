// Permission data access layer: exposes paginated permission lists from the admin schema.
const { pool } = require('../config/database');

async function listPermissions({ current, pageSize, permissionCode, permissionName }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (permissionCode) {
    conditions.push('p.permission_code LIKE ?');
    params.push(`%${permissionCode}%`);
  }

  if (permissionName) {
    conditions.push('p.permission_name LIKE ?');
    params.push(`%${permissionName}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM sys_permissions p
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.permission_code,
      p.permission_name,
      p.description,
      p.created_at,
      p.updated_at,
      COUNT(DISTINCT rp.role_id) AS role_count
     FROM sys_permissions p
     LEFT JOIN sys_role_permissions rp ON rp.permission_id = p.id
     ${whereClause}
     GROUP BY
      p.id,
      p.permission_code,
      p.permission_name,
      p.description,
      p.created_at,
      p.updated_at
     ORDER BY p.id DESC
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

async function findByPermissionCode(permissionCode) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      permission_code,
      permission_name,
      description,
      created_at,
      updated_at
     FROM sys_permissions
     WHERE permission_code = ?
     LIMIT 1`,
    [permissionCode]
  );

  return rows[0] || null;
}

async function findByPermissionCodeExcludingId(permissionCode, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_permissions
     WHERE permission_code = ? AND id <> ?
     LIMIT 1`,
    [permissionCode, excludedId]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      p.id,
      p.permission_code,
      p.permission_name,
      p.description,
      p.created_at,
      p.updated_at,
      COUNT(DISTINCT rp.role_id) AS role_count
     FROM sys_permissions p
     LEFT JOIN sys_role_permissions rp ON rp.permission_id = p.id
     WHERE p.id = ?
     GROUP BY
      p.id,
      p.permission_code,
      p.permission_name,
      p.description,
      p.created_at,
      p.updated_at
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function createPermission({ permissionCode, permissionName, description = null }) {
  const [result] = await pool.execute(
    `INSERT INTO sys_permissions
      (permission_code, permission_name, description)
     VALUES (?, ?, ?)`,
    [permissionCode, permissionName, description]
  );

  return findById(result.insertId);
}

async function updatePermission(id, { permissionCode, permissionName, description = null }) {
  await pool.execute(
    `UPDATE sys_permissions
     SET permission_code = ?, permission_name = ?, description = ?
     WHERE id = ?`,
    [permissionCode, permissionName, description, id]
  );

  return findById(id);
}

module.exports = {
  createPermission,
  findById,
  findByPermissionCode,
  findByPermissionCodeExcludingId,
  listPermissions,
  updatePermission,
};
