-- Admin backend schema used by the current Node.js service.
-- Assumption: MySQL 8.x+

CREATE DATABASE IF NOT EXISTS `__DB_NAME__`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `__DB_NAME__`;

CREATE TABLE IF NOT EXISTS `sys_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户主键',
  `username` VARCHAR(50) NOT NULL COMMENT '登录用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `name` VARCHAR(100) NOT NULL COMMENT '用户姓名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像地址',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '个人头衔',
  `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
  `gender` VARCHAR(20) DEFAULT NULL COMMENT '性别',
  `location` VARCHAR(100) DEFAULT NULL COMMENT '所在地区',
  `website` VARCHAR(255) DEFAULT NULL COMMENT '个人主页',
  `birthday` DATE DEFAULT NULL COMMENT '出生日期',
  `start_work_date` VARCHAR(7) DEFAULT NULL COMMENT '开始工作年月',
  `company` VARCHAR(150) DEFAULT NULL COMMENT '公司名称',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '所属部门',
  `position` VARCHAR(100) DEFAULT NULL COMMENT '岗位',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_users_username` (`username`),
  UNIQUE KEY `uk_sys_users_email` (`email`),
  KEY `idx_sys_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台用户表';

ALTER TABLE `sys_users`
  ADD COLUMN IF NOT EXISTS `title` VARCHAR(100) DEFAULT NULL COMMENT '个人头衔' AFTER `avatar`,
  ADD COLUMN IF NOT EXISTS `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介' AFTER `title`,
  ADD COLUMN IF NOT EXISTS `gender` VARCHAR(20) DEFAULT NULL COMMENT '性别' AFTER `bio`,
  ADD COLUMN IF NOT EXISTS `location` VARCHAR(100) DEFAULT NULL COMMENT '所在地区' AFTER `gender`,
  ADD COLUMN IF NOT EXISTS `website` VARCHAR(255) DEFAULT NULL COMMENT '个人主页' AFTER `location`,
  ADD COLUMN IF NOT EXISTS `birthday` DATE DEFAULT NULL COMMENT '出生日期' AFTER `website`,
  ADD COLUMN IF NOT EXISTS `start_work_date` VARCHAR(7) DEFAULT NULL COMMENT '开始工作年月' AFTER `birthday`,
  ADD COLUMN IF NOT EXISTS `company` VARCHAR(150) DEFAULT NULL COMMENT '公司名称' AFTER `start_work_date`,
  ADD COLUMN IF NOT EXISTS `department` VARCHAR(100) DEFAULT NULL COMMENT '所属部门' AFTER `company`,
  ADD COLUMN IF NOT EXISTS `position` VARCHAR(100) DEFAULT NULL COMMENT '岗位' AFTER `department`;

CREATE TABLE IF NOT EXISTS `sys_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色主键',
  `role_name` VARCHAR(100) NOT NULL COMMENT '角色名称',
  `role_code` VARCHAR(100) NOT NULL COMMENT '角色编码',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_roles_role_code` (`role_code`),
  KEY `idx_sys_roles_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台角色表';

CREATE TABLE IF NOT EXISTS `sys_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '权限主键',
  `permission_name` VARCHAR(100) NOT NULL COMMENT '权限名称',
  `permission_code` VARCHAR(150) NOT NULL COMMENT '权限编码',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '权限描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_permissions_permission_code` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台权限表';

