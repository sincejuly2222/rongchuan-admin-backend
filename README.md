# rongchuanAdminBackend

融川后台管理系统后端服务，基于 Node.js、Express 和 MySQL 构建，提供认证、用户、角色、权限、菜单等后台基础能力。

## README 是干嘛的

`README.md` 是仓库首页说明，主要用于让开发、测试、部署人员快速了解：

- 这个项目是做什么的
- 怎么启动和联调
- 依赖什么环境
- 数据库怎么初始化
- 接口文档和数据库文档在哪里

如果把接口明细都放在 README 里，会过长且不方便维护，所以本仓库的职责划分建议是：

- `README.md`：项目概览、启动方式、联调入口、文档索引
- `docs/auth-api.md`：详细接口文档
- `database/README.md`：数据库初始化与表结构说明

## 项目概览

当前后端已实现以下模块：

- 健康检查
- 用户注册、登录、刷新 token、退出登录
- 当前登录用户信息获取与个人资料更新
- 用户管理
- 角色管理
- 角色权限绑定
- 权限管理
- 菜单管理

服务启动后默认监听：

- 应用首页：`GET /`
- API 根路径：`/api`

## 技术栈

- Node.js 20+
- Express 5
- MySQL 8+
- `mysql2`
- `jsonwebtoken`
- `bcrypt`
- `cookie-parser`
- `cors`
- `helmet`
- `morgan`

## 本地开发要求

启动前请确保本机具备：

- Node.js 20 或更高版本
- npm 10 或更高版本
- MySQL 8 或兼容版本

可选但推荐：

- Postman、Apifox 或 Bruno，用于接口联调
- Nginx，用于生产部署反向代理

## 安装依赖

```bash
npm install
```

## 环境变量配置

请先复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

如果你在 Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

`.env.example` 内容如下：

```env
NODE_ENV=development
PORT=3000

CORS_ORIGIN=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rongchuan_admin

ACCESS_TOKEN_SECRET=replace_with_a_long_random_string
ACCESS_TOKEN_EXPIRES_IN=2h
ACCESS_TOKEN_EXPIRES_IN_SECONDS=7200

REFRESH_TOKEN_SECRET=replace_with_a_different_long_random_string
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN_SECONDS=604800

REFRESH_COOKIE_NAME=refreshToken
REFRESH_COOKIE_SECURE=false
REFRESH_COOKIE_SAME_SITE=lax
REFRESH_COOKIE_DOMAIN=
REFRESH_COOKIE_PATH=/api/auth
REFRESH_COOKIE_MAX_AGE=604800000
```

字段说明：

- `PORT`：服务端口，默认 `3000`
- `CORS_ORIGIN`：允许跨域的前端地址，必须和前端实际 origin 完全一致
- `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME`：数据库连接信息
- `ACCESS_TOKEN_SECRET`：访问令牌签名密钥
- `ACCESS_TOKEN_EXPIRES_IN`：访问令牌时长，默认 `2h`
- `ACCESS_TOKEN_EXPIRES_IN_SECONDS`：访问令牌秒数，默认 `7200`
- `REFRESH_TOKEN_SECRET`：刷新令牌签名密钥
- `REFRESH_TOKEN_EXPIRES_IN`：刷新令牌时长，默认 `7d`
- `REFRESH_TOKEN_EXPIRES_IN_SECONDS`：刷新令牌秒数，默认 `604800`
- `REFRESH_COOKIE_*`：刷新令牌 Cookie 配置

配置建议：

- 生产环境务必替换 `ACCESS_TOKEN_SECRET` 和 `REFRESH_TOKEN_SECRET`
- 如果前后端跨站点传 Cookie，通常需要设置 `REFRESH_COOKIE_SAME_SITE=none`
- 当 `REFRESH_COOKIE_SAME_SITE=none` 时，通常还需要 `REFRESH_COOKIE_SECURE=true`
- `REFRESH_COOKIE_SECURE=true` 需要 HTTPS
- `REFRESH_COOKIE_PATH` 当前默认是 `/api/auth`

