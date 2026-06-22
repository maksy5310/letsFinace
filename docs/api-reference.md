# API 参考文档

## 基础信息

- 基础URL: `http://localhost:3000/api`
- 数据格式: JSON
- 所有请求和响应均为 JSON 格式

## 项目 (Projects)

### 创建项目
```
POST /api/projects
```
请求体:
```json
{
  "name": "项目名称",
  "description": "项目描述",
  "createdBy": "user-1"
}
```

### 获取项目列表
```
GET /api/projects
```

### 获取项目详情
```
GET /api/projects/:id
```

### 添加成员
```
POST /api/projects/:id/members
```
请求体:
```json
{
  "userId": "user-2",
  "role": "editor",
  "ratio": 0.4
}
```

### 设置分成比例
```
POST /api/projects/:id/ratios
```
请求体:
```json
{
  "user-1": 0.6,
  "user-2": 0.4
}
```

## 交易 (Transactions)

### 记录交易
```
POST /api/projects/:id/transactions
```
请求体:
```json
{
  "type": "income",
  "amount": 10000,
  "date": "2024-06-01",
  "description": "客户全款",
  "category": "service",
  "recordedBy": "user-1"
}
```

### 查询交易
```
GET /api/projects/:id/transactions?from=2024-01-01&to=2024-12-31&category=service&type=income
```

### 统计总额
```
GET /api/projects/:id/totals?from=2024-01-01&to=2024-12-31
```

## 利润 (Profit)

### 计算利润
```
GET /api/projects/:id/profit
```

### 情景模拟
```
POST /api/projects/:id/profit/simulate
```
请求体:
```json
{
  "additionalIncome": 2000,
  "additionalExpense": 1000
}
```

## 供应商 (Suppliers)

### 添加供应商
```
POST /api/projects/:id/suppliers
```
请求体:
```json
{
  "name": "供应商名称",
  "contact": "联系方式"
}
```

### 获取供应商列表
```
GET /api/projects/:id/suppliers
```

### 记录付款
```
POST /api/suppliers/:sid/payments
```
请求体:
```json
{
  "amount": 500,
  "status": "pending",
  "dueDate": "2024-12-31"
}
```

### 对账
```
GET /api/suppliers/:sid/reconcile
```

## 发票 (Invoices)

### 上传发票
```
POST /api/projects/:id/invoices
```
请求体:
```json
{
  "fileName": "invoice_001.jpg"
}
```

### 获取发票列表
```
GET /api/projects/:id/invoices
```

## Excel 导入导出

### 导入交易
```
POST /api/projects/:id/import
```
请求体:
```json
{
  "rows": [
    {"type":"income","amount":5000,"date":"2024-01-15","description":"客户A付款"}
  ]
}
```

### 导出报表
```
GET /api/projects/:id/export
```

## 健康检查

```
GET /api/health
```

## 错误响应

所有错误响应格式:
```json
{
  "error": "错误描述"
}
```

常见状态码:
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在

### 错误场景详细说明

| 接口 | 错误场景 | 状态码 | 错误信息示例 |
|------|----------|--------|-------------|
| `POST /api/projects` | 缺少项目名称或创建者 | 400 | `Project name and creator are required` |
| `GET /api/projects/:id` | 项目不存在 | 404 | `Project not found` |
| `POST /api/projects/:id/members` | 无效角色 | 400 | `Invalid role` |
| `POST /api/projects/:id/members` | 重复添加成员 | 400 | `User already a member` |
| `POST /api/projects/:id/ratios` | 比例之和不等于1.0 | 400 | `Partner ratios must sum to 1.0` |
| `POST /api/projects/:id/transactions` | 无效交易类型 | 400 | `Type must be income or expense` |
| `POST /api/projects/:id/transactions` | 金额为负数 | 400 | `Amount must be a non-negative number` |
| `POST /api/projects/:id/transactions` | 项目不存在 | 400 | `Project not found` |
| `GET /api/projects/:id/profit` | 项目不存在 | 400 | `Project not found` |
| `POST /api/projects/:id/suppliers` | 缺少供应商名称 | 400 | - |
| `POST /api/suppliers/:sid/payments` | 无效付款状态 | 400 | `Status must be pending, paid, or overdue` |
| `GET /api/suppliers/:sid/reconcile` | 供应商不存在 | 400 | `Supplier not found` |
| `POST /api/projects/:id/invoices` | 缺少文件名 | 400 | `ProjectId and fileName are required` |
| `POST /api/projects/:id/import` | rows 不是数组 | 400 | `Rows must be an array` |
| `GET /api/projects/:id/export` | 项目不存在 | 400 | `Project not found` |
| `POST /api/users` | 缺少用户名 | 400 | `User name is required` |
| `POST /api/users` | 无效角色 | 400 | `Invalid role: superadmin` |
| `GET /api/users/:id` | 用户不存在 | 404 | `User not found` |
| `PUT /api/users/:id/role` | 无效角色 | 400 | `Invalid role: superadmin` |

## 测试

API 错误场景已通过系统测试覆盖，详见 `tests/system/api-errors.test.js`。完整工作流测试见 `tests/system/api.test.js`。
