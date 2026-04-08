# rongchuanAdminBackend 后台管理端 API 文档

Base path: `/api`

本文档基于当前后端代码整理，覆盖当前已经实现并注册到服务中的后台管理端接口，包括健康检查、认证、用户、角色、权限、菜单、校友管理、学籍管理、名片管理、名片交换等。

## 通用说明

### 鉴权方式

- `accessToken` 通过登录或刷新接口的 JSON 响应体返回
- `refreshToken` 通过 `HttpOnly Cookie` 保存
- 所有受保护接口都需要在请求头中传入：

```http
Authorization: Bearer <accessToken>
```

- 需要自动刷新登录态时，前端需要允许浏览器携带 Cookie

### 统一响应格式

成功响应：

```json
{
  "code": 200,
  "message": "成功",
  "data": {}
}
```

失败响应：

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null,
  "errors": null
}
```

### 通用鉴权错误

所有需要登录的接口都可能返回：

- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

### 当前用户对象

`/api/auth/login`、`/api/auth/me`、`/api/auth/profile` 返回的 `user` 结构一致：

```json
{
  "id": 1,
  "username": "admin",
  "name": "系统管理员",
  "email": "admin@rongchuan.local",
  "phone": "13800000000",
  "avatar": null,
  "status": 1,
  "lastLoginAt": "2026-04-03T08:49:54.000Z",
  "createdAt": "2026-04-03T06:21:10.000Z",
  "updatedAt": "2026-04-03T08:49:54.000Z",
  "roleIds": [1],
  "roleNames": ["超级管理员"]
}
```

## 1. 健康检查

`GET /api/health`

说明：

- 用于检查服务进程和数据库连接状态
- 不需要登录

成功响应：

```json
{
  "code": 200,
  "message": "服务运行正常",
  "data": {
    "database": "已连接",
    "timestamp": "2026-04-03T08:55:00.000Z"
  }
}
```

## 2. 登录

`POST /api/auth/login`

请求体：

```json
{
  "username": "admin",
  "password": "Admin@123456"
}
```

成功响应：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "jwt_access_token",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "email": "admin@rongchuan.local",
      "phone": "13800000000",
      "avatar": null,
      "status": 1,
      "lastLoginAt": "2026-04-03T08:49:54.000Z",
      "createdAt": "2026-04-03T06:21:10.000Z",
      "updatedAt": "2026-04-03T08:49:54.000Z",
      "roleIds": [1],
      "roleNames": ["超级管理员"]
    }
  }
}
```

Cookie 响应头示例：

```http
Set-Cookie: refreshToken=...; HttpOnly; Path=/api/auth; SameSite=Lax
```

错误情况：

- `400`: 用户名和密码不能为空
- `401`: 用户名或密码错误
- `403`: 账号已被禁用

## 3. 注册

`POST /api/auth/register`

请求体：

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "User@123456",
  "avatar": "https://example.com/avatar.png"
}
```

字段说明：

- `username`: 必填，长度 3 到 20
- `email`: 必填，格式必须合法
- `password`: 必填，长度至少 6 位
- `avatar`: 可选

成功响应：

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "avatar": "https://example.com/avatar.png"
  }
}
```

说明：

- 当前注册接口仅创建基础账号
- 不处理角色绑定
- 创建后默认启用，`name` 默认与 `username` 一致

错误情况：

- `400`: 用户名、邮箱和密码不能为空
- `400`: 用户名长度需在 3 到 20 个字符之间
- `400`: 邮箱格式不正确
- `400`: 密码长度不能少于 6 位
- `409`: 用户名已存在
- `409`: 邮箱已存在

## 4. 获取当前登录用户

`GET /api/auth/me`

请求头：

```http
Authorization: Bearer <accessToken>
```

成功响应：

```json
{
  "code": 200,
  "message": "获取当前用户成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "email": "admin@rongchuan.local",
      "phone": "13800000000",
      "avatar": null,
      "status": 1,
      "lastLoginAt": "2026-04-03T08:49:54.000Z",
      "createdAt": "2026-04-03T06:21:10.000Z",
      "updatedAt": "2026-04-03T08:49:54.000Z",
      "roleIds": [1],
      "roleNames": ["超级管理员"]
    }
  }
}
```