### `.env` 需要全部写吗

不需要。

当前项目在 [`src/config/env.js`](./src/config/env.js) 里已经为大部分通用配置提供了默认值，因此本地 `.env` 更推荐只保留：

- 敏感信息
- 当前环境特有的信息
- 必须覆盖默认值的信息

本项目本地开发时，`.env` 最少建议保留这些：

```env
DB_HOST=47.95.20.54
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=rongchuan_admin

ACCESS_TOKEN_SECRET=replace_with_your_access_secret
REFRESH_TOKEN_SECRET=replace_with_your_refresh_secret
```

下面这些如果不写，会走代码默认值，一般本地开发可以省略：

- `NODE_ENV`，默认 `development`
- `PORT`，默认 `3000`
- `CORS_ORIGIN`，默认 `http://localhost:5173`
- `ACCESS_TOKEN_EXPIRES_IN`，默认 `2h`
- `ACCESS_TOKEN_EXPIRES_IN_SECONDS`，默认 `7200`
- `REFRESH_TOKEN_EXPIRES_IN`，默认 `7d`
- `REFRESH_TOKEN_EXPIRES_IN_SECONDS`，默认 `604800`
- `REFRESH_COOKIE_NAME`，默认 `refreshToken`
- `REFRESH_COOKIE_SECURE`，默认开发环境下为 `false`
- `REFRESH_COOKIE_SAME_SITE`，默认 `lax`
- `REFRESH_COOKIE_DOMAIN`，默认空
- `REFRESH_COOKIE_PATH`，默认 `/api/auth`
- `REFRESH_COOKIE_MAX_AGE`，默认 `604800000`

建议约定：

- `.env.example` 保留完整模板和注释
- 本地 `.env` 只保留最小必需配置
- 生产环境再按部署需要补充覆盖项

## 数据库初始化

数据库相关文件位于 [`database/`](./database)：

- [`database/schema.sql`](./database/schema.sql)：初始化 SQL
- [`database/init-db.ps1`](./database/init-db.ps1)：Windows PowerShell 初始化脚本
- [`database/test-db-connection.js`](./database/test-db-connection.js)：数据库连接测试脚本
- [`database/README.md`](./database/README.md)：数据库说明文档

当前初始化 SQL 会创建以下表：

- `sys_users`
- `sys_roles`
- `sys_permissions`
- `sys_user_roles`
- `sys_role_permissions`
- `auth_refresh_sessions`
- `sys_menus`

默认会写入基础种子数据，包括：

- 默认管理员账号：`admin`
- 默认密码：`Admin@123456`
- 默认角色：`SUPER_ADMIN`、`OPERATOR`
- 部分基础权限与菜单数据

### 先配数据库连接

你至少需要把 `.env` 里的下面 5 个字段改成真实值：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rongchuan_admin
```

示例 1，本机 MySQL：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=rongchuan_admin
```

示例 2，远程数据库：

```env
DB_HOST=db.example.internal
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_real_password
DB_NAME=your_db_name
```

注意：

- `DB_NAME` 建议只使用字母、数字和下划线
- `init-db.ps1` 会读取这些变量并将 SQL 初始化到对应数据库
- 如果 `DB_PASSWORD` 为空，可以保留空字符串
- 如果你使用远程数据库，需要先确认服务器安全组和 MySQL 用户权限已放通

### 初始化步骤

1. 在根目录创建 `.env` 并填写数据库配置
2. 先确认数据库服务已经启动
3. 确认本机安装了 MySQL 客户端，并且 `mysql` 命令在 PATH 中可用
4. 执行初始化 SQL
5. 运行连接测试
6. 启动应用

Windows PowerShell 初始化：

```powershell
./database/init-db.ps1
```

如果要手动指定连接参数，也可以这样执行：

```powershell
./database/init-db.ps1 `
  -DbHost 127.0.0.1 `
  -DbPort 3306 `
  -DbUser root `
  -DbPassword 123456 `
  -DbName rongchuan_admin
