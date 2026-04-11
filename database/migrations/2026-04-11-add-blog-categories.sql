CREATE TABLE IF NOT EXISTS `sys_blog_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'blog category id',
  `name` VARCHAR(100) NOT NULL COMMENT 'category name',
  `slug` VARCHAR(120) DEFAULT NULL COMMENT 'category slug',
  `description` VARCHAR(500) DEFAULT NULL COMMENT 'category description',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT 'sort order',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT 'status 1 enabled 0 disabled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_blog_categories_name` (`name`),
  UNIQUE KEY `uk_sys_blog_categories_slug` (`slug`),
  KEY `idx_sys_blog_categories_status_sort` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='blog categories';

ALTER TABLE `sys_blogs`
  ADD COLUMN IF NOT EXISTS `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'blog category id' AFTER `content`;

SET @has_idx_sys_blogs_category_id := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blogs'
    AND INDEX_NAME = 'idx_sys_blogs_category_id'
);

SET @add_idx_sql := IF(
  @has_idx_sys_blogs_category_id = 0,
  'ALTER TABLE `sys_blogs` ADD KEY `idx_sys_blogs_category_id` (`category_id`)',
  'SELECT 1'
);

PREPARE add_idx_stmt FROM @add_idx_sql;
EXECUTE add_idx_stmt;
DEALLOCATE PREPARE add_idx_stmt;

SET @has_fk_sys_blogs_category_id := (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blogs'
    AND CONSTRAINT_NAME = 'fk_sys_blogs_category_id'
);

SET @add_fk_sql := IF(
  @has_fk_sys_blogs_category_id = 0,
  'ALTER TABLE `sys_blogs` ADD CONSTRAINT `fk_sys_blogs_category_id` FOREIGN KEY (`category_id`) REFERENCES `sys_blog_categories` (`id`) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE add_fk_stmt FROM @add_fk_sql;
EXECUTE add_fk_stmt;
DEALLOCATE PREPARE add_fk_stmt;

INSERT INTO `sys_blog_categories` (`name`, `slug`, `description`, `sort_order`, `status`)
VALUES
  ('React Development', 'react-dev', 'React ecosystem articles and engineering practice', 10, 1),
  ('Frontend Engineering', 'frontend-engineering', 'Architecture, performance, and tooling topics', 20, 1),
  ('Product Design', 'product-design', 'Interaction, UX, and design thinking', 30, 1),
  ('Growth Notes', 'growth-notes', 'Learning notes and personal reflections', 40, 1)
ON DUPLICATE KEY UPDATE
  `slug` = VALUES(`slug`),
  `description` = VALUES(`description`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`);
