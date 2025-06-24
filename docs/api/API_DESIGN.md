# API 设计文档

## 基础信息

- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-12-01T12:00:00Z"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2024-12-01T12:00:00Z"
}
```

## 认证模块

### 用户注册
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "张",
  "lastName": "三"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "firstName": "张",
      "lastName": "三"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 用户登录
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 刷新令牌
```
POST /auth/refresh
Authorization: Bearer refresh_token

Response:
{
  "success": true,
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### 登出
```
POST /auth/logout
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "message": "登出成功"
}
```

## 用户管理模块

### 获取用户信息
```
GET /users/profile
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "firstName": "张",
    "lastName": "三",
    "avatar": "avatar_url",
    "phone": "13800138000",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 更新用户信息
```
PUT /users/profile
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "firstName": "李",
  "lastName": "四",
  "phone": "13800138001"
}
```

### 修改密码
```
PUT /users/password
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

## 账户管理模块

### 获取账户列表
```
GET /accounts
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "招商银行储蓄卡",
      "type": "SAVINGS",
      "balance": "10000.50",
      "currency": "CNY",
      "bankName": "招商银行",
      "accountNumber": "****1234",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 创建账户
```
POST /accounts
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "支付宝",
  "type": "CASH",
  "balance": "1000.00",
  "currency": "CNY",
  "description": "支付宝余额"
}
```

### 更新账户
```
PUT /accounts/:id
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "更新后的账户名",
  "description": "更新后的描述"
}
```

### 删除账户
```
DELETE /accounts/:id
Authorization: Bearer jwt_token
```

## 分类管理模块

### 获取分类列表
```
GET /categories?type=EXPENSE
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "餐饮",
      "type": "EXPENSE",
      "color": "#FF6B6B",
      "icon": "restaurant",
      "parentId": null,
      "children": [
        {
          "id": "uuid",
          "name": "早餐",
          "type": "EXPENSE",
          "color": "#FF6B6B",
          "icon": "breakfast",
          "parentId": "parent_uuid"
        }
      ]
    }
  ]
}
```

### 创建分类
```
POST /categories
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "交通",
  "type": "EXPENSE",
  "color": "#4ECDC4",
  "icon": "car",
  "parentId": null
}
```

## 交易记录模块

### 获取交易记录
```
GET /transactions?page=1&limit=20&type=EXPENSE&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "amount": "50.00",
        "type": "EXPENSE",
        "description": "午餐",
        "date": "2024-01-15T12:00:00Z",
        "category": {
          "id": "uuid",
          "name": "餐饮",
          "color": "#FF6B6B"
        },
        "account": {
          "id": "uuid",
          "name": "支付宝"
        },
        "tags": ["午餐", "工作日"],
        "location": "公司附近"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "summary": {
      "totalIncome": "5000.00",
      "totalExpense": "3000.00",
      "balance": "2000.00"
    }
  }
}
```

### 创建交易记录
```
POST /transactions
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "type": "EXPENSE",
  "amount": "50.00",
  "description": "午餐",
  "categoryId": "category_uuid",
  "fromAccountId": "account_uuid",
  "date": "2024-01-15T12:00:00Z",
  "tags": ["午餐", "工作日"],
  "location": "公司附近",
  "notes": "和同事一起吃的"
}
```

### 批量导入交易记录
```
POST /transactions/batch
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "transactions": [
    {
      "type": "EXPENSE",
      "amount": "30.00",
      "description": "早餐",
      "categoryId": "category_uuid",
      "fromAccountId": "account_uuid",
      "date": "2024-01-15T08:00:00Z"
    }
  ]
}
```

## 预算管理模块

### 获取预算列表
```
GET /budgets?period=MONTHLY&active=true
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "月度餐饮预算",
      "amount": "1000.00",
      "spent": "350.00",
      "remaining": "650.00",
      "period": "MONTHLY",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "alertThreshold": "0.8",
      "progress": 0.35,
      "status": "NORMAL"
    }
  ]
}
```

### 创建预算
```
POST /budgets
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "月度交通预算",
  "amount": "500.00",
  "period": "MONTHLY",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "alertThreshold": "0.8",
  "accountId": "account_uuid"
}
```

## 统计分析模块

### 获取财务概览
```
GET /analytics/overview?period=month&date=2024-01
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": "8000.00",
      "totalExpense": "5000.00",
      "balance": "3000.00",
      "savingsRate": 0.375
    },
    "trends": {
      "incomeChange": 0.15,
      "expenseChange": -0.05,
      "balanceChange": 0.25
    },
    "topCategories": [
      {
        "categoryId": "uuid",
        "categoryName": "餐饮",
        "amount": "1200.00",
        "percentage": 0.24
      }
    ]
  }
}
```

### 获取收支趋势
```
GET /analytics/trends?type=expense&period=6months
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": {
    "labels": ["2023-08", "2023-09", "2023-10", "2023-11", "2023-12", "2024-01"],
    "datasets": [
      {
        "label": "支出",
        "data": [4500, 4800, 5200, 4900, 5100, 5000],
        "color": "#FF6B6B"
      }
    ]
  }
}
```

### 获取分类统计
```
GET /analytics/categories?period=month&date=2024-01&type=expense
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": [
    {
      "categoryId": "uuid",
      "categoryName": "餐饮",
      "amount": "1200.00",
      "percentage": 0.24,
      "color": "#FF6B6B",
      "transactionCount": 45
    }
  ]
}
```

## 报告生成模块

### 获取报告列表
```
GET /reports?type=MONTHLY_SUMMARY&limit=10
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "2024年1月财务报告",
      "type": "MONTHLY_SUMMARY",
      "period": "2024-01",
      "format": "PDF",
      "filePath": "/reports/2024-01-summary.pdf",
      "generatedAt": "2024-02-01T00:00:00Z",
      "isPublic": false
    }
  ]
}
```

### 生成报告
```
POST /reports/generate
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "type": "MONTHLY_SUMMARY",
  "period": "2024-01",
  "format": "PDF",
  "parameters": {
    "includeCharts": true,
    "includeDetails": true,
    "categories": ["all"]
  }
}

Response:
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "status": "GENERATING",
    "estimatedTime": 60
  }
}
```

### 下载报告
```
GET /reports/:id/download
Authorization: Bearer jwt_token

Response: File download
```

## 通知模块

### 获取通知列表
```
GET /notifications?unread=true&limit=20
Authorization: Bearer jwt_token

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "预算警告",
      "content": "您的餐饮预算已使用80%",
      "type": "BUDGET_ALERT",
      "priority": "HIGH",
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 标记通知为已读
```
PUT /notifications/:id/read
Authorization: Bearer jwt_token
```

## 错误码定义

| 错误码 | 说明 |
|--------|------|
| AUTH_001 | 认证失败 |
| AUTH_002 | 令牌已过期 |
| AUTH_003 | 令牌无效 |
| USER_001 | 用户不存在 |
| USER_002 | 邮箱已存在 |
| USER_003 | 用户名已存在 |
| ACCOUNT_001 | 账户不存在 |
| ACCOUNT_002 | 账户余额不足 |
| TRANSACTION_001 | 交易记录不存在 |
| BUDGET_001 | 预算不存在 |
| CATEGORY_001 | 分类不存在 |
| VALIDATION_001 | 参数验证失败 |
| SERVER_001 | 服务器内部错误 |

## 状态码说明

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `422` - 数据验证失败
- `500` - 服务器内部错误 