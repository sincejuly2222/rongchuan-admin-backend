const { pool } = require('../config/database');

function mapBlogRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    cover_image: row.cover_image,
    content: row.content,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    category_description: row.category_description,
    category_article_count: row.category_article_count,
    tag_list: row.tag_list
      ? String(row.tag_list)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    status: row.status,
    view_count: row.view_count,
    like_count: row.like_count,
    author_id: row.author_id,
    author_name: row.author_name,
    author_avatar: row.author_avatar,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const BLOG_SELECT = `
  SELECT
    b.id,
    b.title,
    b.summary,
    b.cover_image,
    b.content,
    b.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    c.description AS category_description,
    (
      SELECT COUNT(*)
      FROM sys_blogs published_blog
      WHERE published_blog.category_id = b.category_id
        AND published_blog.status = 1
    ) AS category_article_count,
    b.tag_list,
    b.status,
    b.view_count,
    b.like_count,
    b.author_id,
    u.name AS author_name,
    u.avatar AS author_avatar,
    b.published_at,
    b.created_at,
    b.updated_at
  FROM sys_blogs b
  LEFT JOIN sys_users u ON u.id = b.author_id
  LEFT JOIN sys_blog_categories c ON c.id = b.category_id
`;

async function findById(id) {
  const [rows] = await pool.execute(
    `${BLOG_SELECT}
     WHERE b.id = ?
     LIMIT 1`,
    [id]
  );

  return mapBlogRow(rows[0]);
}

async function findCategoryById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      slug,
      description,
      sort_order,
      status,
      created_at,
      updated_at
     FROM sys_blog_categories
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function findCategoryByName(name, excludeId = null) {
  const params = [name];
  let sql = `
    SELECT id, name, slug
    FROM sys_blog_categories
    WHERE name = ?
  `;

  if (excludeId) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }

  sql += ' LIMIT 1';

  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function findCategoryBySlug(slug, excludeId = null) {
  if (!slug) {
    return null;
  }

  const params = [slug];
  let sql = `
    SELECT id, name, slug
    FROM sys_blog_categories
    WHERE slug = ?
  `;

  if (excludeId) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }

  sql += ' LIMIT 1';

  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function findMaxCategorySortOrder() {
  const [rows] = await pool.execute(
    `SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder
     FROM sys_blog_categories`
  );

  return Number(rows[0]?.maxSortOrder || 0);
}

async function listBlogs({ current, pageSize, keyword, status }) {
  const offset = (current - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push('(b.title LIKE ? OR b.summary LIKE ? OR b.content LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (typeof status === 'number') {
    conditions.push('b.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM sys_blogs b
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `${BLOG_SELECT}
     ${whereClause}
     ORDER BY COALESCE(b.published_at, b.created_at) DESC, b.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    list: rows.map(mapBlogRow),
    total: countRows[0].total,
    current,
    pageSize,
  };
}

async function listHomeBlogs(limit = 6) {
  const [rows] = await pool.query(
    `${BLOG_SELECT}
     WHERE b.status = 1
     ORDER BY COALESCE(b.published_at, b.created_at) DESC, b.id DESC
     LIMIT ?`,
    [limit]
  );

  return rows.map(mapBlogRow);
}

async function listBlogCategories(limit = 8) {
  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.sort_order AS sortOrder,
      COUNT(b.id) AS articleCount
     FROM sys_blog_categories c
     LEFT JOIN sys_blogs b
       ON b.category_id = c.id
      AND b.status = 1
     WHERE c.status = 1
     GROUP BY c.id, c.name, c.slug, c.description, c.sort_order
     ORDER BY c.sort_order ASC, c.id ASC
     LIMIT ?`,
    [limit]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    articleCount: row.articleCount,
  }));
}

