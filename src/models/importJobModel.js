const { pool } = require('../config/database');

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      type,
      operator_name,
      status,
      total_count,
      success_count,
      failed_count,
      error_details,
      created_at,
      updated_at
     FROM alumni_import_jobs
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function listImportJobs({ current, pageSize, type, status }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (typeof status === 'number') {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM alumni_import_jobs
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      id,
      name,
      type,
      operator_name,
      status,
      total_count,
      success_count,
      failed_count,
      error_details,
      created_at,
      updated_at
     FROM alumni_import_jobs
     ${whereClause}
     ORDER BY created_at DESC, id DESC
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

async function createImportJob({
  name,
  type,
  operatorName,
  status = 0,
  totalCount = 0,
  successCount = 0,
  failedCount = 0,
  errorDetails = null,
}) {
  const serializedErrorDetails = errorDetails ? JSON.stringify(errorDetails) : null;
  const [result] = await pool.execute(
    `INSERT INTO alumni_import_jobs
      (name, type, operator_name, status, total_count, success_count, failed_count, error_details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, operatorName, status, totalCount, successCount, failedCount, serializedErrorDetails]
  );

  return findById(result.insertId);
}

module.exports = {
  createImportJob,
  findById,
  listImportJobs,
};
