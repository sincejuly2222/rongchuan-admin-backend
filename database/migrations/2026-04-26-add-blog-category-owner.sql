ALTER TABLE `sys_blog_categories`
  ADD COLUMN IF NOT EXISTS `owner_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'user id' AFTER `id`;

UPDATE `sys_blog_categories` c
JOIN (
  SELECT `category_id`, MIN(`author_id`) AS `owner_id`, COUNT(DISTINCT `author_id`) AS `author_count`
  FROM `sys_blogs`
  WHERE `category_id` IS NOT NULL
  GROUP BY `category_id`
) usage_info ON usage_info.`category_id` = c.`id`
LEFT JOIN `sys_blog_categories` existing
  ON existing.`owner_id` = usage_info.`owner_id`
 AND existing.`name` = c.`name`
 AND existing.`id` <> c.`id`
SET c.`owner_id` = usage_info.`owner_id`
WHERE c.`owner_id` IS NULL
  AND usage_info.`author_count` = 1
  AND existing.`id` IS NULL;

SET @has_legacy_name_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blog_categories'
    AND INDEX_NAME = 'uk_sys_blog_categories_name'
);

SET @drop_legacy_name_sql := IF(
  @has_legacy_name_idx = 1,
  'ALTER TABLE `sys_blog_categories` DROP INDEX `uk_sys_blog_categories_name`',
  'SELECT 1'
);

PREPARE drop_legacy_name_stmt FROM @drop_legacy_name_sql;
EXECUTE drop_legacy_name_stmt;
DEALLOCATE PREPARE drop_legacy_name_stmt;

SET @has_legacy_slug_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blog_categories'
    AND INDEX_NAME = 'uk_sys_blog_categories_slug'
);

SET @drop_legacy_slug_sql := IF(
  @has_legacy_slug_idx = 1,
  'ALTER TABLE `sys_blog_categories` DROP INDEX `uk_sys_blog_categories_slug`',
  'SELECT 1'
);

PREPARE drop_legacy_slug_stmt FROM @drop_legacy_slug_sql;
EXECUTE drop_legacy_slug_stmt;
DEALLOCATE PREPARE drop_legacy_slug_stmt;

SET @has_owner_name_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blog_categories'
    AND INDEX_NAME = 'uk_sys_blog_categories_owner_name'
);

SET @add_owner_name_idx_sql := IF(
  @has_owner_name_idx = 0,
  'ALTER TABLE `sys_blog_categories` ADD UNIQUE KEY `uk_sys_blog_categories_owner_name` (`owner_id`, `name`)',
  'SELECT 1'
);

PREPARE add_owner_name_idx_stmt FROM @add_owner_name_idx_sql;
EXECUTE add_owner_name_idx_stmt;
DEALLOCATE PREPARE add_owner_name_idx_stmt;

SET @has_owner_slug_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blog_categories'
    AND INDEX_NAME = 'uk_sys_blog_categories_owner_slug'
);

SET @add_owner_slug_idx_sql := IF(
  @has_owner_slug_idx = 0,
  'ALTER TABLE `sys_blog_categories` ADD UNIQUE KEY `uk_sys_blog_categories_owner_slug` (`owner_id`, `slug`)',
  'SELECT 1'
);

PREPARE add_owner_slug_idx_stmt FROM @add_owner_slug_idx_sql;
EXECUTE add_owner_slug_idx_stmt;
DEALLOCATE PREPARE add_owner_slug_idx_stmt;

SET @has_owner_status_sort_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blog_categories'
    AND INDEX_NAME = 'idx_sys_blog_categories_owner_status_sort'
);

SET @add_owner_status_sort_idx_sql := IF(
  @has_owner_status_sort_idx = 0,
  'ALTER TABLE `sys_blog_categories` ADD KEY `idx_sys_blog_categories_owner_status_sort` (`owner_id`, `status`, `sort_order`)',
  'SELECT 1'
);

PREPARE add_owner_status_sort_idx_stmt FROM @add_owner_status_sort_idx_sql;
EXECUTE add_owner_status_sort_idx_stmt;
DEALLOCATE PREPARE add_owner_status_sort_idx_stmt;

SET @has_owner_fk := (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'sys_blog_categories'
    AND CONSTRAINT_NAME = 'fk_sys_blog_categories_owner_id'
);

SET @add_owner_fk_sql := IF(
  @has_owner_fk = 0,
  'ALTER TABLE `sys_blog_categories` ADD CONSTRAINT `fk_sys_blog_categories_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `sys_users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE',
  'SELECT 1'
);

PREPARE add_owner_fk_stmt FROM @add_owner_fk_sql;
EXECUTE add_owner_fk_stmt;
DEALLOCATE PREPARE add_owner_fk_stmt;
