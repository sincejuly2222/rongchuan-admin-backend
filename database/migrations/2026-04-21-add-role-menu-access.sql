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

INSERT INTO `sys_role_menus` (`role_id`, `menu_id`)
SELECT r.id, m.id
FROM `sys_roles` r
JOIN `sys_menus` m
WHERE r.role_code = 'SUPER_ADMIN'
ON DUPLICATE KEY UPDATE
  `role_id` = VALUES(`role_id`);

INSERT INTO `sys_role_menus` (`role_id`, `menu_id`)
SELECT r.id, m.id
FROM `sys_roles` r
JOIN `sys_menus` m ON m.menu_code = 'dashboard'
WHERE r.role_code <> 'SUPER_ADMIN'
ON DUPLICATE KEY UPDATE
  `role_id` = VALUES(`role_id`);