错误情况：

- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 用户不存在

## 5. 更新当前登录人个人信息

`PUT /api/auth/profile`

请求头：

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

请求体：

```json
{
  "name": "系统管理员",
  "email": "admin@rongchuan.local",
  "phone": "13800000000",
  "avatar": "https://example.com/avatar.png"
}
```

说明：

- 只能更新当前登录人的个人资料
- 当前仅支持修改 `name`、`email`、`phone`、`avatar`
- `phone`、`avatar` 允许传空字符串，后端会转为 `null`
- `username`、`roleIds`、`roleNames` 不通过该接口修改

成功响应：

```json
{
  "code": 200,
  "message": "更新个人信息成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "email": "admin@rongchuan.local",
      "phone": "13800000000",
      "avatar": "https://example.com/avatar.png",
      "status": 1,
      "lastLoginAt": "2026-04-03T12:10:00.000Z",
      "createdAt": "2026-04-03T06:21:10.000Z",
      "updatedAt": "2026-04-03T12:20:00.000Z",
      "roleIds": [1],
      "roleNames": ["超级管理员"]
    }
  }
}
```

错误情况：

- `400`: 姓名和邮箱不能为空
- `400`: 邮箱格式不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 用户不存在
- `409`: 邮箱已存在

## 6. 刷新 Access Token

`POST /api/auth/refresh`

请求说明：

- 不需要 JSON Body
- 浏览器必须自动携带 `refreshToken` Cookie

成功响应：

```json
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "accessToken": "new_jwt_access_token",
    "tokenType": "Bearer",
    "expiresIn": 7200
  }
}
```

说明：

- 当前刷新接口只返回新的 `accessToken`
- 后端会撤销旧的刷新会话，并下发新的 `refreshToken` Cookie
- 如果前端需要同步最新用户资料，可刷新后再调用 `/api/auth/me`

错误情况：

- `401`: 缺少刷新令牌
- `401`: 刷新令牌无效或已过期
- `401`: 用户不存在或已被删除

## 7. 退出登录

`POST /api/auth/logout`

请求说明：

- 不需要 JSON Body
- 如果当前存在 `refreshToken` Cookie，后端会尝试撤销对应会话
- 无论 Cookie 是否有效，后端都会清理刷新 Cookie

成功响应：

```json
{
  "code": 200,
  "message": "退出登录成功",
  "data": null
}
```

## 8. 获取用户列表

`GET /api/users`

Query 参数：

- `current`: 页码，默认 `1`
- `page`: 页码别名，未传 `current` 时可用
- `pageSize`: 每页条数，默认 `10`
- `username`: 按用户名模糊搜索
- `name`: 按姓名模糊搜索
- `status`: 用户状态，支持 `1`、`0`、`启用`、`禁用`

请求示例：

```http
GET /api/users?current=1&pageSize=10&username=admin&status=1
```

成功响应：

```json
{
  "code": 200,
  "message": "获取用户列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "name": "系统管理员",
        "email": "admin@rongchuan.local",
        "phone": "13800000000",
        "avatar": null,
        "status": 1,
        "last_login_at": "2026-04-03T08:49:54.000Z",
        "created_at": "2026-04-03T06:21:10.000Z",
        "updated_at": "2026-04-03T08:49:54.000Z",
        "role_names": "超级管理员",
        "role_ids": [1]
      }
    ],
    "total": 1,
    "current": 1,
    "pageSize": 10
  }
}
```

错误情况：

- `400`: 分页参数不正确
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 9. 新增用户

`POST /api/users`

请求体：

```json
{
  "username": "editor01",
  "password": "Editor@123",
  "name": "编辑用户",
  "email": "editor01@example.com",
  "phone": "13900000001",
  "avatar": null,
  "status": 1,
  "roleIds": [2]
}
```

字段说明：

