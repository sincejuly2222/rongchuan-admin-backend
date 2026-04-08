const { pool } = require('../config/database');

function mapAlumniUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    open_id: row.open_id,
    phone: row.phone,
    name: row.name,
    avatar: row.avatar,
    gender: row.gender,
    company: row.company,
    position: row.position,
    city: row.city,
    bio: row.bio,
    status: row.status,
    verified_status: row.verified_status,
    allow_search: row.allow_search,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student_record: row.student_record_id
      ? {
          id: row.student_record_id,
          school: row.school,
          college: row.college,
          major: row.major,
          class_name: row.class_name,
          student_no: row.student_no,
          enrollment_year: row.enrollment_year,
          graduation_year: row.graduation_year,
          status: row.student_record_status,
        }
      : null,
    card: row.card_id
      ? {
          id: row.card_id,
          slogan: row.slogan,
          show_phone: row.show_phone,
          show_wechat: row.show_wechat,
          wechat: row.wechat,
          need_approval: row.need_approval,
          allow_search: row.card_allow_search,
        }
      : null,
  };
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      au.id,
      au.open_id,
      au.phone,
      au.name,
      au.avatar,
      au.gender,
      au.company,
      au.position,
      au.city,
      au.bio,
      au.status,
      au.verified_status,
      au.allow_search,
      au.created_at,
      au.updated_at,
      sr.id AS student_record_id,
      sr.school,
      sr.college,
      sr.major,
      sr.class_name,
      sr.student_no,
      sr.enrollment_year,
      sr.graduation_year,
      sr.status AS student_record_status,
      c.id AS card_id,
      c.slogan,
      c.show_phone,
      c.show_wechat,
      c.wechat,
      c.need_approval,
      c.allow_search AS card_allow_search
     FROM alumni_users au
     LEFT JOIN alumni_student_records sr ON sr.user_id = au.id
     LEFT JOIN alumni_cards c ON c.user_id = au.id
     WHERE au.id = ?
     LIMIT 1`,
    [id]
  );

  return mapAlumniUserRow(rows[0]);
}

async function findByOpenId(openId) {
  const [rows] = await pool.execute(
    `SELECT id, open_id
     FROM alumni_users
     WHERE open_id = ?
     LIMIT 1`,
    [openId]
  );

  return rows[0] || null;
}

async function findByPhone(phone) {
  const [rows] = await pool.execute(
    `SELECT id, phone
     FROM alumni_users
     WHERE phone = ?
     LIMIT 1`,
    [phone]
  );

  return rows[0] || null;
}

async function findByOpenIdExcludingId(openId, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM alumni_users
     WHERE open_id = ? AND id <> ?
     LIMIT 1`,
    [openId, excludedId]
  );

  return rows[0] || null;
}

async function findByPhoneExcludingId(phone, excludedId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM alumni_users
     WHERE phone = ? AND id <> ?
     LIMIT 1`,
    [phone, excludedId]
  );

  return rows[0] || null;
}

async function listUsers({
  current,
  pageSize,
  keyword,
  status,
  verifiedStatus,
  enrollmentYear,
  major,
  className,
  company,
}) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(au.name LIKE ? OR au.company LIKE ? OR au.phone LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (typeof status === 'number') {
    conditions.push('au.status = ?');
    params.push(status);
  }

  if (typeof verifiedStatus === 'number') {
    conditions.push('au.verified_status = ?');
    params.push(verifiedStatus);
  }

  if (typeof enrollmentYear === 'number') {
    conditions.push('sr.enrollment_year = ?');
    params.push(enrollmentYear);
  }

  if (major) {
    conditions.push('sr.major LIKE ?');
    params.push(`%${major}%`);
  }

  if (className) {
    conditions.push('sr.class_name LIKE ?');
    params.push(`%${className}%`);
  }

  if (company) {
    conditions.push('au.company LIKE ?');
    params.push(`%${company}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(DISTINCT au.id) AS total
     FROM alumni_users au
     LEFT JOIN alumni_student_records sr ON sr.user_id = au.id
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      au.id,
      au.open_id,
      au.phone,
      au.name,
      au.avatar,
      au.gender,
      au.company,
      au.position,
      au.city,
      au.status,
      au.verified_status,
      au.allow_search,
      au.created_at,
      sr.school,
      sr.college,
      sr.major,
      sr.class_name,
      sr.enrollment_year,
      c.slogan
     FROM alumni_users au
     LEFT JOIN alumni_student_records sr ON sr.user_id = au.id
     LEFT JOIN alumni_cards c ON c.user_id = au.id
     ${whereClause}
     ORDER BY au.id DESC
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

async function createUser({
  openId = null,
  phone = null,
  name,
  avatar = null,
  gender = null,
  company = null,
  position = null,
  city = null,
  bio = null,
  status = 1,
  verifiedStatus = 0,
  allowSearch = 1,
}) {
  const [result] = await pool.execute(
    `INSERT INTO alumni_users
      (open_id, phone, name, avatar, gender, company, position, city, bio, status, verified_status, allow_search)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [openId, phone, name, avatar, gender, company, position, city, bio, status, verifiedStatus, allowSearch]
  );

  return findById(result.insertId);
}

async function updateUser(id, {
  openId = null,
  phone = null,
  name,
  avatar = null,
  gender = null,
  company = null,
  position = null,
  city = null,
  bio = null,
  status,
  verifiedStatus,
  allowSearch,
}) {
  await pool.execute(
    `UPDATE alumni_users
     SET open_id = ?, phone = ?, name = ?, avatar = ?, gender = ?, company = ?, position = ?, city = ?, bio = ?,
         status = ?, verified_status = ?, allow_search = ?
     WHERE id = ?`,
    [openId, phone, name, avatar, gender, company, position, city, bio, status, verifiedStatus, allowSearch, id]
  );

  return findById(id);
}

async function updateStatus(id, status) {
  await pool.execute(
    `UPDATE alumni_users
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );
}

async function upsertStudentRecord(userId, {
  school,
  college = null,
  major,
  className = null,
  studentNo = null,
  enrollmentYear,
  graduationYear = null,
  status = 0,
}) {
  await pool.execute(
    `INSERT INTO alumni_student_records
      (user_id, school, college, major, class_name, student_no, enrollment_year, graduation_year, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      school = VALUES(school),
      college = VALUES(college),
      major = VALUES(major),
      class_name = VALUES(class_name),
      student_no = VALUES(student_no),
      enrollment_year = VALUES(enrollment_year),
      graduation_year = VALUES(graduation_year),
      status = VALUES(status)`,
    [userId, school, college, major, className, studentNo, enrollmentYear, graduationYear, status]
  );

  return findById(userId);
}

async function upsertCard(userId, {
  slogan = null,
  showPhone = 0,
  showWechat = 0,
  wechat = null,
  needApproval = 0,
  allowSearch = 1,
}) {
  await pool.execute(
    `INSERT INTO alumni_cards
      (user_id, slogan, show_phone, show_wechat, wechat, need_approval, allow_search)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      slogan = VALUES(slogan),
      show_phone = VALUES(show_phone),
      show_wechat = VALUES(show_wechat),
      wechat = VALUES(wechat),
      need_approval = VALUES(need_approval),
      allow_search = VALUES(allow_search)`,
    [userId, slogan, showPhone, showWechat, wechat, needApproval, allowSearch]
  );

  return findById(userId);
}

module.exports = {
  findById,
  findByOpenId,
  findByPhone,
  findByOpenIdExcludingId,
  findByPhoneExcludingId,
  listUsers,
  createUser,
  updateUser,
  updateStatus,
  upsertStudentRecord,
  upsertCard,
};
