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
- `sys_permissions`
- `sys_user_roles`
- `sys_role_permissions`
- `auth_refresh_sessions`

这些表已经和当前代码中的模型查询保持一致，可直接支撑：

- 登录、注册、刷新 token、退出登录
- 用户列表与用户状态修改
- 角色列表
- 权限列表

## 默认种子数据

初始化完成后会自动写入一组基础数据：

- 默认账号：`admin`
- 默认密码：`Admin@123456`
- 默认角色：`SUPER_ADMIN`、`OPERATOR`
- 默认权限：用户、角色、权限列表以及用户状态修改

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
