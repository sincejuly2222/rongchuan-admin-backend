// Database configuration: creates the MySQL connection pool and provides startup schema checks.
const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const profileColumns = [
  { name: 'title', sql: "ALTER TABLE `sys_users` ADD COLUMN `title` VARCHAR(100) DEFAULT NULL COMMENT '个人头衔' AFTER `avatar`" },
  { name: 'bio', sql: "ALTER TABLE `sys_users` ADD COLUMN `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介' AFTER `title`" },
  { name: 'gender', sql: "ALTER TABLE `sys_users` ADD COLUMN `gender` VARCHAR(20) DEFAULT NULL COMMENT '性别' AFTER `bio`" },
  { name: 'location', sql: "ALTER TABLE `sys_users` ADD COLUMN `location` VARCHAR(100) DEFAULT NULL COMMENT '所在地' AFTER `gender`" },
  { name: 'website', sql: "ALTER TABLE `sys_users` ADD COLUMN `website` VARCHAR(255) DEFAULT NULL COMMENT '个人主页' AFTER `location`" },
  { name: 'birthday', sql: "ALTER TABLE `sys_users` ADD COLUMN `birthday` DATE DEFAULT NULL COMMENT '出生日期' AFTER `website`" },
  { name: 'start_work_date', sql: "ALTER TABLE `sys_users` ADD COLUMN `start_work_date` VARCHAR(7) DEFAULT NULL COMMENT '参加工作年月' AFTER `birthday`" },
  { name: 'company', sql: "ALTER TABLE `sys_users` ADD COLUMN `company` VARCHAR(150) DEFAULT NULL COMMENT '公司名称' AFTER `start_work_date`" },
  { name: 'department', sql: "ALTER TABLE `sys_users` ADD COLUMN `department` VARCHAR(100) DEFAULT NULL COMMENT '所属部门' AFTER `company`" },
  { name: 'position', sql: "ALTER TABLE `sys_users` ADD COLUMN `position` VARCHAR(100) DEFAULT NULL COMMENT '岗位' AFTER `department`" },
  { name: 'hobby', sql: "ALTER TABLE `sys_users` ADD COLUMN `hobby` VARCHAR(500) DEFAULT NULL COMMENT '鍏磋叮鏍囩鍘熷鏂囨湰' AFTER `position`" },
  { name: 'interest_likes', sql: "ALTER TABLE `sys_users` ADD COLUMN `interest_likes` JSON DEFAULT NULL COMMENT '鍠滄鐨勫叴瓒ｆ爣绛?' AFTER `hobby`" },
  { name: 'interest_dislikes', sql: "ALTER TABLE `sys_users` ADD COLUMN `interest_dislikes` JSON DEFAULT NULL COMMENT '涓嶅枩娆㈢殑鍏磋叮鏍囩' AFTER `interest_likes`" },
  { name: 'interest_selection', sql: "ALTER TABLE `sys_users` ADD COLUMN `interest_selection` JSON DEFAULT NULL COMMENT '鍏磋叮鏍囩閫夋嫨缁撴灉' AFTER `interest_dislikes`" },
];

const profileCommentSqls = [
  "ALTER TABLE `sys_users` MODIFY COLUMN `hobby` VARCHAR(500) DEFAULT NULL COMMENT 'interest tags raw text'",
  "ALTER TABLE `sys_users` MODIFY COLUMN `interest_likes` JSON DEFAULT NULL COMMENT 'liked interest tags'",
  "ALTER TABLE `sys_users` MODIFY COLUMN `interest_dislikes` JSON DEFAULT NULL COMMENT 'disliked interest tags'",
  "ALTER TABLE `sys_users` MODIFY COLUMN `interest_selection` JSON DEFAULT NULL COMMENT 'interest selection payload'",
];

const blogCategoryTableSql = `
CREATE TABLE IF NOT EXISTS \`sys_blog_categories\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '博客分类主键',
  \`owner_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT 'user id',
  \`name\` VARCHAR(100) NOT NULL COMMENT '分类名称',
  \`slug\` VARCHAR(120) DEFAULT NULL COMMENT '分类标识',
  \`description\` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
  \`sort_order\` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1启用 0停用',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_sys_blog_categories_owner_name\` (\`owner_id\`, \`name\`),
  UNIQUE KEY \`uk_sys_blog_categories_owner_slug\` (\`owner_id\`, \`slug\`),
  KEY \`idx_sys_blog_categories_owner_status_sort\` (\`owner_id\`, \`status\`, \`sort_order\`),
  CONSTRAINT \`fk_sys_blog_categories_owner_id\`
    FOREIGN KEY (\`owner_id\`) REFERENCES \`sys_users\` (\`id\`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客分类表';
`;