- `username`: 必填，长度 3 到 20
- `password`: 必填，长度至少 6 位
- `email`: 必填
- `name`: 可选，不传时默认等于 `username`
- `phone`: 可选，空字符串会转为 `null`
- `avatar`: 可选，空字符串会转为 `null`
- `status`: 可选，默认 `1`，只支持 `1` 或 `0`
- `roleIds`: 可选数组，不传时默认为空数组，元素必须是已存在的角色 ID

成功响应：

```json
{
  "code": 201,
  "message": "新增用户成功",
  "data": {
    "id": 2,
    "username": "editor01",
    "name": "编辑用户",
    "email": "editor01@example.com",
    "phone": "13900000001",
    "avatar": null,
    "status": 1,
    "last_login_at": null,
    "created_at": "2026-04-03T09:10:00.000Z",
    "updated_at": "2026-04-03T09:10:00.000Z",
    "role_names": "运营管理员",
    "role_ids": [2]
  }
}
```

错误情况：

- `400`: 用户名、邮箱和密码不能为空
- `400`: 用户名长度需在 3 到 20 个字符之间
- `400`: 邮箱格式不正确
- `400`: 密码长度不能少于 6 位
- `400`: 状态参数不正确
- `400`: 角色参数不正确
- `400`: 角色不存在
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `409`: 用户名已存在
- `409`: 邮箱已存在

## 10. 编辑用户

`PUT /api/users/:id`

Path 参数：

- `id`: 用户 ID

请求体：

```json
{
  "username": "editor01",
  "password": "NewPass@123",
  "name": "编辑用户已修改",
  "email": "editor01.updated@example.com",
  "phone": "13900000009",
  "avatar": null,
  "status": 0,
  "roleIds": [1, 2]
}
```

说明：

- `username`、`email` 必填
- `password` 可选，传入时会重置密码
- `status` 可选，不传时保留原值
- `roleIds` 可选，不传时保留原有角色绑定
- 如果传空数组 `[]`，会清空该用户角色绑定

成功响应：

```json
{
  "code": 200,
  "message": "编辑用户成功",
  "data": {
    "id": 2,
    "username": "editor01",
    "name": "编辑用户已修改",
    "email": "editor01.updated@example.com",
    "phone": "13900000009",
    "avatar": null,
    "status": 0,
    "last_login_at": null,
    "created_at": "2026-04-03T09:10:00.000Z",
    "updated_at": "2026-04-03T09:12:00.000Z",
    "role_names": "超级管理员, 运营管理员",
    "role_ids": [1, 2]
  }
}
```

错误情况：

- `400`: 用户ID不正确
- `400`: 用户名和邮箱不能为空
- `400`: 用户名长度需在 3 到 20 个字符之间
- `400`: 邮箱格式不正确
- `400`: 密码长度不能少于 6 位
- `400`: 状态参数不正确
- `400`: 角色参数不正确
- `400`: 角色不存在
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 用户不存在
- `409`: 用户名已存在
- `409`: 邮箱已存在

## 11. 更新用户状态

`PATCH /api/users/:id/status`

Path 参数：

- `id`: 用户 ID

请求体：

```json
{
  "status": 1
}
```

说明：

- `status` 只支持 `1` 或 `0`

成功响应：

```json
{
  "code": 200,
  "message": "更新用户状态成功",
  "data": {
    "id": 2,
    "status": 1
  }
}
```

错误情况：

- `400`: 用户ID不正确
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 用户不存在

## 12. 获取角色列表

`GET /api/roles`

Query 参数：

- `current`: 页码，默认 `1`
- `page`: 页码别名
- `pageSize`: 每页条数，默认 `10`
- `roleName`: 角色名称模糊搜索
- `roleCode`: 角色编码模糊搜索
- `status`: 角色状态，支持 `1`、`0`、`启用`、`禁用`

成功响应：

```json
{
  "code": 200,
  "message": "获取角色列表成功",
  "data": {
    "list": [
      {
        "id": 2,
        "role_name": "运营管理员",
        "role_code": "OPERATOR",
        "description": "系统默认运营管理角色",
        "status": 1,
        "created_at": "2026-04-03T06:21:10.000Z",
        "updated_at": "2026-04-03T06:21:10.000Z",
        "member_count": 0,
        "permission_count": 3
      }
    ],
    "total": 2,
    "current": 1,
    "pageSize": 10
  }
}
```