CREATE TABLE IF NOT EXISTS `sys_menus` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '菜单主键',
  `parent_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父级菜单ID, 0表示顶级',
  `menu_name` VARCHAR(100) NOT NULL COMMENT '菜单名称',
  `menu_code` VARCHAR(100) NOT NULL COMMENT '菜单编码',
  `path` VARCHAR(255) DEFAULT NULL COMMENT '路由路径',
  `component` VARCHAR(255) DEFAULT NULL COMMENT '前端组件路径',
  `icon` VARCHAR(100) DEFAULT NULL COMMENT '菜单图标',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_menus_menu_code` (`menu_code`),
  KEY `idx_sys_menus_parent_id` (`parent_id`),
  KEY `idx_sys_menus_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台菜单表';

CREATE TABLE IF NOT EXISTS `sys_user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户角色关联主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_user_roles_user_role` (`user_id`, `role_id`),
  KEY `idx_sys_user_roles_role_id` (`role_id`),
  CONSTRAINT `fk_sys_user_roles_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `sys_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_sys_user_roles_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `sys_roles` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

CREATE TABLE IF NOT EXISTS `sys_role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色权限关联主键',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  `permission_id` BIGINT UNSIGNED NOT NULL COMMENT '权限ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_role_permissions_role_permission` (`role_id`, `permission_id`),
  KEY `idx_sys_role_permissions_permission_id` (`permission_id`),
  CONSTRAINT `fk_sys_role_permissions_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `sys_roles` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_sys_role_permissions_permission_id`
    FOREIGN KEY (`permission_id`) REFERENCES `sys_permissions` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

CREATE TABLE IF NOT EXISTS `sys_role_menus` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色菜单关联主键',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  `menu_id` BIGINT UNSIGNED NOT NULL COMMENT '菜单ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_role_menus_role_menu` (`role_id`, `menu_id`),
  KEY `idx_sys_role_menus_menu_id` (`menu_id`),
  CONSTRAINT `fk_sys_role_menus_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `sys_roles` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_sys_role_menus_menu_id`
    FOREIGN KEY (`menu_id`) REFERENCES `sys_menus` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色菜单关联表';

CREATE TABLE IF NOT EXISTS `auth_refresh_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '刷新会话主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `session_id` CHAR(36) NOT NULL COMMENT '会话唯一标识',
  `refresh_token_hash` CHAR(64) NOT NULL COMMENT '刷新令牌哈希',
  `user_agent` VARCHAR(512) DEFAULT NULL COMMENT '客户端UA',
  `ip_address` VARCHAR(64) DEFAULT NULL COMMENT '客户端IP',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `revoked_at` DATETIME DEFAULT NULL COMMENT '撤销时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_auth_refresh_sessions_session_id` (`session_id`),
  KEY `idx_auth_refresh_sessions_user_id` (`user_id`),
  KEY `idx_auth_refresh_sessions_expires_at` (`expires_at`),
  KEY `idx_auth_refresh_sessions_revoked_at` (`revoked_at`),
  CONSTRAINT `fk_auth_refresh_sessions_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `sys_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌会话表';

CREATE TABLE IF NOT EXISTS `sys_blog_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '博客分类主键',
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `slug` VARCHAR(120) DEFAULT NULL COMMENT '分类标识',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1启用 0停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_blog_categories_name` (`name`),
  UNIQUE KEY `uk_sys_blog_categories_slug` (`slug`),
  KEY `idx_sys_blog_categories_status_sort` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客分类表';

