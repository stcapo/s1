# 小型网店信息系统
# Small Online Store Information System

基于性能优化的硕士论文项目，构建高性能、低成本、可扩展的小型网店系统。
Performance-oriented Master's thesis implementation - cost-effective, high-performance, and scalable.

## 🚀 技术栈 (Technology Stack)

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Vite + Tailwind CSS | 响应式UI，性能优化 |
| 后端 | Node.js + Express | RESTful API |
| 数据库 | MySQL 8.0 | 主从复制支持 |
| 缓存 | Redis 7.0 | 多级缓存策略 |
| 监控 | Prometheus + Grafana | 性能监控 |

## 📦 项目结构

```
small-store-sys/
├── backend/              # 后端服务
│   ├── server.js         # Express 服务器
│   ├── package.json
│   └── .env              # 环境配置
├── frontend/             # 前端应用
│   ├── src/
│   │   ├── App.jsx       # 主应用组件
│   │   ├── main.jsx      # 入口文件
│   │   └── index.css     # 样式文件
│   └── package.json
├── infrastructure/       # 基础设施配置
│   ├── init.sql          # 数据库初始化
│   └── prometheus.yml    # 监控配置
└── docker-compose.yml    # Docker 编排
```

## 🛠️ 快速开始

### 1. 前置要求
- Node.js 18+
- Docker Desktop (用于 MySQL & Redis)

### 2. 启动基础设施

```bash
# 启动 MySQL, Redis, Prometheus, Grafana
docker-compose up -d
```

### 3. 启动后端

```bash
cd backend
npm install
npm run dev
```

服务将在 http://localhost:3000 启动

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

应用将在 http://localhost:5173 启动

## 📊 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/products` | GET | 商品列表/搜索 |
| `/api/products/:id` | GET | 商品详情 |
| `/api/categories` | GET | 分类列表 |
| `/api/orders` | POST | 创建订单 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |

## ⚡ 性能特性

- **Redis 缓存**: 搜索结果缓存 (TTL 1小时)
- **响应时间**: 缓存命中 ~10ms, 数据库查询 ~50-100ms
- **数据库优化**: 索引优化、全文搜索支持
- **前端优化**: 图片懒加载、搜索防抖

## 📈 监控

- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## 🔐 默认账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@store.com | (需设置) |
| 商家 | merchant@store.com | (需设置) |
| 顾客 | customer@test.com | (需设置) |

---

**论文项目** - 小型网店信息系统性能研究与优化