错误情况：

- `400`: 分页参数不正确
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 13. 新增角色

`POST /api/roles`

请求体：

```json
{
  "roleName": "内容管理员",
  "roleCode": "CONTENT_ADMIN",
  "description": "负责内容管理和发布",
  "status": 1
}
```

字段说明：

- `roleName`: 必填
- `roleCode`: 必填，必须唯一
- `description`: 可选，空字符串会转为 `null`
- `status`: 可选，默认 `1`

成功响应：

```json
{
  "code": 201,
  "message": "新增角色成功",
  "data": {
    "id": 3,
    "role_name": "内容管理员",
    "role_code": "CONTENT_ADMIN",
    "description": "负责内容管理和发布",
    "status": 1,
    "created_at": "2026-04-03T11:10:00.000Z",
    "updated_at": "2026-04-03T11:10:00.000Z",
    "member_count": 0,
    "permission_count": 0
  }
}
```

错误情况：

- `400`: 角色名称和角色编码不能为空
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `409`: 角色编码已存在

## 14. 编辑角色

`PUT /api/roles/:id`

Path 参数：

- `id`: 角色 ID

请求体：

```json
{
  "roleName": "内容管理员",
  "roleCode": "CONTENT_ADMIN",
  "description": "负责内容、审核和发布",
  "status": 1
}
```

说明：

- `roleName`、`roleCode` 必填
- `status` 可选，不传时保留原值

成功响应：

```json
{
  "code": 200,
  "message": "编辑角色成功",
  "data": {
    "id": 3,
    "role_name": "内容管理员",
    "role_code": "CONTENT_ADMIN",
    "description": "负责内容、审核和发布",
    "status": 1,
    "created_at": "2026-04-03T11:10:00.000Z",
    "updated_at": "2026-04-03T11:20:00.000Z",
    "member_count": 0,
    "permission_count": 0
  }
}
```

错误情况：

- `400`: 角色ID不正确
- `400`: 角色名称和角色编码不能为空
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 角色不存在
- `409`: 角色编码已存在

## 15. 获取角色已绑定权限

`GET /api/roles/:id/permissions`

Path 参数：

- `id`: 角色 ID

成功响应：

```json
{
  "code": 200,
  "message": "获取角色权限成功",
  "data": {
    "roleId": 1,
    "permissionIds": [1, 2, 3, 4]
  }
}
```

错误情况：

- `400`: 角色ID不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 角色不存在

## 16. 更新角色权限

`PUT /api/roles/:id/permissions`

Path 参数：

- `id`: 角色 ID

请求体：

```json
{
  "permissionIds": [1, 2, 3]
}
```

说明：

- `permissionIds` 必须为数组
- 传空数组 `[]` 表示清空该角色已绑定权限

成功响应：

```json
{
  "code": 200,
  "message": "更新角色权限成功",
  "data": {
    "roleId": 1,
    "permissionIds": [1, 2, 3]
  }
}
```

错误情况：

- `400`: 角色ID不正确
- `400`: 权限参数不正确
- `400`: 权限不存在
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 角色不存在

## 17. 获取权限列表

`GET /api/permissions`

Query 参数：

- `current`: 页码，默认 `1`
- `page`: 页码别名
- `pageSize`: 每页条数，默认 `10`
- `permissionCode`: 权限编码模糊搜索
- `permissionName`: 权限名称模糊搜索

成功响应：

```json
{
  "code": 200,
  "message": "获取权限列表成功",
  "data": {
    "list": [
      {
        "id": 4,
        "permission_code": "permission:list",
        "permission_name": "查看权限",
        "description": "允许查看权限列表",
        "created_at": "2026-04-03T06:21:10.000Z",
        "updated_at": "2026-04-03T06:21:10.000Z",
        "role_count": 2
      }
    ],
    "total": 4,
    "current": 1,
    "pageSize": 10
  }
}
```

