CREATE TABLE IF NOT EXISTS `sys_blog_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'blog comment id',
  `blog_id` BIGINT UNSIGNED NOT NULL COMMENT 'blog id',
  `author_name` VARCHAR(100) NOT NULL COMMENT 'comment author',
  `author_email` VARCHAR(120) DEFAULT NULL COMMENT 'comment author email',
  `content` VARCHAR(1000) NOT NULL COMMENT 'comment content',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0 pending 1 featured 2 hidden',
  `like_count` INT NOT NULL DEFAULT 0 COMMENT 'like count',
  `reply_content` VARCHAR(1000) DEFAULT NULL COMMENT 'admin reply content',
  `replied_at` DATETIME DEFAULT NULL COMMENT 'reply time',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
  PRIMARY KEY (`id`),
  KEY `idx_sys_blog_comments_blog_id` (`blog_id`),
  KEY `idx_sys_blog_comments_status_created` (`status`, `created_at`),
  CONSTRAINT `fk_sys_blog_comments_blog_id`
    FOREIGN KEY (`blog_id`) REFERENCES `sys_blogs` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='blog comments';
