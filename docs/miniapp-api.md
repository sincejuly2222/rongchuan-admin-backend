# rongchuanAdminBackend 小程序端 API 规划文档

Base path: `/api`

本文档用于整理“校友通微信小程序”面向 C 端用户的接口规划，便于产品、前端和后端对齐字段与交互。

说明：

- 本文档中的接口以设计稿和当前表结构为基础整理
- 截止 2026-04-08，这些小程序端接口大多尚未在当前代码仓库中实现
- 已实现的后台管理接口请查看 [`docs/auth-api.md`](./auth-api.md)
- 本文档中的“建议路径”和“建议响应”可作为下一阶段开发基线

## 1. 小程序端接口范围

建议按以下模块拆分：

- 登录与身份识别
- 实名认证与校友认证
- 首页推荐
- 找校友
- 校友名片
- 我的学籍
- 活动
- 消息中心
- 个人中心

## 2. 通用约定

### 统一响应格式

建议与后台保持一致：

```json
{
  "code": 200,
  "message": "成功",
  "data": {}
}
```

### 终端身份

建议小程序端登录后返回单独的校友用户身份，而不是复用后台管理员 `sys_users`。

建议基于当前业务表：

- `alumni_users`
- `alumni_student_records`
- `alumni_cards`
- `alumni_card_exchanges`

### 小程序用户对象建议

```json
{
  "id": 1,
  "openId": "wx_openid_001",
  "phone": "13800000001",
  "name": "张三",
  "avatar": "https://example.com/avatar.png",
  "gender": 1,
  "company": "融川科技",
  "position": "产品经理",
  "city": "上海",
  "status": 1,
  "verifiedStatus": 2,
  "allowSearch": 1
}
```

## 3. 登录与身份识别

### 3.1 微信登录

状态：`规划中，未实现`

建议接口：

`POST /api/miniapp/auth/wechat-login`

请求体：

```json
{
  "code": "wx_login_code"
}
```

建议行为：

- 前端通过微信获取 `code`
- 后端调用微信接口换取 `openId`
- 若 `openId` 已存在，则直接登录
- 若不存在，则创建一条 `alumni_users` 记录

建议响应：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "miniapp_access_token",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "user": {
      "id": 1,
      "openId": "wx_openid_001",
      "phone": null,
      "name": "微信用户",
      "avatar": null,
      "verifiedStatus": 0
    }
  }
}
```

### 3.2 绑定手机号

状态：`规划中，未实现`

建议接口：

`POST /api/miniapp/auth/bind-phone`

请求体：

```json
{
  "phoneCode": "wx_phone_code"
}
```

建议行为：

- 需要先登录
- 后端通过微信手机号解密能力获取手机号
- 将手机号写入 `alumni_users.phone`

## 4. 认证模块

### 4.1 提交实名/校友认证

状态：`规划中，未实现`

建议接口：

`POST /api/miniapp/verification/submit`

请求体：

```json
{
  "realName": "张三",
  "idCardNo": "310xxxxxxxxxxxxx",
  "school": "融川大学",
  "college": "信息学院",
  "major": "计算机科学与技术",
  "className": "1801",
  "studentNo": "20180001",
  "enrollmentYear": 2018
}
```

建议行为：

- 更新 `alumni_users.name`
- 将 `alumni_users.verified_status` 置为 `1`
- 创建或更新 `alumni_student_records`
- 后续由后台审核改为 `2` 或 `3`

### 4.2 获取认证状态

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/verification/status`

建议响应：

```json
{
  "code": 200,
  "message": "获取认证状态成功",
  "data": {
    "verifiedStatus": 1,
    "verifiedStatusText": "认证中"
  }
}
```

## 5. 首页

