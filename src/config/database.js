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
];

const blogCategoryTableSql = `
CREATE TABLE IF NOT EXISTS \`sys_blog_categories\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '博客分类主键',
  \`name\` VARCHAR(100) NOT NULL COMMENT '分类名称',
  \`slug\` VARCHAR(120) DEFAULT NULL COMMENT '分类标识',
  \`description\` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
  \`sort_order\` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1启用 0停用',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_sys_blog_categories_name\` (\`name\`),
  UNIQUE KEY \`uk_sys_blog_categories_slug\` (\`slug\`),
  KEY \`idx_sys_blog_categories_status_sort\` (\`status\`, \`sort_order\`)
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
  const connection = await pool.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
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
}

async function ensureBlogTable() {
  await pool.execute(blogCategoryTableSql);
  await pool.execute(blogTableSql);
  await pool.execute(blogCommentTableSql);

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
