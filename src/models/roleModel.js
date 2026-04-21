// Role data access layer: reads role lists and aggregate counts from the admin schema.
const { pool } = require('../config/database');

async function listRoles({ current, pageSize, roleName, roleCode, status }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (roleName) {
    conditions.push('r.role_name LIKE ?');
    params.push(`%${roleName}%`);
  }

  if (roleCode) {
    conditions.push('r.role_code LIKE ?');
    params.push(`%${roleCode}%`);
  }

  if (typeof status === 'number') {
    conditions.push('r.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM sys_roles r
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      r.id,
      r.role_name,
      r.role_code,
      r.description,
      r.status,
      r.created_at,
      r.updated_at,
      COUNT(DISTINCT ur.user_id) AS member_count,
      COUNT(DISTINCT rm.menu_id) AS menu_count
     FROM sys_roles r
     LEFT JOIN sys_user_roles ur ON ur.role_id = r.id
     LEFT JOIN sys_role_menus rm ON rm.role_id = r.id
     ${whereClause}
     GROUP BY
      r.id,
      r.role_name,
      r.role_code,
      r.description,
      r.status,
      r.created_at,
      r.updated_at
     ORDER BY r.id DESC
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

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      r.id,
      r.role_name,
      r.role_code,
      r.description,
      r.status,
      r.created_at,
      r.updated_at,
      COUNT(DISTINCT ur.user_id) AS member_count,
      COUNT(DISTINCT rm.menu_id) AS menu_count
     FROM sys_roles r
     LEFT JOIN sys_user_roles ur ON ur.role_id = r.id
     LEFT JOIN sys_role_menus rm ON rm.role_id = r.id
     WHERE r.id = ?
     GROUP BY
      r.id,
      r.role_name,
      r.role_code,
      r.description,
      r.status,
      r.created_at,
      r.updated_at
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findByRoleCode(roleCode) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_roles
     WHERE role_code = ?
     LIMIT 1`,
    [roleCode]
  );

  return rows[0] || null;
}

async function findByRoleCodeExcludingId(roleCode, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_roles
     WHERE role_code = ? AND id <> ?
     LIMIT 1`,
    [roleCode, excludedId]
  );

  return rows[0] || null;
}

async function findMenuIds(menuIds) {
  if (menuIds.length === 0) {
    return [];
  }

  const placeholders = menuIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT id
     FROM sys_menus
     WHERE id IN (${placeholders})`,
    menuIds
  );

  return rows.map((row) => row.id);
}

async function getRoleMenuIds(roleId) {
  const [rows] = await pool.execute(
    `SELECT menu_id
     FROM sys_role_menus
     WHERE role_id = ?
     ORDER BY menu_id ASC`,
    [roleId]
  );

  return rows.map((row) => row.menu_id);
}

async function updateRoleMenus(roleId, menuIds) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      'DELETE FROM sys_role_menus WHERE role_id = ?',
      [roleId]
    );

    if (menuIds.length > 0) {
      const values = menuIds.map((menuId) => [roleId, menuId]);
      await connection.query(
        'INSERT INTO sys_role_menus (role_id, menu_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    return getRoleMenuIds(roleId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createRole({ roleName, roleCode, description = null, status = 1 }) {
  const [result] = await pool.execute(
    `INSERT INTO sys_roles
      (role_name, role_code, description, status)
     VALUES (?, ?, ?, ?)`,
    [roleName, roleCode, description, status]
  );

  return findById(result.insertId);
}

async function updateRole(id, { roleName, roleCode, description = null, status }) {
  await pool.execute(
    `UPDATE sys_roles
     SET role_name = ?, role_code = ?, description = ?, status = ?
     WHERE id = ?`,
    [roleName, roleCode, description, status, id]
  );

  return findById(id);
}

module.exports = {
  createRole,
  findById,
  findByRoleCode,
  findByRoleCodeExcludingId,
  findMenuIds,
  getRoleMenuIds,
  listRoles,
  updateRole,
  updateRoleMenus,
};
