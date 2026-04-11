const { pool } = require('../config/database');

function mapCommentRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    blog_id: row.blog_id,
    blog_title: row.blog_title,
    author_name: row.author_name,
    author_email: row.author_email,
    content: row.content,
    status: row.status,
    like_count: row.like_count,
    reply_content: row.reply_content,
    replied_at: row.replied_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      c.id,
      c.blog_id,
      b.title AS blog_title,
      c.author_name,
      c.author_email,
      c.content,
      c.status,
      c.like_count,
      c.reply_content,
      c.replied_at,
      c.created_at,
      c.updated_at
     FROM sys_blog_comments c
     INNER JOIN sys_blogs b ON b.id = c.blog_id
     WHERE c.id = ?
     LIMIT 1`,
    [id]
  );

  return mapCommentRow(rows[0]);
}

async function listComments({ current, pageSize, keyword = '', status, blogId }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(c.author_name LIKE ? OR c.content LIKE ? OR b.title LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (typeof status === 'number') {
    conditions.push('c.status = ?');
    params.push(status);
  }

  if (typeof blogId === 'number') {
    conditions.push('c.blog_id = ?');
    params.push(blogId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM sys_blog_comments c
     INNER JOIN sys_blogs b ON b.id = c.blog_id
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.blog_id,
      b.title AS blog_title,
      c.author_name,
      c.author_email,
      c.content,
      c.status,
      c.like_count,
      c.reply_content,
      c.replied_at,
      c.created_at,
      c.updated_at
     FROM sys_blog_comments c
     INNER JOIN sys_blogs b ON b.id = c.blog_id
     ${whereClause}
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const [statsRows] = await pool.query(
    `SELECT
      COUNT(*) AS totalCount,
      SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS pendingCount,
      SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS featuredCount,
      SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS hiddenCount
     FROM sys_blog_comments`
  );

  return {
    list: rows.map(mapCommentRow),
    total: Number(countRows[0]?.total || 0),
    current,
    pageSize,
    stats: {
      totalCount: Number(statsRows[0]?.totalCount || 0),
      pendingCount: Number(statsRows[0]?.pendingCount || 0),
      featuredCount: Number(statsRows[0]?.featuredCount || 0),
      hiddenCount: Number(statsRows[0]?.hiddenCount || 0),
    },
  };
}

async function updateComment(id, { status, replyContent }) {
  const fields = [];
  const params = [];

  if (typeof status === 'number') {
    fields.push('status = ?');
    params.push(status);
  }

  if (replyContent !== undefined) {
    fields.push('reply_content = ?');
    params.push(replyContent);
    fields.push('replied_at = ?');
    params.push(replyContent ? new Date() : null);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  params.push(id);

  await pool.execute(
    `UPDATE sys_blog_comments
     SET ${fields.join(', ')}
     WHERE id = ?`,
    params
  );

  return findById(id);
}

async function deleteComment(id) {
  await pool.execute(
    `DELETE FROM sys_blog_comments
     WHERE id = ?`,
    [id]
  );
}

module.exports = {
  deleteComment,
  findById,
  listComments,
  updateComment,
};