错误情况：

- `400`: 分页参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 18. 新增权限

`POST /api/permissions`

请求体：

```json
{
  "permissionCode": "menu:create",
  "permissionName": "新增菜单",
  "description": "允许创建菜单"
}
```

字段说明：

- `permissionCode`: 必填，必须唯一
- `permissionName`: 必填
- `description`: 可选，空字符串会转为 `null`

成功响应：

```json
{
  "code": 201,
  "message": "新增权限成功",
  "data": {
    "id": 5,
    "permission_code": "menu:create",
    "permission_name": "新增菜单",
    "description": "允许创建菜单",
    "created_at": "2026-04-03T12:00:00.000Z",
    "updated_at": "2026-04-03T12:00:00.000Z",
    "role_count": 0
  }
}
```

错误情况：

- `400`: 权限编码和权限名称不能为空
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `409`: 权限编码已存在

## 19. 编辑权限

`PUT /api/permissions/:id`

Path 参数：

- `id`: 权限 ID

请求体：

```json
{
  "permissionCode": "menu:create",
  "permissionName": "新增菜单权限",
  "description": "允许创建后台菜单"
}
```

成功响应：

```json
{
  "code": 200,
  "message": "编辑权限成功",
  "data": {
    "id": 5,
    "permission_code": "menu:create",
    "permission_name": "新增菜单权限",
    "description": "允许创建后台菜单",
    "created_at": "2026-04-03T12:00:00.000Z",
    "updated_at": "2026-04-03T12:10:00.000Z",
    "role_count": 0
  }
}
```

错误情况：

- `400`: 权限ID不正确
- `400`: 权限编码和权限名称不能为空
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 权限不存在
- `409`: 权限编码已存在

## 20. 获取菜单列表

`GET /api/menus`

Query 参数：

- `current`: 页码，默认 `1`
- `page`: 页码别名
- `pageSize`: 每页条数，默认 `10`
- `menuName`: 菜单名称模糊搜索
- `status`: 菜单状态，支持 `1`、`0`、`启用`、`禁用`

成功响应：

```json
{
  "code": 200,
  "message": "获取菜单列表成功",
  "data": {
    "list": [
      {
        "id": 5,
        "parent_id": 0,
        "parent_name": null,
        "menu_name": "菜单管理",
        "menu_code": "menus",
        "path": "/menus",
        "component": "views/MenusPage",
        "icon": "MenuOutlined",
        "sort_order": 50,
        "status": 1,
        "created_at": "2026-04-03T11:50:00.000Z",
        "updated_at": "2026-04-03T11:50:00.000Z"
      }
    ],
    "total": 5,
    "current": 1,
    "pageSize": 10
  }
}
```

错误情况：

- `400`: 分页参数不正确
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 21. 新增菜单

`POST /api/menus`

请求体：

```json
{
  "parentId": 0,
  "menuName": "菜单管理",
  "menuCode": "menus",
  "path": "/menus",
  "component": "views/MenusPage",
  "icon": "MenuOutlined",
  "sortOrder": 50,
  "status": 1
}
```

字段说明：

- `parentId`: 可选，默认 `0`，表示顶级菜单
- `menuName`: 必填
- `menuCode`: 必填，必须唯一
- `path`: 可选，空字符串会转为 `null`
- `component`: 可选，空字符串会转为 `null`
- `icon`: 可选，空字符串会转为 `null`
- `sortOrder`: 可选，默认 `0`，必须为整数
- `status`: 可选，默认 `1`

成功响应：

```json
{
  "code": 201,
  "message": "新增菜单成功",
  "data": {
    "id": 6,
    "parent_id": 0,
    "parent_name": null,
    "menu_name": "菜单管理",
    "menu_code": "menus",
    "path": "/menus",
    "component": "views/MenusPage",
    "icon": "MenuOutlined",
    "sort_order": 50,
    "status": 1,
    "created_at": "2026-04-03T12:20:00.000Z",
    "updated_at": "2026-04-03T12:20:00.000Z"
  }
}
```

