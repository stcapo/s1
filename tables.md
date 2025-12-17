# Small Online Store System - Documentation Tables

## Table 1 – Package List

| No. | Package Name | Version | Type | Description | Purpose in Project |
|:---:|-------------|:-------:|------|-------------|-------------------|
| **Backend (Node.js) Dependencies** |
| 1 | express | 4.18.2 | Runtime | Web application framework | API server, routing, middleware |
| 2 | mysql2 | 3.9.1 | Runtime | MySQL database driver | Database connection with Promise support |
| 3 | redis | 4.6.13 | Runtime | Redis client library | Caching layer for product search |
| 4 | cors | 2.8.5 | Runtime | CORS middleware | Enable cross-origin API requests |
| 5 | dotenv | 16.4.5 | Runtime | Environment config | Load .env configuration files |
| 6 | jsonwebtoken | 9.0.2 | Runtime | JWT library | User authentication tokens |
| 7 | crypto | built-in | Runtime | Cryptography module | Password hashing (SHA256) |
| **Frontend (React) Dependencies** |
| 8 | react | 18.2.0 | Runtime | UI library | Component-based user interface |
| 9 | react-dom | 18.2.0 | Runtime | React renderer | DOM manipulation and rendering |
| 10 | react-router-dom | 6.22.0 | Runtime | Routing library | SPA navigation and routing |
| 11 | axios | 1.6.7 | Runtime | HTTP client | API requests to backend |
| **Frontend DevDependencies** |
| 12 | vite | 5.1.0 | Development | Build tool | Fast development server, HMR |
| 13 | @vitejs/plugin-react | 4.2.1 | Development | Vite plugin | React JSX transformation |
| 14 | tailwindcss | 3.4.1 | Development | CSS framework | Utility-first styling |
| 15 | postcss | 8.4.35 | Development | CSS processor | Tailwind CSS compilation |
| 16 | autoprefixer | 10.4.17 | Development | CSS tool | Browser vendor prefixes |
| **Infrastructure (Docker)** |
| 17 | mysql | 8.0 | Container | Database server | Primary data storage |
| 18 | redis | 7.0-alpine | Container | Cache server | Query result caching |
| 19 | prometheus | latest | Container | Metrics collector | System monitoring |
| 20 | grafana | latest | Container | Metrics dashboard | Visualization and alerts |

---

## Table 2 – Functions and Privileges of Each Module

