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
