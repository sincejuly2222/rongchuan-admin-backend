DELETE rm
FROM `sys_role_menus` rm
INNER JOIN `sys_menus` m ON m.id = rm.menu_id
WHERE m.menu_code = 'permissions';

UPDATE `sys_menus`
SET `status` = 0
WHERE `menu_code` = 'permissions';