| No. | Module | Function Name | Description | Customer | Merchant | Admin |
|:---:|--------|--------------|-------------|:--------:|:--------:|:-----:|
| **User Service Module** |
| 1 | Auth | registerUser | Register new user account | ✓ | ✓ | ✓ |
| 2 | Auth | loginUser | Authenticate and get JWT token | ✓ | ✓ | ✓ |
| 3 | Auth | logoutUser | Invalidate user session | ✓ | ✓ | ✓ |
| 4 | Auth | validateToken | Check JWT token validity | ✓ | ✓ | ✓ |
| 5 | Profile | viewProfile | View user profile details | ✓ | ✓ | ✓ |
| 6 | Profile | updateProfile | Update personal information | ✓ | ✓ | ✓ |
| **Product Service Module** |
| 7 | Product | searchProducts | Search products by keyword | ✓ | ✓ | ✓ |
| 8 | Product | listProducts | Browse product catalog | ✓ | ✓ | ✓ |
| 9 | Product | viewProductDetail | View single product info | ✓ | ✓ | ✓ |
| 10 | Product | getProductReviews | Read product reviews | ✓ | ✓ | ✓ |
| 11 | Product | addProduct | Create new product listing | ✗ | ✓ | ✓ |
| 12 | Product | updateProduct | Modify product information | ✗ | ✓ | ✓ |
| 13 | Product | deleteProduct | Remove product listing | ✗ | ✓ | ✓ |
| 14 | Product | updateStock | Modify inventory quantity | ✗ | ✓ | ✓ |
| **Category Service Module** |
| 15 | Category | listCategories | Get all product categories | ✓ | ✓ | ✓ |
| 16 | Category | filterByCategory | Filter products by category | ✓ | ✓ | ✓ |
| 17 | Category | addCategory | Create new category | ✗ | ✗ | ✓ |
| 18 | Category | updateCategory | Modify category details | ✗ | ✗ | ✓ |
| **Shopping Cart Module** |
| 19 | Cart | addToCart | Add product to cart | ✓ | ✓ | ✗ |
| 20 | Cart | viewCart | View cart contents | ✓ | ✓ | ✗ |
| 21 | Cart | updateQuantity | Change item quantity | ✓ | ✓ | ✗ |
| 22 | Cart | removeFromCart | Delete cart item | ✓ | ✓ | ✗ |
| 23 | Cart | clearCart | Empty entire cart | ✓ | ✓ | ✗ |
| 24 | Cart | calculateTotal | Compute total amount | ✓ | ✓ | ✗ |
| **Order Service Module** |
| 25 | Order | createOrder | Place new order | ✓ | ✗ | ✗ |
| 26 | Order | viewOrderHistory | List user's past orders | ✓ | ✓ | ✓ |
| 27 | Order | viewOrderDetail | Get order details | ✓ | ✓ | ✓ |
| 28 | Order | cancelOrder | Cancel pending order | ✓ | ✗ | ✓ |
| 29 | Order | updateOrderStatus | Change order status | ✗ | ✓ | ✓ |
| 30 | Order | processRefund | Handle refund request | ✗ | ✓ | ✓ |
| **Review Service Module** |
| 31 | Review | addReview | Submit product review | ✓ | ✗ | ✗ |
| 32 | Review | viewReviews | Read product reviews | ✓ | ✓ | ✓ |
| 33 | Review | deleteReview | Remove inappropriate review | ✗ | ✗ | ✓ |
| **Merchant Dashboard Module** |
| 34 | Dashboard | viewSalesStats | View sales statistics | ✗ | ✓ | ✓ |
| 35 | Dashboard | listMyProducts | View own product list | ✗ | ✓ | ✗ |
| 36 | Dashboard | manageInventory | Update stock levels | ✗ | ✓ | ✗ |
| 37 | Dashboard | viewOrdersReceived | See incoming orders | ✗ | ✓ | ✗ |
| **Admin Console Module** |
| 38 | Admin | viewSystemMetrics | Monitor performance | ✗ | ✗ | ✓ |
| 39 | Admin | manageUsers | User administration | ✗ | ✗ | ✓ |
| 40 | Admin | viewAllOrders | Access all orders | ✗ | ✗ | ✓ |

---

## Table 3 – URLs List (Backend API Endpoints)

| No. | API Endpoint | Method | Service | Description | Cache | Auth |
|:---:|-------------|:------:|---------|-------------|:-----:|:----:|
| **Health & System** |
| 1 | /api/health | GET | System | Health check endpoint | No | None |
| 2 | /api/metrics | GET | System | Prometheus metrics | No | None |
| **Product Service** |
| 3 | /api/products | GET | Product | Search/list all products | Yes (1h) | None |
| 4 | /api/products/:id | GET | Product | Get product by ID | Yes (30m) | None |
| 5 | /api/products/:id/reviews | GET | Product | Get product reviews | Yes (30m) | None |
| 6 | /api/products/:id/reviews | POST | Review | Add product review | No | JWT |
| **Category Service** |
| 7 | /api/categories | GET | Category | List all categories | Yes (24h) | None |
| 8 | /api/categories/:id | GET | Category | Get category by ID | Yes (24h) | None |
| 9 | /api/categories/:id/products | GET | Category | Products in category | Yes (1h) | None |
| **Order Service** |
| 10 | /api/orders | POST | Order | Create new order | No | JWT |
| 11 | /api/orders | GET | Order | Get user's orders | No | JWT |
| 12 | /api/orders/:id | GET | Order | Get order details | No | JWT |
| 13 | /api/orders/:id/status | PUT | Order | Update order status | No | JWT |
| 14 | /api/orders/:id/cancel | POST | Order | Cancel order | No | JWT |
| **Authentication Service** |
| 15 | /api/auth/register | POST | Auth | User registration | No | None |
| 16 | /api/auth/login | POST | Auth | User login | No | None |
| 17 | /api/auth/logout | POST | Auth | User logout | No | JWT |
| 18 | /api/auth/profile | GET | Auth | Get user profile | No | JWT |
| 19 | /api/auth/profile | PUT | Auth | Update profile | No | JWT |
| **Merchant Service** |
| 20 | /api/merchant/products | GET | Merchant | Merchant's products | No | JWT |
| 21 | /api/merchant/products | POST | Merchant | Add new product | No | JWT |
| 22 | /api/merchant/products/:id | PUT | Merchant | Update product | No | JWT |
| 23 | /api/merchant/products/:id | DELETE | Merchant | Delete product | No | JWT |
| 24 | /api/merchant/orders | GET | Merchant | Orders for merchant | No | JWT |
| 25 | /api/merchant/stats | GET | Merchant | Sales statistics | No | JWT |