CREATE TABLE IF NOT EXISTS `sys_blogs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '博客主键',
  `title` VARCHAR(200) NOT NULL COMMENT '博客标题',
  `summary` VARCHAR(500) DEFAULT NULL COMMENT '博客摘要',
  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `content` LONGTEXT NOT NULL COMMENT '博客正文',
  `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '博客分类ID',
  `tag_list` VARCHAR(255) DEFAULT NULL COMMENT '标签列表，逗号分隔',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1已发布 0草稿',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '浏览量',
  `like_count` INT NOT NULL DEFAULT 0 COMMENT '点赞量',
  `author_id` BIGINT UNSIGNED NOT NULL COMMENT '作者ID',
  `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_sys_blogs_status_published_at` (`status`, `published_at`),
  KEY `idx_sys_blogs_author_id` (`author_id`),
  KEY `idx_sys_blogs_category_id` (`category_id`),
  CONSTRAINT `fk_sys_blogs_author_id`
    FOREIGN KEY (`author_id`) REFERENCES `sys_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_sys_blogs_category_id`
    FOREIGN KEY (`category_id`) REFERENCES `sys_blog_categories` (`id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客内容表';

CREATE TABLE IF NOT EXISTS `alumni_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '校友用户主键',
  `open_id` VARCHAR(100) DEFAULT NULL COMMENT '微信OpenID',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `name` VARCHAR(100) NOT NULL COMMENT '姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像地址',
  `gender` TINYINT DEFAULT NULL COMMENT '性别: 1男 2女 0未知',
  `company` VARCHAR(150) DEFAULT NULL COMMENT '公司名称',
  `position` VARCHAR(100) DEFAULT NULL COMMENT '职位',
  `city` VARCHAR(100) DEFAULT NULL COMMENT '所在城市',
  `bio` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1正常 0禁用',
  `verified_status` TINYINT NOT NULL DEFAULT 0 COMMENT '认证状态: 0未认证 1认证中 2已认证 3认证失败',
  `allow_search` TINYINT NOT NULL DEFAULT 1 COMMENT '是否允许被搜索',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alumni_users_open_id` (`open_id`),
  UNIQUE KEY `uk_alumni_users_phone` (`phone`),
  KEY `idx_alumni_users_name` (`name`),
  KEY `idx_alumni_users_status` (`status`),
  KEY `idx_alumni_users_verified_status` (`verified_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校友用户表';

CREATE TABLE IF NOT EXISTS `alumni_student_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '学籍记录主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '校友用户ID',
  `school` VARCHAR(150) NOT NULL COMMENT '学校名称',
  `college` VARCHAR(150) DEFAULT NULL COMMENT '学院',
  `major` VARCHAR(150) NOT NULL COMMENT '专业',
  `class_name` VARCHAR(100) DEFAULT NULL COMMENT '班级',
  `student_no` VARCHAR(50) DEFAULT NULL COMMENT '学号',
  `enrollment_year` INT NOT NULL COMMENT '入学年份',
  `graduation_year` INT DEFAULT NULL COMMENT '毕业年份',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待认领 1已认领 2已审核',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alumni_student_records_user_id` (`user_id`),
  KEY `idx_alumni_student_records_school_major` (`school`, `major`),
  KEY `idx_alumni_student_records_enrollment_year` (`enrollment_year`),
  CONSTRAINT `fk_alumni_student_records_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `alumni_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校友学籍表';

CREATE TABLE IF NOT EXISTS `alumni_cards` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '名片主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '校友用户ID',
  `slogan` VARCHAR(255) DEFAULT NULL COMMENT '名片标语',
  `show_phone` TINYINT NOT NULL DEFAULT 0 COMMENT '是否展示手机号',
  `show_wechat` TINYINT NOT NULL DEFAULT 0 COMMENT '是否展示微信号',
  `wechat` VARCHAR(100) DEFAULT NULL COMMENT '微信号',
  `need_approval` TINYINT NOT NULL DEFAULT 0 COMMENT '交换是否需要审核',
  `allow_search` TINYINT NOT NULL DEFAULT 1 COMMENT '是否允许被搜索',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alumni_cards_user_id` (`user_id`),
  CONSTRAINT `fk_alumni_cards_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `alumni_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校友名片表';

CREATE TABLE IF NOT EXISTS `alumni_card_exchanges` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '名片交换主键',
  `from_user_id` BIGINT UNSIGNED NOT NULL COMMENT '发起人用户ID',
  `to_user_id` BIGINT UNSIGNED NOT NULL COMMENT '接收人用户ID',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待处理 1已通过 2已拒绝',
  `message` VARCHAR(255) DEFAULT NULL COMMENT '交换留言',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alumni_card_exchanges_pair` (`from_user_id`, `to_user_id`),
  KEY `idx_alumni_card_exchanges_to_user_id` (`to_user_id`),
  KEY `idx_alumni_card_exchanges_status` (`status`),
  CONSTRAINT `fk_alumni_card_exchanges_from_user_id`
    FOREIGN KEY (`from_user_id`) REFERENCES `alumni_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT `fk_alumni_card_exchanges_to_user_id`
    FOREIGN KEY (`to_user_id`) REFERENCES `alumni_users` (`id`)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校友名片交换表';

CREATE TABLE IF NOT EXISTS `alumni_organizations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '组织主键',
  `name` VARCHAR(150) NOT NULL COMMENT '组织名称',
  `type` VARCHAR(50) NOT NULL COMMENT '组织类型',
  `principal` VARCHAR(100) DEFAULT NULL COMMENT '负责人',
  `city` VARCHAR(100) DEFAULT NULL COMMENT '所在城市',
  `member_count` INT NOT NULL DEFAULT 0 COMMENT '成员数量',
  `pending_count` INT NOT NULL DEFAULT 0 COMMENT '待审核成员数量',
  `active_count` INT NOT NULL DEFAULT 0 COMMENT '近期活跃活动数',
  `founded_at` DATE DEFAULT NULL COMMENT '成立时间',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1运营中 0筹备中',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '组织说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_alumni_organizations_type` (`type`),
  KEY `idx_alumni_organizations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校友组织表';

CREATE TABLE IF NOT EXISTS `alumni_activities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '活动主键',
  `name` VARCHAR(150) NOT NULL COMMENT '活动名称',
  `type` VARCHAR(50) NOT NULL COMMENT '活动类型',
  `organization_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '主办组织ID',
  `city` VARCHAR(100) DEFAULT NULL COMMENT '活动城市',
  `venue` VARCHAR(255) DEFAULT NULL COMMENT '活动地点',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `capacity` INT NOT NULL DEFAULT 0 COMMENT '活动容量',
  `enrollments` INT NOT NULL DEFAULT 0 COMMENT '报名人数',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0报名中 1进行中 2已结束',
  `description` VARCHAR(1000) DEFAULT NULL COMMENT '活动说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_alumni_activities_type` (`type`),
  KEY `idx_alumni_activities_status` (`status`),
  KEY `idx_alumni_activities_start_time` (`start_time`),
  KEY `idx_alumni_activities_organization_id` (`organization_id`),
  CONSTRAINT `fk_alumni_activities_organization_id`
    FOREIGN KEY (`organization_id`) REFERENCES `alumni_organizations` (`id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='校友活动表';

CREATE TABLE IF NOT EXISTS `alumni_import_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '导入任务主键',
  `name` VARCHAR(255) NOT NULL COMMENT '文件名称',
  `type` VARCHAR(50) NOT NULL COMMENT '导入类型',
  `operator_name` VARCHAR(100) NOT NULL COMMENT '执行人',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0待确认 1校验中 2已完成',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '总记录数',
  `success_count` INT NOT NULL DEFAULT 0 COMMENT '成功数',
  `failed_count` INT NOT NULL DEFAULT 0 COMMENT '失败数',
  `error_details` JSON DEFAULT NULL COMMENT '错误详情',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_alumni_import_jobs_type` (`type`),
  KEY `idx_alumni_import_jobs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Excel导入任务表';

INSERT INTO `sys_roles` (`id`, `role_name`, `role_code`, `description`, `status`)
VALUES
  (1, '超级管理员', 'SUPER_ADMIN', '系统默认超级管理员角色', 1),
  (2, '运营管理员', 'OPERATOR', '系统默认运营管理角色', 1)
ON DUPLICATE KEY UPDATE
  `role_name` = VALUES(`role_name`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`);

INSERT INTO `sys_permissions` (`id`, `permission_name`, `permission_code`, `description`)
VALUES
  (1, '查看用户', 'user:list', '允许查看用户列表'),
  (2, '修改用户状态', 'user:update_status', '允许修改用户状态'),
  (3, '查看角色', 'role:list', '允许查看角色列表'),
  (4, '查看权限', 'permission:list', '允许查看权限列表'),
  (5, '查看菜单', 'menu:list', '允许查看菜单列表'),
  (6, '新增菜单', 'menu:create', '允许新增菜单'),
  (7, '编辑菜单', 'menu:update', '允许编辑菜单'),
  (8, '修改菜单状态', 'menu:update_status', '允许修改菜单状态')
ON DUPLICATE KEY UPDATE
  `permission_name` = VALUES(`permission_name`),
  `description` = VALUES(`description`);

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`)
VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (1, 7),
  (1, 8),
  (2, 1),
  (2, 3),
  (2, 4),
  (2, 5)
ON DUPLICATE KEY UPDATE
  `role_id` = VALUES(`role_id`);

INSERT INTO `sys_users` (
  `id`,
  `username`,
  `password_hash`,
  `name`,
  `email`,
  `phone`,
  `avatar`,
  `title`,
  `bio`,
  `gender`,
  `location`,
  `website`,
  `birthday`,
  `start_work_date`,
  `company`,
  `department`,
  `position`,
  `status`,
  `last_login_at`
)
VALUES (
  1,
  'admin',
  '$2b$10$YzSjKCizwrJM6T1DufyK3OLeBFZG3FUuB3HPMe6TqYbTUmWT8oFCm',
  '系统管理员',
  'admin@rongchuan.local',
  '13800000000',
  NULL,
  '系统运营负责人',
  '负责融川后台系统的账号管理、权限配置和运营支持。',
  '保密',
  '中国·南京',
  'https://rongchuan.local',
  '1995-06-21',
  '2018-10',
  '融川科技',
  '平台研发部',
  '系统管理员',
  1,
  NULL
)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `avatar` = VALUES(`avatar`),
  `title` = VALUES(`title`),
  `bio` = VALUES(`bio`),
  `gender` = VALUES(`gender`),
  `location` = VALUES(`location`),
  `website` = VALUES(`website`),
  `birthday` = VALUES(`birthday`),
  `start_work_date` = VALUES(`start_work_date`),
  `company` = VALUES(`company`),
  `department` = VALUES(`department`),
  `position` = VALUES(`position`),
  `status` = VALUES(`status`);

ALTER TABLE `sys_users`
  ADD COLUMN IF NOT EXISTS `hobby` VARCHAR(500) DEFAULT NULL COMMENT 'interest tags raw text' AFTER `position`,
  ADD COLUMN IF NOT EXISTS `interest_likes` JSON DEFAULT NULL COMMENT 'liked interest tags' AFTER `hobby`,
  ADD COLUMN IF NOT EXISTS `interest_dislikes` JSON DEFAULT NULL COMMENT 'disliked interest tags' AFTER `interest_likes`,
  ADD COLUMN IF NOT EXISTS `interest_selection` JSON DEFAULT NULL COMMENT 'interest selection payload' AFTER `interest_dislikes`;

UPDATE `sys_users`
SET
  `hobby` = COALESCE(`hobby`, 'javascript、react.js、typescript、node.js'),
  `interest_likes` = COALESCE(`interest_likes`, JSON_ARRAY('javascript', 'react.js', 'typescript', 'node.js')),
  `interest_dislikes` = COALESCE(`interest_dislikes`, JSON_ARRAY()),
  `interest_selection` = COALESCE(
    `interest_selection`,
    JSON_OBJECT(
      'liked', JSON_ARRAY('javascript', 'react.js', 'typescript', 'node.js'),
      'disliked', JSON_ARRAY()
    )
  )
WHERE `id` = 1;

INSERT INTO `sys_user_roles` (`user_id`, `role_id`)
VALUES
  (1, 1)
ON DUPLICATE KEY UPDATE
  `user_id` = VALUES(`user_id`);

INSERT INTO `sys_menus` (
  `id`,
  `parent_id`,
  `menu_name`,
  `menu_code`,
  `path`,
  `component`,
  `icon`,
  `sort_order`,
  `status`
)
VALUES
  (1, 0, '首页', 'dashboard', '/dashboard', 'views/DashboardPage', 'DashboardOutlined', 10, 1),
  (2, 0, '用户管理', 'users', '/users', 'views/UsersPage', 'UserOutlined', 20, 1),
  (3, 0, '角色管理', 'roles', '/roles', 'views/RolesPage', 'SafetyOutlined', 30, 1),
  (5, 0, '菜单管理', 'menus', '/menus', 'views/MenusPage', 'MenuOutlined', 50, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `icon` = VALUES(`icon`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`);

INSERT INTO `sys_role_menus` (`role_id`, `menu_id`)
SELECT 1, m.id
FROM `sys_menus` m
ON DUPLICATE KEY UPDATE
  `role_id` = VALUES(`role_id`);

INSERT INTO `sys_role_menus` (`role_id`, `menu_id`)
SELECT 2, m.id
FROM `sys_menus` m
WHERE m.menu_code IN ('dashboard')
ON DUPLICATE KEY UPDATE
  `role_id` = VALUES(`role_id`);

INSERT INTO `alumni_users` (
  `id`,
  `open_id`,
  `phone`,
  `name`,
  `avatar`,
  `gender`,
  `company`,
  `position`,
  `city`,
  `bio`,
  `status`,
  `verified_status`,
  `allow_search`
)
VALUES
  (1, 'wx_seed_zhangchen', '13812340001', '张晨', NULL, 1, '字节跳动', '高级前端工程师', '上海', '信息工程学院校友，关注技术分享与校友合作。', 1, 2, 1),
  (2, 'wx_seed_lixin', '13912340002', '李欣', NULL, 2, '腾讯', '品牌经理', '深圳', '经济管理学院校友，长期参与校友活动策划。', 1, 2, 1),
  (3, 'wx_seed_zhouhang', '13712340003', '周航', NULL, 1, '吉利汽车', '产品专家', '杭州', '机械工程学院校友，聚焦制造业创新。', 1, 1, 1),
  (4, 'wx_seed_chenying', '13612340004', '陈莹', NULL, 2, '中伦律师事务所', '律师', '北京', '法学院校友，提供法律咨询支持。', 0, 3, 0)
ON DUPLICATE KEY UPDATE
  `open_id` = VALUES(`open_id`),
  `phone` = VALUES(`phone`),
  `name` = VALUES(`name`),
  `avatar` = VALUES(`avatar`),
  `gender` = VALUES(`gender`),
  `company` = VALUES(`company`),
  `position` = VALUES(`position`),
  `city` = VALUES(`city`),
  `bio` = VALUES(`bio`),
  `status` = VALUES(`status`),
  `verified_status` = VALUES(`verified_status`),
  `allow_search` = VALUES(`allow_search`);

INSERT INTO `alumni_student_records` (
  `id`,
  `user_id`,
  `school`,
  `college`,
  `major`,
  `class_name`,
  `student_no`,
  `enrollment_year`,
  `graduation_year`,
  `status`
)
VALUES
  (1, 1, '融川大学', '信息工程学院', '计算机科学与技术', '计科 1801', '2018123401', 2018, 2022, 2),
  (2, 2, '融川大学', '经济管理学院', '市场营销', '营销 1602', '2016110809', 2016, 2020, 2),
  (3, 3, '融川大学', '机械工程学院', '车辆工程', '车辆 1401', '2014102218', 2014, 2018, 1),
  (4, 4, '融川大学', '法学院', '法学', '法学 1202', '2012050906', 2012, 2016, 0)
ON DUPLICATE KEY UPDATE
  `school` = VALUES(`school`),
  `college` = VALUES(`college`),
  `major` = VALUES(`major`),
  `class_name` = VALUES(`class_name`),
  `student_no` = VALUES(`student_no`),
  `enrollment_year` = VALUES(`enrollment_year`),
  `graduation_year` = VALUES(`graduation_year`),
  `status` = VALUES(`status`);

INSERT INTO `alumni_cards` (
  `id`,
  `user_id`,
  `slogan`,
  `show_phone`,
  `show_wechat`,
  `wechat`,
  `need_approval`,
  `allow_search`
)
VALUES
  (1, 1, '技术同频，合作共进', 1, 1, 'zhangchen-tech', 0, 1),
  (2, 2, '品牌连接校友，活动创造价值', 1, 1, 'lixin-brand', 0, 1),
  (3, 3, '制造业创新与校友资源共振', 0, 1, 'zhouhang-auto', 1, 1),
  (4, 4, '法律服务与校友公益同行', 0, 0, NULL, 1, 0)
ON DUPLICATE KEY UPDATE
  `slogan` = VALUES(`slogan`),
  `show_phone` = VALUES(`show_phone`),
  `show_wechat` = VALUES(`show_wechat`),
  `wechat` = VALUES(`wechat`),
  `need_approval` = VALUES(`need_approval`),
  `allow_search` = VALUES(`allow_search`);

INSERT INTO `alumni_organizations` (
  `id`,
  `name`,
  `type`,
  `principal`,
  `city`,
  `member_count`,
  `pending_count`,
  `active_count`,
  `founded_at`,
  `status`,
  `description`
)
VALUES
  (1, '校友总会', '校友会', '王海明', '南京', 18240, 32, 28, '2012-09-01', 1, '负责全校校友工作的统筹协调。'),
  (2, '上海校友会', '地方组织', '周倩', '上海', 3260, 11, 8, '2016-05-20', 1, '面向上海及周边校友的地方组织。'),
  (3, '数字经济行业分会', '行业组织', '李振', '深圳', 840, 18, 6, '2024-11-18', 0, '聚焦数字经济与产业合作。'),
  (4, '信息工程学院校友分会', '学院分会', '赵雪', '南京', 5120, 9, 14, '2018-10-12', 1, '信息工程学院校友专属组织。')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `principal` = VALUES(`principal`),
  `city` = VALUES(`city`),
  `member_count` = VALUES(`member_count`),
  `pending_count` = VALUES(`pending_count`),
  `active_count` = VALUES(`active_count`),
  `founded_at` = VALUES(`founded_at`),
  `status` = VALUES(`status`),
  `description` = VALUES(`description`);

INSERT INTO `alumni_activities` (
  `id`,
  `name`,
  `type`,
  `organization_id`,
  `city`,
  `venue`,
  `start_time`,
  `end_time`,
  `capacity`,
  `enrollments`,
  `status`,
  `description`
)
VALUES
  (1, '2026 校友创新论坛', '论坛', 1, '上海', '徐汇校区报告厅', '2026-05-18 14:00:00', '2026-05-18 18:00:00', 400, 286, 0, '聚焦创新创业与校友资源联动。'),
  (2, '长三角校友创业沙龙', '沙龙', 2, '上海', '漕河泾科创中心', '2026-04-20 19:00:00', '2026-04-20 21:30:00', 120, 94, 0, '长三角校友创业项目交流沙龙。'),
  (3, '校庆返校日', '返校日', 1, '南京', '主校区', '2026-04-12 09:00:00', '2026-04-12 17:00:00', 500, 520, 1, '校庆返校主题活动。'),
  (4, '校友专场招聘会', '招聘会', 4, '杭州', '体育馆', '2026-03-28 10:00:00', '2026-03-28 17:00:00', 800, 660, 2, '面向校友企业与在校生的专场招聘会。')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `organization_id` = VALUES(`organization_id`),
  `city` = VALUES(`city`),
  `venue` = VALUES(`venue`),
  `start_time` = VALUES(`start_time`),
  `end_time` = VALUES(`end_time`),
  `capacity` = VALUES(`capacity`),
  `enrollments` = VALUES(`enrollments`),
  `status` = VALUES(`status`),
  `description` = VALUES(`description`);

INSERT INTO `alumni_import_jobs` (
  `id`,
  `name`,
  `type`,
  `operator_name`,
  `status`,
  `total_count`,
  `success_count`,
  `failed_count`,
  `error_details`
)
VALUES
  (1, '2026 春季校友资料导入.xlsx', 'alumni', '系统管理员', 2, 320, 312, 8, JSON_ARRAY(JSON_OBJECT('row', 16, 'message', '手机号已存在'), JSON_OBJECT('row', 45, 'message', '姓名不能为空'))),
  (2, '学籍档案补录-信息学院.xlsx', 'student', '教务老师', 0, 131, 128, 3, JSON_ARRAY(JSON_OBJECT('row', 9, 'message', '专业不能为空'))),
  (3, '华东地区校友更新.xlsx', 'alumni', '区域运营', 1, 0, 0, 0, JSON_ARRAY())
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `type` = VALUES(`type`),
  `operator_name` = VALUES(`operator_name`),
  `status` = VALUES(`status`),
  `total_count` = VALUES(`total_count`),
  `success_count` = VALUES(`success_count`),
  `failed_count` = VALUES(`failed_count`),
  `error_details` = VALUES(`error_details`);
