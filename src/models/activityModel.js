const { pool } = require('../config/database');

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.name,
      a.type,
      a.organization_id,
      o.name AS organization_name,
      a.city,
      a.venue,
      a.start_time,
      a.end_time,
      a.capacity,
      a.enrollments,
      a.status,
      a.description,
      a.created_at,
      a.updated_at
     FROM alumni_activities a
     LEFT JOIN alumni_organizations o ON o.id = a.organization_id
     WHERE a.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function listActivities({ current, pageSize, keyword, type, status, city, organizationId }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(a.name LIKE ? OR o.name LIKE ? OR a.venue LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (type) {
    conditions.push('a.type = ?');
    params.push(type);
  }

  if (typeof status === 'number') {
    conditions.push('a.status = ?');
    params.push(status);
  }

  if (city) {
    conditions.push('a.city LIKE ?');
    params.push(`%${city}%`);
  }

  if (typeof organizationId === 'number') {
    conditions.push('a.organization_id = ?');
    params.push(organizationId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM alumni_activities a
     LEFT JOIN alumni_organizations o ON o.id = a.organization_id
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      a.id,
      a.name,
      a.type,
      a.organization_id,
      o.name AS organization_name,
      a.city,
      a.venue,
      a.start_time,
      a.end_time,
      a.capacity,
      a.enrollments,
      a.status,
      a.description,
      a.created_at,
      a.updated_at
     FROM alumni_activities a
     LEFT JOIN alumni_organizations o ON o.id = a.organization_id
     ${whereClause}
     ORDER BY a.start_time DESC, a.id DESC
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

async function createActivity({
  name,
  type,
  organizationId = null,
  city = null,
  venue = null,
  startTime,
  endTime = null,
  capacity = 0,
  enrollments = 0,
  status = 0,
  description = null,
}) {
  const [result] = await pool.execute(
    `INSERT INTO alumni_activities
      (name, type, organization_id, city, venue, start_time, end_time, capacity, enrollments, status, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, organizationId, city, venue, startTime, endTime, capacity, enrollments, status, description]
  );

  return findById(result.insertId);
}

async function updateActivity(id, {
  name,
  type,
  organizationId = null,
  city = null,
  venue = null,
  startTime,
  endTime = null,
  capacity = 0,
  enrollments = 0,
  status = 0,
  description = null,
}) {
  await pool.execute(
    `UPDATE alumni_activities
     SET name = ?, type = ?, organization_id = ?, city = ?, venue = ?, start_time = ?, end_time = ?,
         capacity = ?, enrollments = ?, status = ?, description = ?
     WHERE id = ?`,
    [name, type, organizationId, city, venue, startTime, endTime, capacity, enrollments, status, description, id]
  );

  return findById(id);
}

async function updateStatus(id, status) {
  await pool.execute(
    `UPDATE alumni_activities
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );
}

module.exports = {
  createActivity,
  findById,
  listActivities,
  updateActivity,
  updateStatus,
};
