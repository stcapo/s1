一、系统角色（决定页面可见性）

End User（普通用户 / 顾客）

Merchant（商家）

System Admin（系统管理员）

二、页面总体结构总览（Site Map 级别）

系统页面按三大门户划分：

客户端门户（Customer Portal）

商家后台（Merchant Dashboard）

管理员后台（Admin Console）

三、Customer Portal（顾客端页面 & 功能）
1. 首页（Home Page）

功能：

商品分类入口展示（Categories Overview）

热销商品 / Top Products（Redis 缓存 Top 20）

搜索框（Product Search Entry）

Banner / Promotion 展示

CDN 加载静态资源

2. 商品分类页（Category Page）

功能：

按分类浏览商品

分页 / 无限滚动

排序（价格 / 热度 / 新品）

懒加载商品图片（Lazy Load）

3. 商品搜索结果页（Search Result Page）

功能：

关键词搜索商品（Redis + MySQL）

缓存命中 / 回源查询

搜索结果分页

搜索性能 < 1s

4. 商品详情页（Product Detail Page）

功能：

商品基本信息（名称 / 价格 / 库存）

商品图片（WebP + CDN）

商品描述与规格

用户评论列表（Product Reviews）

添加到购物车

5. 购物车页面（Cart Page）

功能：

查看购物车商品列表

修改商品数量

删除商品

实时价格计算

校验库存

6. 结算页面（Checkout Page）

功能：

填写 / 选择收货地址

选择支付方式（PayPal / Credit Card）

应用优惠码（Extend Use Case）

下单确认

7. 支付处理页（Payment Processing / Redirect）

功能：

第三方支付网关交互

支付状态回调

失败重试机制

8. 订单确认页（Order Confirmation Page）

功能：

显示订单号

显示订单摘要

触发异步通知（Email / SMS）

9. 我的订单页（My Orders Page）

功能：

查看历史订单

订单状态追踪

订单详情查看

申请退款（触发扩展用例）

10. 用户中心（User Profile Page）

功能：

用户基本信息管理

地址管理（Multiple Addresses）

查看账号安全状态

11. 登录 / 注册页面（Auth Pages）

功能：

用户注册

登录 / 登出

JWT 鉴权

四、Merchant Dashboard（商家后台页面 & 功能）
12. 商家后台首页（Merchant Dashboard Home）

功能：

今日订单数量

今日销售额

热销商品统计

库存预警提示

13. 商品管理页（Product Management Page）

功能：

新增商品

编辑商品

删除 / 下架商品

上传商品图片（S3）

设置价格与库存

14. 库存管理页（Inventory Management Page）

功能：

查看库存状态

设置库存阈值

低库存预警（Inventory Alerts）

15. 订单管理页（Order Management Page）

功能：

查看订单列表

修改订单状态（Pending / Paid / Shipped / Refunded）

生成物流信息

处理退款（Extend Use Case）

16. 客户支持页面（Customer Support Page）

功能：

查看用户咨询

回复用户问题

查看退款原因

17. 销售分析页（Sales Analytics Page）

功能：

日 / 周 / 月销售统计

商品销量排行

图表展示（Chart.js）

五、Admin Console（系统管理员页面 & 功能）
18. 管理员首页（Admin Dashboard）

功能：

系统整体运行状态

并发用户数

错误率总览

19. 用户与商家管理页（User & Merchant Management）

功能：

审核商家账号

冻结 / 解封用户

角色权限管理（RBAC）

20. 性能监控页面（Performance Monitoring Page）

功能：

API 响应时间

页面加载时间

数据库查询延迟

Redis 命中率

21. 告警配置页面（Alert Configuration Page）

功能：

设置告警阈值

配置通知方式（Email / SMS）

管理告警规则

22. 系统配置页面（System Configuration）

功能：

第三方服务配置（支付 / 邮件 / 短信）

SSL / 安全设置

环境变量管理

23. 数据备份与恢复页面（Backup Management）

功能：

查看数据库备份状态

手动触发备份

恢复数据

六、跨页面支撑型功能（非独立页面）

这些功能在文中多次出现，但不对应单一页面：

JWT 鉴权与权限控制

Redis 多级缓存

CDN 静态资源分发

异步任务队列（BullMQ）

日志与指标采集（Prometheus）

自动扩缩容（Auto Scaling）

七、最终统计汇总

页面总数（可视页面）：≈ 23 个

核心业务页面：≈ 15 个

后台管理页面：≈ 8 个

支撑型系统功能模块：≈ 10+ 个

该清单可 直接用于：

PRD 页面结构设计

原型图（Figma / Axure）

前端路由设计（React Router）

后端接口拆分（REST API / Microservices）