async function listManageBlogCategories({ keyword = '' } = {}) {
  const params = [];
  let whereClause = '';

  if (keyword) {
    whereClause = 'WHERE c.name LIKE ? OR c.slug LIKE ? OR c.description LIKE ?';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const [rows] = await pool.query(
    `SELECT
      c.id,
      c.name,
      c.slug,
      c.description,
      c.sort_order AS sortOrder,
      c.status,
      c.created_at AS createdAt,
      c.updated_at AS updatedAt,
      COUNT(b.id) AS articleCount,
      SUM(CASE WHEN b.status = 1 THEN 1 ELSE 0 END) AS publishedArticleCount,
      SUM(CASE WHEN b.status = 0 THEN 1 ELSE 0 END) AS draftArticleCount
     FROM sys_blog_categories c
     LEFT JOIN sys_blogs b ON b.category_id = c.id
     ${whereClause}
     GROUP BY c.id, c.name, c.slug, c.description, c.sort_order, c.status, c.created_at, c.updated_at
     ORDER BY c.sort_order ASC, c.id ASC`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    articleCount: Number(row.articleCount || 0),
    publishedArticleCount: Number(row.publishedArticleCount || 0),
    draftArticleCount: Number(row.draftArticleCount || 0),
  }));
}

async function createBlogCategory({ name, slug = null, description = null, sortOrder = 0, status = 1 }) {
  const [result] = await pool.execute(
    `INSERT INTO sys_blog_categories (name, slug, description, sort_order, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name, slug, description, sortOrder, status]
  );

  return findCategoryById(result.insertId);
}

async function updateBlogCategory(id, { name, slug = null, description = null, sortOrder = 0 }) {
  await pool.execute(
    `UPDATE sys_blog_categories
     SET name = ?,
         slug = ?,
         description = ?,
         sort_order = ?
     WHERE id = ?`,
    [name, slug, description, sortOrder, id]
  );

  return findCategoryById(id);
}

async function deleteBlogCategory(id) {
  await pool.execute(
    `DELETE FROM sys_blog_categories
     WHERE id = ?`,
    [id]
  );
}

async function countBlogsByCategory(id) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM sys_blogs
     WHERE category_id = ?`,
    [id]
  );

  return Number(rows[0]?.total || 0);
}

async function sortBlogCategories(orderedIds) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (let index = 0; index < orderedIds.length; index += 1) {
      await connection.execute(
        `UPDATE sys_blog_categories
         SET sort_order = ?
         WHERE id = ?`,
        [index + 1, orderedIds[index]]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createBlog({
  title,
  summary,
  content,
  coverImage = null,
  categoryId = null,
  tagList = null,
  status = 1,
  authorId,
}) {
  const [result] = await pool.execute(
    `INSERT INTO sys_blogs
      (title, summary, content, cover_image, category_id, tag_list, status, author_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)`,
    [title, summary, content, coverImage, categoryId, tagList, status, authorId, status]
  );

  return findById(result.insertId);
}

async function updateBlog(
  id,
  {
    title,
    summary,
    content,
    coverImage = null,
    categoryId = null,
    tagList = null,
    status = 1,
  }
) {
  await pool.execute(
    `UPDATE sys_blogs
     SET title = ?,
         summary = ?,
         content = ?,
         cover_image = ?,
         category_id = ?,
         tag_list = ?,
         status = ?,
         published_at = CASE
           WHEN ? = 1 AND published_at IS NULL THEN CURRENT_TIMESTAMP
           WHEN ? = 0 THEN NULL
           ELSE published_at
         END
     WHERE id = ?`,
    [title, summary, content, coverImage, categoryId, tagList, status, status, status, id]
  );

  return findById(id);
}

async function updateStatus(id, status) {
  await pool.execute(
    `UPDATE sys_blogs
     SET status = ?,
         published_at = CASE
           WHEN ? = 1 AND published_at IS NULL THEN CURRENT_TIMESTAMP
           WHEN ? = 0 THEN NULL
           ELSE published_at
         END
     WHERE id = ?`,
    [status, status, status, id]
  );

  return findById(id);
}

async function deleteBlog(id) {
  await pool.execute(
    `DELETE FROM sys_blogs
     WHERE id = ?`,
    [id]
  );
}

async function incrementViewCount(id) {
  await pool.execute(
    `UPDATE sys_blogs
     SET view_count = view_count + 1
     WHERE id = ?`,
    [id]
  );
}

module.exports = {
  countBlogsByCategory,
  createBlog,
  createBlogCategory,
  deleteBlog,
  deleteBlogCategory,
  findById,
  findCategoryById,
  findCategoryByName,
  findCategoryBySlug,
  findMaxCategorySortOrder,
  incrementViewCount,
  listBlogCategories,
  listBlogs,
  listHomeBlogs,
  listManageBlogCategories,
  sortBlogCategories,
  updateBlog,
  updateBlogCategory,
  updateStatus,
};
