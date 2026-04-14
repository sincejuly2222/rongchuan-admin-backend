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

UPDATE `sys_users`
SET
  `title` = COALESCE(`title`, '系统运营负责人'),
  `bio` = COALESCE(`bio`, '负责融川后台系统的账号管理、权限配置和运营支持。'),
  `gender` = COALESCE(`gender`, '保密'),
  `location` = COALESCE(`location`, '中国·南京'),
  `website` = COALESCE(`website`, 'https://rongchuan.local'),
  `birthday` = COALESCE(`birthday`, '1995-06-21'),
  `start_work_date` = COALESCE(`start_work_date`, '2018-10'),
  `company` = COALESCE(`company`, '融川科技'),
  `department` = COALESCE(`department`, '平台研发部'),
  `position` = COALESCE(`position`, '系统管理员')
WHERE `id` = 1;