错误情况：

- `400`: 父级菜单参数不正确
- `400`: 菜单名称和菜单编码不能为空
- `400`: 排序参数不正确
- `400`: 状态参数不正确
- `400`: 父级菜单不存在
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `409`: 菜单编码已存在

## 22. 编辑菜单

`PUT /api/menus/:id`

Path 参数：

- `id`: 菜单 ID

请求体：

```json
{
  "parentId": 0,
  "menuName": "菜单管理",
  "menuCode": "menus",
  "path": "/menus",
  "component": "views/MenusPage",
  "icon": "MenuOutlined",
  "sortOrder": 60,
  "status": 1
}
```

说明：

- `menuName`、`menuCode` 必填
- `status` 可选，不传时保留原值
- `parentId` 不能等于当前菜单自身 ID

成功响应：

```json
{
  "code": 200,
  "message": "编辑菜单成功",
  "data": {
    "id": 6,
    "parent_id": 0,
    "parent_name": null,
    "menu_name": "菜单管理",
    "menu_code": "menus",
    "path": "/menus",
    "component": "views/MenusPage",
    "icon": "MenuOutlined",
    "sort_order": 60,
    "status": 1,
    "created_at": "2026-04-03T12:20:00.000Z",
    "updated_at": "2026-04-03T12:25:00.000Z"
  }
}
```

错误情况：

- `400`: 菜单ID不正确
- `400`: 父级菜单参数不正确
- `400`: 菜单名称和菜单编码不能为空
- `400`: 排序参数不正确
- `400`: 状态参数不正确
- `400`: 父级菜单不能是自己
- `400`: 父级菜单不存在
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 菜单不存在
- `409`: 菜单编码已存在

## 23. 更新菜单状态

`PATCH /api/menus/:id/status`

Path 参数：

- `id`: 菜单 ID

请求体：

```json
{
  "status": 0
}
```

说明：

- `status` 只支持 `1` 或 `0`

成功响应：

```json
{
  "code": 200,
  "message": "更新菜单状态成功",
  "data": {
    "id": 6,
    "status": 0
  }
}
```

错误情况：

- `400`: 菜单ID不正确
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 菜单不存在

## 24. 获取菜单树

`GET /api/menus/tree`

说明：

- 返回全部菜单的树形结构
- 适合用于上级菜单下拉、树形表格、前端菜单树展示

成功响应：

```json
{
  "code": 200,
  "message": "获取菜单树成功",
  "data": [
    {
      "id": 5,
      "parent_id": 0,
      "parent_name": null,
      "menu_name": "菜单管理",
      "menu_code": "menus",
      "path": "/menus",
      "component": "views/MenusPage",
      "icon": "MenuOutlined",
      "sort_order": 50,
      "status": 1,
      "created_at": "2026-04-03T11:50:00.000Z",
      "updated_at": "2026-04-03T11:50:00.000Z",
      "children": []
    }
  ]
}
```

错误情况：

- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 25. 删除菜单

`DELETE /api/menus/:id`

Path 参数：

- `id`: 菜单 ID

说明：

- 如果当前菜单下存在子菜单，接口会拒绝删除

成功响应：

```json
{
  "code": 200,
  "message": "删除菜单成功",
  "data": {
    "id": 6
  }
}
```

错误情况：

- `400`: 菜单ID不正确
- `400`: 当前菜单存在子菜单，不能直接删除
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 菜单不存在

## 26. 获取校友列表

`GET /api/alumni-users`

Query 参数：

- `current`: 页码，默认 `1`
- `page`: 页码别名
- `pageSize`: 每页条数，默认 `10`
- `keyword`: 按姓名、公司、手机号模糊搜索
- `status`: 校友状态，支持 `0`、`1`
- `verifiedStatus`: 认证状态，支持 `0`、`1`、`2`、`3`
- `enrollmentYear`: 入学年份
- `major`: 专业模糊搜索
- `className`: 班级模糊搜索
- `company`: 公司模糊搜索

成功响应：

