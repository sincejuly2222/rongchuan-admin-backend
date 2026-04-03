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
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_users_username` (`username`),
  UNIQUE KEY `uk_sys_users_email` (`email`),
  KEY `idx_sys_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='后台用户表';

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
  1,
  NULL
)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `email` = VALUES(`email`),
  `phone` = VALUES(`phone`),
  `avatar` = VALUES(`avatar`),
  `status` = VALUES(`status`);

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
  (1, 0, '工作台', 'dashboard', '/dashboard', 'views/DashboardPage', 'DashboardOutlined', 10, 1),
  (2, 0, '用户管理', 'users', '/users', 'views/UsersPage', 'UserOutlined', 20, 1),
  (3, 0, '角色管理', 'roles', '/roles', 'views/RolesPage', 'SafetyOutlined', 30, 1),
  (4, 0, '权限管理', 'permissions', '/permissions', 'views/PermissionsPage', 'SafetyCertificateOutlined', 40, 1),
  (5, 0, '菜单管理', 'menus', '/menus', 'views/MenusPage', 'MenuOutlined', 50, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `icon` = VALUES(`icon`),
  `sort_order` = VALUES(`sort_order`),
  `status` = VALUES(`status`);
