const { pool } = require('../config/database');

async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
      sr.id,
      sr.user_id,
      au.name,
      au.phone,
      sr.school,
      sr.college,
      sr.major,
      sr.class_name,
      sr.student_no,
      sr.enrollment_year,
      sr.graduation_year,
      sr.status,
      sr.created_at,
      sr.updated_at
     FROM alumni_student_records sr
     INNER JOIN alumni_users au ON au.id = sr.user_id
     WHERE sr.user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      sr.id,
      sr.user_id,
      au.name,
      au.phone,
      sr.school,
      sr.college,
      sr.major,
      sr.class_name,
      sr.student_no,
      sr.enrollment_year,
      sr.graduation_year,
      sr.status,
      sr.created_at,
      sr.updated_at
     FROM alumni_student_records sr
     INNER JOIN alumni_users au ON au.id = sr.user_id
     WHERE sr.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function listStudentRecords({ current, pageSize, keyword, status, enrollmentYear, major }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(au.name LIKE ? OR sr.student_no LIKE ? OR sr.college LIKE ? OR sr.class_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (typeof status === 'number') {
    conditions.push('sr.status = ?');
    params.push(status);
  }

  if (typeof enrollmentYear === 'number') {
    conditions.push('sr.enrollment_year = ?');
    params.push(enrollmentYear);
  }

  if (major) {
    conditions.push('sr.major LIKE ?');
    params.push(`%${major}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM alumni_student_records sr
     INNER JOIN alumni_users au ON au.id = sr.user_id
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      sr.id,
      sr.user_id,
      au.name,
      au.phone,
      sr.school,
      sr.college,
      sr.major,
      sr.class_name,
      sr.student_no,
      sr.enrollment_year,
      sr.graduation_year,
      sr.status,
      sr.created_at,
      sr.updated_at
     FROM alumni_student_records sr
     INNER JOIN alumni_users au ON au.id = sr.user_id
     ${whereClause}
     ORDER BY sr.updated_at DESC, sr.id DESC
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

async function updateStudentRecordStatus(id, status) {
  await pool.execute(
    `UPDATE alumni_student_records
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );
}

module.exports = {
  findById,
  findByUserId,
  listStudentRecords,
  updateStudentRecordStatus,
};