```

数据库连接测试：

```bash
npm run db:test
```

连接成功时会输出类似结果：

```json
{
  "ok": true,
  "durationMs": 35,
  "result": {
    "now_time": "2026-04-03T14:20:00.000Z",
    "db_name": "rongchuan_admin"
  }
}
```

连接失败时，通常会看到类似字段：

- `ECONNREFUSED`：数据库地址或端口不通
- `ER_ACCESS_DENIED_ERROR`：用户名或密码错误
- `ER_BAD_DB_ERROR`：数据库不存在

说明：

- `schema.sql` 使用 `__DB_NAME__` 占位符，初始化脚本会替换为 `.env` 中的数据库名
- 初始化 SQL 支持重复执行，但线上环境执行前仍建议先备份
- `npm run db:test` 只测试连接，不会初始化表

## 启动项目

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

服务启动成功后，终端会输出：

```text
数据库连接成功。
服务已启动，监听端口 3000
```

## 快速验证

根路由：

```bash
curl http://localhost:3000/
```

健康检查：

```bash
curl http://localhost:3000/api/health
```

登录示例：

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

## 认证机制

本项目采用双令牌方案：

- `accessToken`：通过接口响应体返回，前端通常放在内存或本地存储中
- `refreshToken`：通过 `HttpOnly Cookie` 返回，用于刷新 access token

当前认证接口：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

受保护接口必须携带：

```http
Authorization: Bearer <accessToken>
```

如果需要自动带上刷新 Cookie，前端请求必须开启凭证传递。

`fetch` 示例：

```js
fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  credentials: 'include',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

`axios` 示例：

```js
axios.get('http://localhost:3000/api/auth/me', {
  withCredentials: true,
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## 接口概览

当前 API 路由分组如下：

### 健康检查

- `GET /api/health`

### 认证

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### 用户管理

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`

### 角色管理

- `GET /api/roles`
- `POST /api/roles`
- `PUT /api/roles/:id`
- `GET /api/roles/:id/permissions`
- `PUT /api/roles/:id/permissions`

### 权限管理

- `GET /api/permissions`
- `POST /api/permissions`
- `PUT /api/permissions/:id`

### 菜单管理

- `GET /api/menus`
- `POST /api/menus`
- `PUT /api/menus/:id`
- `PATCH /api/menus/:id/status`

完整接口字段、请求体和返回示例请查看：

- [`docs/auth-api.md`](./docs/auth-api.md)

## 项目目录结构

```text
.
├── database/           数据库初始化和说明
├── docs/               接口文档
├── src/
│   ├── config/         环境变量和数据库配置
│   ├── controllers/    控制器
│   ├── middleware/     中间件
│   ├── models/         数据访问层
│   ├── routes/         路由注册
│   ├── utils/          工具函数
│   ├── app.js          Express 应用组装
│   └── server.js       启动入口
├── package.json
└── README.md
```

## 常用脚本

```bash
npm run dev
npm start
npm run db:test
```

说明：

- `npm run dev`：开发模式启动，使用 Node 原生 `--watch`
- `npm start`：生产模式启动
- `npm run db:test`：单独测试数据库连接

## 联调建议

前后端联调时建议按下面流程：

1. 先执行 `GET /api/health` 确认服务和数据库正常
2. 使用默认管理员账号登录
3. 保存登录返回的 `accessToken`
4. 后续请求带上 `Authorization: Bearer <accessToken>`
5. 需要续期时调用 `/api/auth/refresh`

默认管理员账号：

- 用户名：`admin`
- 密码：`Admin@123456`

## 部署说明

- 生产环境不要提交真实 `.env`
- 建议通过 Nginx 或其他反向代理对外提供服务
- 生产环境必须使用高强度 JWT 密钥
- 如果依赖 Cookie 认证，建议启用 HTTPS
- 需要保证 `CORS_ORIGIN`、Cookie 域名和前端部署地址一致

## 文档索引

- 项目入口说明：[`README.md`](./README.md)
- 接口文档：[`docs/auth-api.md`](./docs/auth-api.md)
- 数据库说明：[`database/README.md`](./database/README.md)