```json
{
  "code": 200,
  "message": "获取校友列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "open_id": "wx_openid_001",
        "phone": "13800000001",
        "name": "张三",
        "avatar": null,
        "gender": 1,
        "company": "融川科技",
        "position": "产品经理",
        "city": "上海",
        "status": 1,
        "verified_status": 2,
        "allow_search": 1,
        "created_at": "2026-04-08T12:00:00.000Z",
        "school": "融川大学",
        "college": "信息学院",
        "major": "计算机科学与技术",
        "class_name": "1801",
        "enrollment_year": 2018,
        "slogan": "连接校友，连接机会"
      }
    ],
    "total": 1,
    "current": 1,
    "pageSize": 10
  }
}
```

错误情况：

- `400`: 分页参数不正确
- `400`: 筛选参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 27. 新增校友

`POST /api/alumni-users`

请求体：

```json
{
  "openId": "wx_openid_001",
  "phone": "13800000001",
  "name": "张三",
  "avatar": "https://example.com/avatar.png",
  "gender": 1,
  "company": "融川科技",
  "position": "产品经理",
  "city": "上海",
  "bio": "2018级校友，关注校友资源连接",
  "status": 1,
  "verifiedStatus": 2,
  "allowSearch": 1
}
```

字段说明：

- `name`: 必填
- `openId`: 可选，唯一
- `phone`: 可选，需满足中国大陆手机号格式，唯一
- `gender`: 可选，支持 `0`、`1`、`2`
- `status`: 可选，支持 `0`、`1`
- `verifiedStatus`: 可选，支持 `0`、`1`、`2`、`3`
- `allowSearch`: 可选，支持 `0`、`1`

成功响应：

```json
{
  "code": 201,
  "message": "新增校友成功",
  "data": {
    "id": 1,
    "open_id": "wx_openid_001",
    "phone": "13800000001",
    "name": "张三",
    "avatar": "https://example.com/avatar.png",
    "gender": 1,
    "company": "融川科技",
    "position": "产品经理",
    "city": "上海",
    "bio": "2018级校友，关注校友资源连接",
    "status": 1,
    "verified_status": 2,
    "allow_search": 1,
    "created_at": "2026-04-08T12:00:00.000Z",
    "updated_at": "2026-04-08T12:00:00.000Z",
    "student_record": null,
    "card": null
  }
}
```

错误情况：

- `400`: 姓名不能为空
- `400`: 姓名长度不能超过 100 个字符
- `400`: 手机号格式不正确
- `400`: 参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `409`: OpenID 已存在
- `409`: 手机号已存在

## 28. 获取校友详情

`GET /api/alumni-users/:id`

Path 参数：

- `id`: 校友 ID

成功响应：

```json
{
  "code": 200,
  "message": "获取校友详情成功",
  "data": {
    "id": 1,
    "open_id": "wx_openid_001",
    "phone": "13800000001",
    "name": "张三",
    "avatar": "https://example.com/avatar.png",
    "gender": 1,
    "company": "融川科技",
    "position": "产品经理",
    "city": "上海",
    "bio": "2018级校友，关注校友资源连接",
    "status": 1,
    "verified_status": 2,
    "allow_search": 1,
    "created_at": "2026-04-08T12:00:00.000Z",
    "updated_at": "2026-04-08T12:00:00.000Z",
    "student_record": {
      "id": 1,
      "school": "融川大学",
      "college": "信息学院",
      "major": "计算机科学与技术",
      "class_name": "1801",
      "student_no": "20180001",
      "enrollment_year": 2018,
      "graduation_year": 2022,
      "status": 2
    },
    "card": {
      "id": 1,
      "slogan": "连接校友，连接机会",
      "show_phone": 1,
      "show_wechat": 1,
      "wechat": "zhangsan001",
      "need_approval": 0,
      "allow_search": 1
    }
  }
}
```

错误情况：

- `400`: 校友ID不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 校友不存在

## 29. 编辑校友

`PUT /api/alumni-users/:id`

请求体示例：