### 5.1 首页信息

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/home`

建议响应：

```json
{
  "code": 200,
  "message": "获取首页数据成功",
  "data": {
    "banners": [],
    "recommendedAlumni": [],
    "recommendedActivities": [],
    "quickEntries": [
      { "code": "find-alumni", "name": "找校友" },
      { "code": "activities", "name": "活动" },
      { "code": "my-card", "name": "我的名片" }
    ]
  }
}
```

## 6. 找校友

### 6.1 校友列表

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/alumni`

建议 Query：

- `keyword`
- `major`
- `enrollmentYear`
- `className`
- `city`
- `page`
- `pageSize`

建议行为：

- 只返回 `allow_search = 1` 且 `status = 1` 的校友
- 未交换名片时只返回基础资料

建议返回字段：

```json
{
  "id": 1,
  "name": "张三",
  "avatar": null,
  "major": "计算机科学与技术",
  "enrollmentYear": 2018,
  "company": "融川科技",
  "city": "上海"
}
```

### 6.2 校友名片详情

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/alumni/:id/card`

建议行为：

- 如果当前用户和目标用户尚未交换名片，只返回基础信息
- 如果交换已通过，可额外返回手机号、微信号等隐私字段

## 7. 名片交换

### 7.1 发起交换

状态：`规划中，未实现`

建议接口：

`POST /api/miniapp/card-exchanges`

请求体：

```json
{
  "toUserId": 2,
  "message": "想认识一下校友"
}
```

建议行为：

- `fromUserId` 从当前登录态取得
- 创建 `alumni_card_exchanges`
- 如果对方名片配置 `need_approval = 0`，可直接置为通过

### 7.2 我的交换记录

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/card-exchanges`

建议 Query：

- `type`: `sent` 或 `received`
- `status`

### 7.3 处理交换申请

状态：`规划中，未实现`

建议接口：

`PATCH /api/miniapp/card-exchanges/:id/status`

请求体：

```json
{
  "status": 1
}
```

说明：

- `1` 表示通过
- `2` 表示拒绝

## 8. 我的名片

### 8.1 获取我的名片

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/me/card`

### 8.2 保存我的名片

状态：`规划中，未实现`

建议接口：

`PUT /api/miniapp/me/card`

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

建议映射表：

- `alumni_cards`

## 9. 我的学籍

### 9.1 获取我的学籍

状态：`规划中，未实现`

建议接口：

`GET /api/miniapp/me/student-record`

### 9.2 保存我的学籍

状态：`规划中，未实现`

建议接口：

`PUT /api/miniapp/me/student-record`

请求体：

```json
{
  "school": "融川大学",
  "college": "信息学院",
  "major": "计算机科学与技术",
  "className": "1801",
  "studentNo": "20180001",
  "enrollmentYear": 2018,
  "graduationYear": 2022
}
```

建议映射表：

- `alumni_student_records`

## 10. 活动模块

状态：`规划中，未实现`

设计稿中已有活动能力，但当前仓库尚未建表。

建议后续补充：

- `activities`
- `activity_registrations`

建议接口：

- `GET /api/miniapp/activities`
- `GET /api/miniapp/activities/:id`
- `POST /api/miniapp/activities/:id/register`
- `GET /api/miniapp/me/activities`

## 11. 消息模块

状态：`规划中，未实现`

设计稿中已有消息中心能力，但当前仓库尚未建表。

建议后续补充：

- `notifications`

建议接口：

- `GET /api/miniapp/me/messages`
- `PATCH /api/miniapp/me/messages/:id/read`

## 12. 个人中心

状态：`规划中，未实现`

建议接口：

- `GET /api/miniapp/me`
- `PUT /api/miniapp/me/profile`

建议返回：

- 我的基础信息
- 我的名片摘要
- 我的学籍摘要
- 我的交换数量
- 我的活动数量

## 13. 开发建议

如果下一步开始开发小程序端，建议优先级如下：

1. 微信登录、绑定手机号
2. 我的资料、我的学籍、我的名片
3. 找校友列表、校友详情
4. 名片交换
5. 活动模块
6. 消息模块
