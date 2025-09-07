# 📚 智能财务管理系统 - 完整API文档

## 🎯 项目概述

**💰 智能财务管理系统** - *Professional Financial Management Solution*

🚀 一个集智能记账、数据分析、财务报告于一体的现代化财务管理解决方案，助力个人和企业实现财务数字化转型。

---

## 📋 目录
1. [项目介绍](#-项目介绍)
2. [核心功能](#-核心功能)
3. [技术架构](#-技术架构)
4. [API基础信息](#-api基础信息)
5. [认证模块](#-认证模块)
6. [用户管理模块](#-用户管理模块)
7. [账户管理模块](#-账户管理模块)
8. [分类管理模块](#-分类管理模块)
9. [交易记录模块](#-交易记录模块)
10. [预算管理模块](#-预算管理模块)
11. [统计分析模块](#-统计分析模块)
12. [报告生成模块](#-报告生成模块)
13. [通知模块](#-通知模块)
14. [错误码定义](#-错误码定义)
15. [开发进度](#-开发进度)
16. [部署指南](#-部署指南)

---

## 🌟 项目介绍

### 核心亮点

#### 🧠 智能化特性
- **AI 智能分类** - 机器学习自动识别交易类型
- **语音记账** - 支持自然语言识别录入
- **智能预警** - 异常支出实时提醒
- **个性化推荐** - 基于消费习惯的理财建议

#### 📊 专业级分析
- **多维度统计** - 时间、类别、账户等多角度分析
- **趋势预测** - 基于历史数据的支出预测
- **对比分析** - 同期对比、目标对比
- **风险评估** - 财务健康度评分

### 🏗️ 技术架构

#### 现代化全栈技术栈
- **前端**: React 18 + TypeScript + Ant Design + Vite
- **后端**: Node.js + Express + TypeScript + Prisma
- **数据库**: PostgreSQL + Redis
- **容器化**: Docker + Docker Compose
- **可视化**: ECharts + 多BI风格集成

#### 📊 BI可视化看板风格
- **Tableau Style Dashboard** - 经典蓝白配色设计
- **Power BI Style Dashboard** - Microsoft设计语言
- **帆软BI Style Dashboard** - 企业级中文界面
- **观远BI Style Dashboard** - AI智能分析引擎

---

## 🔌 API基础信息

### 基础配置
- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-12-01T12:00:00Z"
}
```

#### 错误响应
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

### 状态码说明
- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `422` - 数据验证失败
- `500` - 服务器内部错误

---

## 🔐 认证模块

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
```

### 用户登录
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 刷新令牌
```
POST /auth/refresh
Authorization: Bearer refresh_token
```

### 用户登出
```
POST /auth/logout
Authorization: Bearer jwt_token
```

---

## 👤 用户管理模块

### 获取用户信息
```
GET /users/profile
Authorization: Bearer jwt_token
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

---

## 💳 账户管理模块

### 获取账户列表
```
GET /accounts
Authorization: Bearer jwt_token
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

---

## 🏷️ 分类管理模块

### 获取分类列表
```
GET /categories?type=EXPENSE
Authorization: Bearer jwt_token
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

---

## 💰 交易记录模块

### 获取交易记录
```
GET /transactions?page=1&limit=20&type=EXPENSE&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt_token
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

---

## 🎯 预算管理模块

### 获取预算列表
```
GET /budgets?period=MONTHLY&active=true
Authorization: Bearer jwt_token
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

---

## 📊 统计分析模块

### 获取财务概览
```
GET /analytics/overview?period=month&date=2024-01
Authorization: Bearer jwt_token
```

### 获取收支趋势
```
GET /analytics/trends?type=expense&period=6months
Authorization: Bearer jwt_token
```

### 获取分类统计
```
GET /analytics/categories?period=month&date=2024-01&type=expense
Authorization: Bearer jwt_token
```

---

## 📋 报告生成模块

### 获取报告列表
```
GET /reports?type=MONTHLY_SUMMARY&limit=10
Authorization: Bearer jwt_token
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
```

### 下载报告
```
GET /reports/:id/download
Authorization: Bearer jwt_token
```

---

## 🔔 通知模块

### 获取通知列表
```
GET /notifications?unread=true&limit=20
Authorization: Bearer jwt_token
```

### 标记通知为已读
```
PUT /notifications/:id/read
Authorization: Bearer jwt_token
```

---

## ⚠️ 错误码定义

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

---

## 📈 开发进度

### 当前状态
**最后更新**: 2025-09-07 12:26:37

### ✅ 已完成的核心功能
- **基础架构搭建** (100%)
- **后端核心API开发** (100%)
- **认证系统** (100%)
- **数据层** (Prisma + PostgreSQL) (100%)
- **账户管理、货币管理、分类管理、交易记录模块** (100%)
- **项目结构优化和模块化重构** (100%)
- **文档完善** (100%)

### 🔄 进行中的任务
- **Phase 12: 生产测试阶段** (90% 完成) - 负载测试验证中

### 📋 详细开发时间表

| 开发阶段 | 起始时间 | 完成时间 | 进度状态 |
|----------|----------|----------|----------|
| Phase 1: 基础建设 | 2025-06-24 | 2025-06-27 | ✅ 100% 完成 |
| Phase 2: 后端核心 | 2025-06-30 | 2025-08-30 | ✅ 100% 完成 |
| Phase 3: 前端框架 | 2025-07-07 | 2025-07-10 | ⚡ 60% 开发中 |
| Phase 4: 业务功能 | 2025-07-11 | 2025-07-16 | 🚧 30% 起步阶段 |
| Phase 5: 数据可视化 | 2025-07-17 | 2025-07-22 | 📋 10% 规划中 |
| Phase 6: 智能功能 | 2025-07-23 | 2025-07-28 | 💡 5% 概念设计 |

**🎯 预计总开发周期**: `8个月` (2025年6月24日 - 2026年3月15日)

---

## 🚀 部署指南

### 快速启动

#### 🪟 Windows 用户
```powershell
# 克隆项目
git clone https://github.com/yourusername/financial-management-system.git
cd financial-management-system

# 🎯 一键启动
.\scripts\start-dev.ps1
```

#### 🐧 Linux/macOS 用户
```bash
# 克隆项目
git clone https://github.com/yourusername/financial-management-system.git
cd financial-management-system

# 🎯 一键启动
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### 🌐 服务访问

| 服务 | 地址 | 描述 |
|------|------|------|
| 🎨 **前端应用** | [localhost:3000](http://localhost:3000) | 主要用户界面 |
| ⚡ **后端API** | [localhost:8000](http://localhost:8000) | RESTful API服务 |
| 📚 **API文档** | [localhost:8000/docs](http://localhost:8000/docs) | Swagger接口文档 |
| 🗃️ **数据库管理** | [localhost:5050](http://localhost:5050) | pgAdmin数据库管理 |

### 🔐 测试账户
```
📧 邮箱: admin@financial.com
🔑 密码: admin123456
🎭 角色: 系统管理员
```

---

## 📞 技术支持

### 💬 联系方式
- **📧 邮件支持**: support@financial-system.com
- **💭 社区讨论**: [GitHub Discussions](https://github.com/yourusername/financial-management-system/discussions)
- **🐛 问题反馈**: [GitHub Issues](https://github.com/yourusername/financial-management-system/issues)

### 📄 许可证
本项目采用 **MIT 许可证** - 详情请查看 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢以下优秀的开源项目为我们提供强大支持：
- **React** - 用户界面构建库
- **Ant Design** - 企业级UI组件库
- **Prisma** - 现代化数据库工具
- **Node.js** - JavaScript运行环境
- **Docker** - 容器化平台

---

*最后更新时间：2025-09-07 12:26:37*

🚀 让我们一起构建更好的财务管理解决方案！