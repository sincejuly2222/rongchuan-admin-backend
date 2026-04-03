const { pool } = require('../config/database');

async function listMenus({ current, pageSize, menuName, status }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (menuName) {
    conditions.push('m.menu_name LIKE ?');
    params.push(`%${menuName}%`);
  }

  if (typeof status === 'number') {
    conditions.push('m.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM sys_menus m
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.parent_id,
      m.menu_name,
      m.menu_code,
      m.path,
      m.component,
      m.icon,
      m.sort_order,
      m.status,
      m.created_at,
      m.updated_at,
      parent.menu_name AS parent_name
     FROM sys_menus m
     LEFT JOIN sys_menus parent ON parent.id = m.parent_id
     ${whereClause}
     ORDER BY m.sort_order ASC, m.id ASC
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
      m.id,
      m.parent_id,
      m.menu_name,
      m.menu_code,
      m.path,
      m.component,
      m.icon,
      m.sort_order,
      m.status,
      m.created_at,
      m.updated_at,
      parent.menu_name AS parent_name
     FROM sys_menus m
     LEFT JOIN sys_menus parent ON parent.id = m.parent_id
     WHERE m.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findByMenuCode(menuCode) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_menus
     WHERE menu_code = ?
     LIMIT 1`,
    [menuCode]
  );

  return rows[0] || null;
}

async function findByMenuCodeExcludingId(menuCode, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_menus
     WHERE menu_code = ? AND id <> ?
     LIMIT 1`,
    [menuCode, excludedId]
  );

  return rows[0] || null;
}

async function createMenu({
  parentId = 0,
  menuName,
  menuCode,
  path = null,
  component = null,
  icon = null,
  sortOrder = 0,
  status = 1,
}) {
  const [result] = await pool.execute(
    `INSERT INTO sys_menus
      (parent_id, menu_name, menu_code, path, component, icon, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [parentId, menuName, menuCode, path, component, icon, sortOrder, status]
  );

  return findById(result.insertId);
}

async function updateMenu(id, {
  parentId = 0,
  menuName,
  menuCode,
  path = null,
  component = null,
  icon = null,
  sortOrder = 0,
  status,
}) {
  await pool.execute(
    `UPDATE sys_menus
     SET parent_id = ?, menu_name = ?, menu_code = ?, path = ?, component = ?, icon = ?, sort_order = ?, status = ?
     WHERE id = ?`,
    [parentId, menuName, menuCode, path, component, icon, sortOrder, status, id]
  );

  return findById(id);
}

async function updateStatus(id, status) {
  await pool.execute(
    'UPDATE sys_menus SET status = ? WHERE id = ?',
    [status, id]
  );
}

module.exports = {
  createMenu,
  findById,
  findByMenuCode,
  findByMenuCodeExcludingId,
  listMenus,
  updateMenu,
  updateStatus,
};