---

## Table 4 – URLs List (API Gateway / Middleware Configuration)

| No. | Middleware | Path Pattern | Layer | Function | Configuration Details |
|:---:|-----------|:------------:|-------|----------|----------------------|
| 1 | cors | /* | Security | CORS handling | origin: *, methods: GET,POST,PUT,DELETE |
| 2 | express.json | /* | Parser | Parse JSON body | limit: 10mb |
| 3 | UTF-8 Charset | /* | Response | Set charset header | Content-Type: application/json; charset=utf-8 |
| 4 | Error Handler | /* | Error | Global error handling | JSON error responses |
| 5 | Request Logger | /* | Logging | Log all requests | Method, URL, response time |
| 6 | Vite Proxy | /api/* | Proxy | Forward to backend | target: http://localhost:3000 |
| 7 | Static Files | /images/* | Static | Serve product images | Public directory |
| 8 | JWT Verify | /api/orders/* | Auth | Validate JWT token | HS256 algorithm |
| 9 | JWT Verify | /api/merchant/* | Auth | Validate merchant JWT | Role check: merchant |
| 10 | Rate Limiter | /api/* | Security | Limit request rate | 100 requests/minute |
| 11 | Redis Cache | /api/products/* | Cache | Cache product queries | TTL: 1 hour |
| 12 | Redis Cache | /api/categories | Cache | Cache category list | TTL: 24 hours |
| 13 | MySQL Pool | /* | Database | Connection pooling | connectionLimit: 10 |
| 14 | Transaction | /api/orders POST | Database | Order transactions | Rollback on error |
| 15 | Graceful Shutdown | SIGTERM | System | Clean shutdown | Close DB and Redis |

---

## Table 5 – URLs List (Frontend Routes)

| No. | Route Path | Component | Page Title | Description | Access Level | Features |
|:---:|-----------|-----------|------------|-------------|:------------:|----------|
| 1 | / | HomePage | 首页 | Product listing with search | Public | Search, categories, product grid |
| 2 | /product/:id | ProductDetailPage | 商品详情 | Single product view | Public | Image, price, add to cart, reviews |
| 3 | /cart | CartPage | 购物车 | Shopping cart management | Public | View items, update qty, checkout |
| 4 | /login | LoginPage | 登录 | User authentication | Public | Login form, register toggle |
| 5 | /register | LoginPage | 注册 | New user registration | Public | Registration form |
| 6 | /orders | OrdersPage | 我的订单 | Order history | Authenticated | Order list, status tracking |
| 7 | /orders/:id | OrderDetailPage | 订单详情 | Single order details | Authenticated | Items, status, timeline |
| 8 | /merchant | MerchantDashboard | 商家后台 | Merchant control panel | Merchant | Stats, product list |
| 9 | /merchant/products | MerchantProducts | 商品管理 | Product management | Merchant | Add, edit, delete products |
| 10 | /merchant/orders | MerchantOrders | 订单管理 | Order processing | Merchant | View, update order status |
| 11 | /categories | CategoriesPage | 商品分类 | Category browsing | Public | Category list, filtering |
| 12 | /categories/:id | CategoryPage | 分类商品 | Products in category | Public | Filtered product grid |
| 13 | /deals | DealsPage | 限时特惠 | Special offers | Public | Discounted products |
| 14 | /search | SearchResultsPage | 搜索结果 | Search results | Public | Filtered results, sorting |
| 15 | /profile | ProfilePage | 个人中心 | User profile | Authenticated | View/edit personal info |
