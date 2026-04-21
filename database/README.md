# 数据库说明

当前 `database/` 目录已经切换为后台管理系统实际使用的数据库初始化资料，不再是早期博客表结构。

包含文件：

- `schema.sql`：后台管理系统初始化 SQL
- `init-db.ps1`：Windows 下执行初始化 SQL 的脚本
- `test-db-connection.js`：独立测试数据库连接的脚本

## 当前初始化表

初始化脚本会创建以下表：

- `sys_users`
- `sys_roles`
- `sys_user_roles`
- `auth_refresh_sessions`
- `sys_menus`
- `alumni_users`
- `alumni_student_records`
- `alumni_cards`
- `alumni_card_exchanges`

这些表已经和当前代码中的模型查询保持一致，可直接支撑：

- 登录、注册、刷新 token、退出登录
- 用户列表与用户状态修改
- 角色列表
- 菜单管理
- 校友列表、校友详情、校友状态维护
- 学籍信息维护
- 名片信息维护
- 名片交换记录管理

## 校友业务表说明

### `alumni_users`

校友主表，保存校友身份和基础资料。

核心字段：

- `open_id`：预留给小程序微信登录
- `phone`：手机号，唯一
- `name`：姓名
- `avatar`：头像
- `company`、`position`、`city`：职业与城市信息
- `status`：账号状态，`1` 正常，`0` 禁用
- `verified_status`：认证状态，`0` 未认证，`1` 认证中，`2` 已认证，`3` 认证失败
- `allow_search`：是否允许被搜索

### `alumni_student_records`

校友学籍表，和 `alumni_users` 一对一。

核心字段：

- `school`：学校名称
- `college`：学院
- `major`：专业
- `class_name`：班级
- `student_no`：学号
- `enrollment_year`：入学年份
- `graduation_year`：毕业年份
- `status`：学籍状态，`0` 待认领，`1` 已认领，`2` 已审核

### `alumni_cards`

校友名片表，和 `alumni_users` 一对一。

核心字段：

- `slogan`：名片标语
- `show_phone`：是否展示手机号
- `show_wechat`：是否展示微信号
- `wechat`：微信号
- `need_approval`：交换名片是否需要审核
- `allow_search`：名片是否允许被搜索

### `alumni_card_exchanges`

名片交换记录表。

核心字段：

- `from_user_id`：发起人
- `to_user_id`：接收人
- `status`：交换状态，`0` 待处理，`1` 已通过，`2` 已拒绝
- `message`：交换留言

## 默认种子数据

初始化完成后会自动写入一组基础数据：

- 默认账号：`admin`
- 默认密码：`Admin@123456`
- 默认角色：`SUPER_ADMIN`、`OPERATOR`
- 默认菜单：后台管理基础导航菜单

## 初始化方式

1. 配置好 `.env` 中的数据库连接信息
2. Windows PowerShell 执行：

```powershell
./database/init-db.ps1
```

3. 初始化完成后执行连接测试：

```bash
npm run db:test
```

### `.env` 最少需要哪些数据库配置

数据库初始化和连接测试最少只依赖下面 5 个字段：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rongchuan_admin
```

说明：

- 这里只需要数据库相关字段
- 不需要把所有通用业务配置都写进 `.env`
- 例如 `PORT`、`CORS_ORIGIN`、Cookie 配置、Token 时长等，数据库初始化本身并不依赖
- 项目运行时的其余通用项，可以继续使用 `src/config/env.js` 里的默认值
- 建议 `.env.example` 保留完整模板，本地 `.env` 只保留最小必需配置

## 说明

- `schema.sql` 使用 `__DB_NAME__` 占位，`init-db.ps1` 会自动替换为实际数据库名。
- SQL 采用 `CREATE TABLE IF NOT EXISTS` 和 `INSERT ... ON DUPLICATE KEY UPDATE`，可重复执行。
- 如果线上数据库已经存在业务数据，执行前先确认是否需要备份。
- 如果使用远程数据库，请先确认服务器防火墙、安全组和 MySQL 用户权限已放通。