const blogTableSql = `
CREATE TABLE IF NOT EXISTS \`sys_blogs\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '博客主键',
  \`title\` VARCHAR(200) NOT NULL COMMENT '博客标题',
  \`summary\` VARCHAR(500) DEFAULT NULL COMMENT '博客摘要',
  \`cover_image\` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  \`content\` LONGTEXT NOT NULL COMMENT '博客正文',
  \`category_id\` BIGINT UNSIGNED DEFAULT NULL COMMENT '博客分类ID',
  \`tag_list\` VARCHAR(255) DEFAULT NULL COMMENT '标签列表，逗号分隔',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1已发布 0草稿',
  \`view_count\` INT NOT NULL DEFAULT 0 COMMENT '浏览量',
  \`like_count\` INT NOT NULL DEFAULT 0 COMMENT '点赞量',
  \`author_id\` BIGINT UNSIGNED NOT NULL COMMENT '作者ID',
  \`published_at\` DATETIME DEFAULT NULL COMMENT '发布时间',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_sys_blogs_status_published_at\` (\`status\`, \`published_at\`),
  KEY \`idx_sys_blogs_author_id\` (\`author_id\`),
  KEY \`idx_sys_blogs_category_id\` (\`category_id\`),
  CONSTRAINT \`fk_sys_blogs_author_id\`
    FOREIGN KEY (\`author_id\`) REFERENCES \`sys_users\` (\`id\`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT \`fk_sys_blogs_category_id\`
    FOREIGN KEY (\`category_id\`) REFERENCES \`sys_blog_categories\` (\`id\`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客内容表';
`;

const blogCommentTableSql = `
CREATE TABLE IF NOT EXISTS \`sys_blog_comments\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '博客评论主键',
  \`blog_id\` BIGINT UNSIGNED NOT NULL COMMENT '博客ID',
  \`author_name\` VARCHAR(100) NOT NULL COMMENT '评论作者',
  \`author_email\` VARCHAR(120) DEFAULT NULL COMMENT '评论作者邮箱',
  \`content\` VARCHAR(1000) NOT NULL COMMENT '评论内容',
  \`status\` TINYINT NOT NULL DEFAULT 0 COMMENT '评论状态 0待处理 1精选 2已隐藏',
  \`like_count\` INT NOT NULL DEFAULT 0 COMMENT '点赞数',
  \`reply_content\` VARCHAR(1000) DEFAULT NULL COMMENT '管理员回复内容',
  \`replied_at\` DATETIME DEFAULT NULL COMMENT '回复时间',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_sys_blog_comments_blog_id\` (\`blog_id\`),
  KEY \`idx_sys_blog_comments_status_created\` (\`status\`, \`created_at\`),
  CONSTRAINT \`fk_sys_blog_comments_blog_id\`
    FOREIGN KEY (\`blog_id\`) REFERENCES \`sys_blogs\` (\`id\`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客评论表';
`;

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
  } catch (error) {
    const wrappedError = new Error('数据库连接检测失败', { cause: error });
    wrappedError.context = {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      database: env.db.database,
      connectTimeout: 10000,
    };
    throw wrappedError;
  } finally {
    connection?.release();
  }
}

async function ensureProfileColumns() {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sys_users'`,
    [env.db.database]
  );

  const existingColumns = new Set(rows.map((row) => row.COLUMN_NAME));

  for (const column of profileColumns) {
    if (!existingColumns.has(column.name)) {
      await pool.execute(column.sql);
    }
  }

  for (const sql of profileCommentSqls) {
    await pool.execute(sql);
  }
}