```json
{
  "phone": "13800000009",
  "name": "张三丰",
  "avatar": "https://example.com/avatar-new.png",
  "gender": 1,
  "company": "融川科技",
  "position": "高级产品经理",
  "city": "杭州",
  "bio": "持续参与校友活动",
  "status": 1,
  "verifiedStatus": 2,
  "allowSearch": 1
}
```

说明：

- 支持修改校友基础资料
- 未传字段会保留原值
- `openId` 和 `phone` 仍会做唯一性校验

错误情况：

- `400`: 校友ID不正确
- `400`: 姓名不能为空
- `400`: 手机号格式不正确
- `400`: 参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 校友不存在
- `409`: OpenID 已存在
- `409`: 手机号已存在

## 30. 更新校友状态

`PATCH /api/alumni-users/:id/status`

请求体：

```json
{
  "status": 0
}
```

错误情况：

- `400`: 校友ID不正确
- `400`: 状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 校友不存在

## 31. 保存学籍信息

`PUT /api/alumni-users/:id/student-record`

请求体：

```json
{
  "school": "融川大学",
  "college": "信息学院",
  "major": "计算机科学与技术",
  "className": "1801",
  "studentNo": "20180001",
  "enrollmentYear": 2018,
  "graduationYear": 2022,
  "status": 2
}
```

说明：

- 该接口为 upsert，首次调用创建，后续调用更新
- 一个校友当前只维护一条学籍记录

错误情况：

- `400`: 校友ID不正确
- `400`: 学校、专业和入学年份不能为空且格式正确
- `400`: 毕业年份格式不正确
- `400`: 学籍状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 校友不存在

## 32. 保存名片信息

`PUT /api/alumni-users/:id/card`

请求体：

```json
{
  "slogan": "连接校友，连接机会",
  "showPhone": 1,
  "showWechat": 1,
  "wechat": "zhangsan001",
  "needApproval": 0,
  "allowSearch": 1
}
```

说明：

- 该接口为 upsert，首次调用创建，后续调用更新
- 一个校友当前只维护一张名片

错误情况：

- `400`: 校友ID不正确
- `400`: 名片参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 校友不存在

## 33. 获取名片交换记录列表

`GET /api/alumni-exchanges`

Query 参数：

- `current`: 页码，默认 `1`
- `page`: 页码别名
- `pageSize`: 每页条数，默认 `10`
- `status`: 状态筛选，支持 `0`、`1`、`2`
- `fromUserId`: 按发起人筛选
- `toUserId`: 按接收人筛选

成功响应：

```json
{
  "code": 200,
  "message": "获取名片交换记录成功",
  "data": {
    "list": [
      {
        "id": 1,
        "from_user_id": 1,
        "from_user_name": "张三",
        "to_user_id": 2,
        "to_user_name": "李四",
        "status": 0,
        "message": "想认识一下校友",
        "created_at": "2026-04-08T12:10:00.000Z",
        "updated_at": "2026-04-08T12:10:00.000Z"
      }
    ],
    "total": 1,
    "current": 1,
    "pageSize": 10
  }
}
```

错误情况：

- `400`: 分页参数不正确
- `400`: 筛选参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期

## 34. 新增名片交换记录

`POST /api/alumni-exchanges`

请求体：

```json
{
  "fromUserId": 1,
  "toUserId": 2,
  "status": 0,
  "message": "想认识一下校友"
}
```

说明：

- `fromUserId` 和 `toUserId` 必填
- 不允许自己给自己发起交换
- 同一对 `fromUserId + toUserId` 不允许重复创建

错误情况：

- `400`: 交换用户参数不正确
- `400`: 不能和自己交换名片
- `400`: 交换状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 交换用户不存在
- `409`: 该交换记录已存在

## 35. 更新名片交换状态

`PATCH /api/alumni-exchanges/:id/status`

请求体：

```json
{
  "status": 1
}
```

说明：

- `status` 支持 `0`、`1`、`2`

错误情况：

- `400`: 交换记录ID不正确
- `400`: 交换状态参数不正确
- `401`: 缺少访问令牌
- `401`: 访问令牌无效或已过期
- `404`: 交换记录不存在
