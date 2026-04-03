// User data access layer: encapsulates reads and writes against the sys_users table.
const { pool } = require('../config/database');

function mapManagedUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatar: row.avatar,
    status: row.status,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    role_names: row.role_names || '',
    role_ids: row.role_ids
      ? String(row.role_ids)
          .split(',')
          .filter(Boolean)
          .map((value) => Number(value))
      : [],
  };
}

async function findByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      username,
      email,
      password_hash AS password,
      name,
      phone,
      avatar,
      status,
      last_login_at,
      created_at,
      updated_at
     FROM sys_users
     WHERE username = ?
     LIMIT 1`,
    [username]
  );

  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      username,
      email,
      password_hash AS password,
      name,
      phone,
      avatar,
      status,
      last_login_at,
      created_at,
      updated_at
     FROM sys_users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
}

async function createUser({ username, email, password, avatar = null }) {
  const [result] = await pool.execute(
    `INSERT INTO sys_users
      (username, password_hash, name, email, avatar, status)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [username, password, username, email, avatar]
  );

  return {
    id: result.insertId,
    username,
    email,
    avatar,
  };
}

async function findRoleIds(roleIds) {
  if (roleIds.length === 0) {
    return [];
  }

  const placeholders = roleIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT id
     FROM sys_roles
     WHERE id IN (${placeholders})`,
    roleIds
  );

  return rows.map((row) => row.id);
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      username,
      email,
      name,
      phone,
      avatar,
      status,
      last_login_at,
      created_at,
      updated_at
     FROM sys_users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findByIdWithPassword(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      username,
      email,
      password_hash AS password,
      name,
      phone,
      avatar,
      status,
      last_login_at,
      created_at,
      updated_at
     FROM sys_users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findManagedUserById(id) {
  const [rows] = await pool.execute(
    `SELECT
      u.id,
      u.username,
      u.name,
      u.email,
      u.phone,
      u.avatar,
      u.status,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.id SEPARATOR ', ') AS role_names,
      GROUP_CONCAT(DISTINCT r.id ORDER BY r.id SEPARATOR ',') AS role_ids
     FROM sys_users u
     LEFT JOIN sys_user_roles ur ON ur.user_id = u.id
     LEFT JOIN sys_roles r ON r.id = ur.role_id
     WHERE u.id = ?
     GROUP BY
      u.id,
      u.username,
      u.name,
      u.email,
      u.phone,
      u.avatar,
      u.status,
      u.last_login_at,
      u.created_at,
      u.updated_at
     LIMIT 1`,
    [id]
  );

  return mapManagedUserRow(rows[0]);
}

async function findByUsernameExcludingId(username, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_users
     WHERE username = ? AND id <> ?
     LIMIT 1`,
    [username, excludedId]
  );

  return rows[0] || null;
}

async function findByEmailExcludingId(email, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM sys_users
     WHERE email = ? AND id <> ?
     LIMIT 1`,
    [email, excludedId]
  );

  return rows[0] || null;
}

async function updateLastLoginAt(id) {
  await pool.execute(
    'UPDATE sys_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );
}

async function listUsers({ current, pageSize, username, name, status }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (username) {
    conditions.push('u.username LIKE ?');
    params.push(`%${username}%`);
  }

  if (name) {
    conditions.push('u.name LIKE ?');
    params.push(`%${name}%`);
  }

  if (typeof status === 'number') {
    conditions.push('u.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM sys_users u
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.username,
      u.name,
      u.email,
      u.phone,
      u.avatar,
      u.status,
      u.last_login_at,
      u.created_at,
      GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.id SEPARATOR ', ') AS role_names
     FROM sys_users u
     LEFT JOIN sys_user_roles ur ON ur.user_id = u.id
     LEFT JOIN sys_roles r ON r.id = ur.role_id
     ${whereClause}
     GROUP BY
      u.id,
      u.username,
      u.name,
      u.email,
      u.phone,
      u.avatar,
      u.status,
      u.last_login_at,
      u.created_at
     ORDER BY u.id DESC
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

async function updateStatus(id, status) {
  await pool.execute(
    'UPDATE sys_users SET status = ? WHERE id = ?',
    [status, id]
  );
}

async function createManagedUser({
  username,
  passwordHash,
  name,
  email,
  phone = null,
  avatar = null,
  status = 1,
  roleIds = [],
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO sys_users
        (username, password_hash, name, email, phone, avatar, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, passwordHash, name, email, phone, avatar, status]
    );

    if (roleIds.length > 0) {
      const values = roleIds.map((roleId) => [result.insertId, roleId]);
      await connection.query(
        'INSERT INTO sys_user_roles (user_id, role_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();

    return findManagedUserById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateManagedUser(id, {
  username,
  name,
  email,
  passwordHash,
  phone = null,
  avatar = null,
  status,
  roleIds,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (passwordHash) {
      await connection.execute(
        `UPDATE sys_users
         SET username = ?, name = ?, email = ?, password_hash = ?, phone = ?, avatar = ?, status = ?
         WHERE id = ?`,
        [username, name, email, passwordHash, phone, avatar, status, id]
      );
    } else {
      await connection.execute(
        `UPDATE sys_users
         SET username = ?, name = ?, email = ?, phone = ?, avatar = ?, status = ?
         WHERE id = ?`,
        [username, name, email, phone, avatar, status, id]
      );
    }

    if (Array.isArray(roleIds)) {
      await connection.execute(
        'DELETE FROM sys_user_roles WHERE user_id = ?',
        [id]
      );

      if (roleIds.length > 0) {
        const values = roleIds.map((roleId) => [id, roleId]);
        await connection.query(
          'INSERT INTO sys_user_roles (user_id, role_id) VALUES ?',
          [values]
        );
      }
    }

    await connection.commit();

    return findManagedUserById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateCurrentUserProfile(id, {
  name,
  email,
  phone = null,
  avatar = null,
}) {
  await pool.execute(
    `UPDATE sys_users
     SET name = ?, email = ?, phone = ?, avatar = ?
     WHERE id = ?`,
    [name, email, phone, avatar, id]
  );

  return findManagedUserById(id);
}

async function updateCurrentUserPassword(id, passwordHash) {
  await pool.execute(
    `UPDATE sys_users
     SET password_hash = ?
     WHERE id = ?`,
    [passwordHash, id]
  );
}

module.exports = {
  findByUsername,
  findByEmail,
  createUser,
  findRoleIds,
  findById,
  findByIdWithPassword,
  findManagedUserById,
  findByUsernameExcludingId,
  findByEmailExcludingId,
  updateLastLoginAt,
  listUsers,
  updateStatus,
  createManagedUser,
  updateManagedUser,
  updateCurrentUserProfile,
  updateCurrentUserPassword,
};