async function ensureBlogTable() {
  await pool.execute(blogCategoryTableSql);
  await pool.execute(blogTableSql);
  await pool.execute(blogCommentTableSql);

  const [categoryColumns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sys_blog_categories'`,
    [env.db.database]
  );
  const existingCategoryColumns = new Set(categoryColumns.map((row) => row.COLUMN_NAME));

  if (!existingCategoryColumns.has('owner_id')) {
    await pool.execute(
      "ALTER TABLE `sys_blog_categories` ADD COLUMN `owner_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'user id' AFTER `id`"
    );
  }

  await pool.execute(
    `UPDATE sys_blog_categories c
     JOIN (
       SELECT category_id, MIN(author_id) AS owner_id, COUNT(DISTINCT author_id) AS author_count
       FROM sys_blogs
       WHERE category_id IS NOT NULL
       GROUP BY category_id
     ) usage_info ON usage_info.category_id = c.id
     LEFT JOIN sys_blog_categories existing
       ON existing.owner_id = usage_info.owner_id
      AND existing.name = c.name
      AND existing.id <> c.id
     SET c.owner_id = usage_info.owner_id
     WHERE c.owner_id IS NULL
       AND usage_info.author_count = 1
       AND existing.id IS NULL`
  );

  const [categoryIndexes] = await pool.query(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sys_blog_categories'`,
    [env.db.database]
  );
  const existingCategoryIndexes = new Set(categoryIndexes.map((row) => row.INDEX_NAME));

  for (const legacyIndex of ['uk_sys_blog_categories_name', 'uk_sys_blog_categories_slug']) {
    if (existingCategoryIndexes.has(legacyIndex)) {
      await pool.execute(`ALTER TABLE \`sys_blog_categories\` DROP INDEX \`${legacyIndex}\``);
      existingCategoryIndexes.delete(legacyIndex);
    }
  }

  if (!existingCategoryIndexes.has('uk_sys_blog_categories_owner_name')) {
    await pool.execute(
      'ALTER TABLE `sys_blog_categories` ADD UNIQUE KEY `uk_sys_blog_categories_owner_name` (`owner_id`, `name`)'
    );
  }

  if (!existingCategoryIndexes.has('uk_sys_blog_categories_owner_slug')) {
    await pool.execute(
      'ALTER TABLE `sys_blog_categories` ADD UNIQUE KEY `uk_sys_blog_categories_owner_slug` (`owner_id`, `slug`)'
    );
  }

  if (!existingCategoryIndexes.has('idx_sys_blog_categories_owner_status_sort')) {
    await pool.execute(
      'ALTER TABLE `sys_blog_categories` ADD KEY `idx_sys_blog_categories_owner_status_sort` (`owner_id`, `status`, `sort_order`)'
    );
  }

  const [categoryConstraints] = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'sys_blog_categories'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [env.db.database]
  );
  const existingCategoryConstraints = new Set(categoryConstraints.map((row) => row.CONSTRAINT_NAME));

  if (!existingCategoryConstraints.has('fk_sys_blog_categories_owner_id')) {
    await pool.execute(
      `ALTER TABLE \`sys_blog_categories\`
       ADD CONSTRAINT \`fk_sys_blog_categories_owner_id\`
       FOREIGN KEY (\`owner_id\`) REFERENCES \`sys_users\` (\`id\`)
       ON UPDATE CASCADE
       ON DELETE CASCADE`
    );
  }

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sys_blogs'`,
    [env.db.database]
  );
  const existingColumns = new Set(columns.map((row) => row.COLUMN_NAME));

  if (!existingColumns.has('category_id')) {
    await pool.execute(
      "ALTER TABLE `sys_blogs` ADD COLUMN `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '博客分类ID' AFTER `content`"
    );
  }

  const [indexes] = await pool.query(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sys_blogs'`,
    [env.db.database]
  );
  const existingIndexes = new Set(indexes.map((row) => row.INDEX_NAME));

  if (!existingIndexes.has('idx_sys_blogs_category_id')) {
    await pool.execute('ALTER TABLE `sys_blogs` ADD KEY `idx_sys_blogs_category_id` (`category_id`)');
  }

  const [constraints] = await pool.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'sys_blogs'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [env.db.database]
  );
  const existingConstraints = new Set(constraints.map((row) => row.CONSTRAINT_NAME));

  if (!existingConstraints.has('fk_sys_blogs_category_id')) {
    await pool.execute(
      `ALTER TABLE \`sys_blogs\`
       ADD CONSTRAINT \`fk_sys_blogs_category_id\`
       FOREIGN KEY (\`category_id\`) REFERENCES \`sys_blog_categories\` (\`id\`)
       ON UPDATE CASCADE
       ON DELETE SET NULL`
    );
  }
}

module.exports = {
  ensureBlogTable,
  ensureProfileColumns,
  pool,
  testConnection,
};
