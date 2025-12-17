/**
 * 小型网店信息系统 - 后端服务
 * Small Online Store Information System - Backend Server
 * 
 * Based on Master's Thesis Architecture:
 * - Node.js + Express (Application Layer)
 * - MySQL (Data Layer)
 * - Redis (Caching Layer)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// 简单密码哈希 (Simple hash for development - use bcrypt in production)
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ 中间件配置 (Middleware) ============
app.use(cors());
app.use(express.json());

// 确保所有响应使用 UTF-8 编码
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// ============ 数据库连接 (Database Connections) ============

// MySQL Connection Pool (Master-Slave concept simplified to single pool)
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'storeuser',
    password: process.env.DB_PASSWORD || 'storepassword',
    database: process.env.DB_NAME || 'store_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    // Force UTF-8 encoding for all string data
    typeCast: function (field, next) {
        if (field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'VARCHAR') {
            return field.string('utf8');
        }
        return next();
    }
});

// Redis Client (Cache Layer per thesis Section 1.2.1)
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis 连接错误:', err));
redisClient.on('connect', () => console.log('✓ Redis 缓存已连接'));

// ============ 初始化 (Initialization) ============
async function initializeConnections() {
    try {
        // Test MySQL and set character encoding
        const connection = await dbPool.getConnection();
        await connection.query("SET NAMES 'utf8mb4'");
        await connection.query("SET CHARACTER SET utf8mb4");
        await connection.query("SET character_set_connection = utf8mb4");
        console.log('✓ MySQL 数据库已连接 (UTF-8)');
        connection.release();

        // Connect Redis
        await redisClient.connect();
    } catch (err) {
        console.error('数据库连接错误:', err.message);
        console.log('提示: 请确保 Docker 容器正在运行 (docker-compose up -d)');
    }
}

initializeConnections();

// ============ API 路由 (API Routes) ============

// 健康检查 (Health Check)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: '小型网店信息系统',
        timestamp: new Date().toISOString()
    });
});

// ============ 商品服务 (Product Service) ============

/**
 * 搜索商品 - 带 Redis 缓存
 * Product Search with Redis Caching (Thesis Section 1.2.2)
 * 
 * Cache Strategy:
 * - Cache Hit: Return in ~10ms
 * - Cache Miss: Query DB, cache result, return in ~50-100ms
 * - TTL: 1 hour (3600 seconds)
 */
app.get('/api/products', async (req, res) => {
    const { q = '', category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const cacheKey = `products:search:${q}:${category || 'all'}:${page}:${limit}`;

    const startTime = Date.now();

    try {
        // 1. 检查缓存 (Check Cache)
        if (redisClient.isReady) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                const responseTime = Date.now() - startTime;
                console.log(`[缓存命中] 搜索: "${q}" - ${responseTime}ms`);
                return res.json({
                    ...JSON.parse(cached),
                    cached: true,
                    responseTime: `${responseTime}ms`
                });
            }
        }

        // 2. 查询数据库 (Query Database)
        let sql = `
            SELECT p.id, p.name, p.description, p.price, p.original_price, 
                   p.stock, p.image_url, p.sales_count, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
        `;
        const params = [];

        if (q) {
            sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
            params.push(`%${q}%`, `%${q}%`);
        }

        if (category) {
            sql += ` AND p.category_id = ?`;
            params.push(category);
        }

        sql += ` ORDER BY p.sales_count DESC, p.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [products] = await dbPool.query(sql, params);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM products WHERE status = 'active'`;
        const countParams = [];
        if (q) {
            countSql += ` AND (name LIKE ? OR description LIKE ?)`;
            countParams.push(`%${q}%`, `%${q}%`);
        }
        if (category) {
            countSql += ` AND category_id = ?`;
            countParams.push(category);
        }
        const [[{ total }]] = await dbPool.query(countSql, countParams);

        const result = {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        // 3. 更新缓存 (Update Cache) - TTL 1 hour
        if (redisClient.isReady) {
            await redisClient.set(cacheKey, JSON.stringify(result), { EX: 3600 });
        }

        const responseTime = Date.now() - startTime;
        console.log(`[数据库查询] 搜索: "${q}" - ${responseTime}ms`);

        res.json({
            ...result,
            cached: false,
            responseTime: `${responseTime}ms`
        });

    } catch (error) {
        console.error('商品搜索错误:', error);
        res.status(500).json({ error: '搜索失败，请稍后重试' });
    }
});

// 获取商品详情 (Get Product Detail)
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const cacheKey = `product:${id}`;

    try {
        // Check cache
        if (redisClient.isReady) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return res.json({ ...JSON.parse(cached), cached: true });
            }
        }

        const [products] = await dbPool.query(`
            SELECT p.*, c.name as category_name, u.name as merchant_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.merchant_id = u.id
            WHERE p.id = ? AND p.status = 'active'
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ error: '商品不存在' });
        }

        // Get reviews
        const [reviews] = await dbPool.query(`
            SELECT r.*, u.name as user_name
            FROM product_reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [id]);

        const result = { product: products[0], reviews };

        // Cache for 30 minutes
        if (redisClient.isReady) {
            await redisClient.set(cacheKey, JSON.stringify(result), { EX: 1800 });
        }

        res.json(result);

    } catch (error) {
        console.error('获取商品详情错误:', error);
        res.status(500).json({ error: '获取商品信息失败' });
    }
});

// 获取分类列表 (Get Categories)
app.get('/api/categories', async (req, res) => {
    const cacheKey = 'categories:all';

    try {
        if (redisClient.isReady) {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
        }

        const [categories] = await dbPool.query(`
            SELECT id, name, parent_id, description, sort_order
            FROM categories
            ORDER BY sort_order ASC, id ASC
        `);

        if (redisClient.isReady) {
            await redisClient.set(cacheKey, JSON.stringify(categories), { EX: 86400 }); // 24h
        }

        res.json(categories);

    } catch (error) {
        console.error('获取分类错误:', error);
        res.status(500).json({ error: '获取分类失败' });
    }
});

// ============ 订单服务 (Order Service) ============

// 创建订单 (Create Order)
app.post('/api/orders', async (req, res) => {
    const { userId, items, addressId, paymentMethod } = req.body;

    if (!userId || !items || items.length === 0) {
        return res.status(400).json({ error: '订单信息不完整' });
    }

    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. 验证库存并计算总价 (Verify stock and calculate total)
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const [[product]] = await connection.query(
                'SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE',
                [item.productId]
            );

            if (!product) {
                throw new Error(`商品 ID ${item.productId} 不存在`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`商品 "${product.name}" 库存不足`);
            }

            const subtotal = product.price * item.quantity;
            totalAmount += subtotal;

            orderItems.push({
                productId: product.id,
                productName: product.name,
                productPrice: product.price,
                quantity: item.quantity,
                subtotal
            });

            // 2. 扣减库存 (Deduct stock)
            await connection.query(
                'UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?',
                [item.quantity, item.quantity, item.productId]
            );
        }

        // 3. 生成订单号 (Generate order number)
        const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // 4. 创建订单 (Create order)
        const [orderResult] = await connection.query(`
            INSERT INTO orders (order_no, user_id, total_amount, shipping_address_id, payment_method)
            VALUES (?, ?, ?, ?, ?)
        `, [orderNo, userId, totalAmount, addressId, paymentMethod]);

        const orderId = orderResult.insertId;

        // 5. 创建订单明细 (Create order items)
        for (const item of orderItems) {
            await connection.query(`
                INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, item.productId, item.productName, item.productPrice, item.quantity, item.subtotal]);
        }

        await connection.commit();

        // Invalidate product cache
        if (redisClient.isReady) {
            for (const item of items) {
                await redisClient.del(`product:${item.productId}`);
            }
        }

        console.log(`[订单创建] 订单号: ${orderNo}, 金额: ¥${totalAmount}`);

        res.status(201).json({
            success: true,
            message: '订单创建成功',
            order: {
                id: orderId,
                orderNo,
                totalAmount,
                status: 'pending'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('创建订单错误:', error);
        res.status(400).json({ error: error.message || '创建订单失败' });
    } finally {
        connection.release();
    }
});

// 获取用户订单列表 (Get User Orders)
app.get('/api/orders', async (req, res) => {
    const { userId, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!userId) {
        return res.status(400).json({ error: '用户ID不能为空' });
    }

    try {
        let sql = `
            SELECT o.*, COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
        `;
        const params = [userId];

        if (status) {
            sql += ` AND o.status = ?`;
            params.push(status);
        }

        sql += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await dbPool.query(sql, params);

        res.json({ orders });

    } catch (error) {
        console.error('获取订单列表错误:', error);
        res.status(500).json({ error: '获取订单失败' });
    }
});

// ============ 用户服务 (User Service) ============

// 用户注册 (Register)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: '请填写完整信息' });
    }

    try {
        const passwordHash = hashPassword(password);

        const [result] = await dbPool.query(`
            INSERT INTO users (email, password_hash, name, phone)
            VALUES (?, ?, ?, ?)
        `, [email, passwordHash, name, phone]);

        res.status(201).json({
            success: true,
            message: '注册成功',
            userId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
});

// 用户登录 (Login)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: '请输入邮箱和密码' });
    }

    try {
        const [[user]] = await dbPool.query(
            'SELECT id, email, password_hash, name, role FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        const valid = hashPassword(password) === user.password_hash;

        if (!valid) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: '登录成功',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
});

// ============ 商家服务 (Merchant Service) ============

// 获取商家商品列表 (Get Merchant Products)
app.get('/api/merchant/products', async (req, res) => {
    const { merchantId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!merchantId) {
        return res.status(400).json({ error: '商家ID不能为空' });
    }

    try {
        const [products] = await dbPool.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.merchant_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [merchantId, parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await dbPool.query(
            'SELECT COUNT(*) as total FROM products WHERE merchant_id = ?',
            [merchantId]
        );

        res.json({
            products,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });

    } catch (error) {
        console.error('获取商家商品错误:', error);
        res.status(500).json({ error: '获取商品列表失败' });
    }
});

// 添加商品 (Add Product)
app.post('/api/merchant/products', async (req, res) => {
    const { merchantId, categoryId, name, description, price, originalPrice, stock, imageUrl } = req.body;

    if (!merchantId || !name || !price) {
        return res.status(400).json({ error: '请填写必要的商品信息' });
    }

    try {
        const [result] = await dbPool.query(`
            INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [merchantId, categoryId, name, description, price, originalPrice, stock || 0, imageUrl]);

        // Invalidate search cache
        if (redisClient.isReady) {
            const keys = await redisClient.keys('products:search:*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        }

        res.status(201).json({
            success: true,
            message: '商品添加成功',
            productId: result.insertId
        });

    } catch (error) {
        console.error('添加商品错误:', error);
        res.status(500).json({ error: '添加商品失败' });
    }
});

// 更新商品 (Update Product)
app.put('/api/merchant/products/:id', async (req, res) => {
    const { id } = req.params;
    const { merchantId, categoryId, name, description, price, originalPrice, stock, imageUrl, status } = req.body;

    if (!merchantId) {
        return res.status(400).json({ error: '商家ID不能为空' });
    }

    try {
        // 验证商品属于该商家
        const [[product]] = await dbPool.query(
            'SELECT id FROM products WHERE id = ? AND merchant_id = ?',
            [id, merchantId]
        );

        if (!product) {
            return res.status(404).json({ error: '商品不存在或无权限' });
        }

        await dbPool.query(`
            UPDATE products SET
                category_id = COALESCE(?, category_id),
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                original_price = COALESCE(?, original_price),
                stock = COALESCE(?, stock),
                image_url = COALESCE(?, image_url),
                status = COALESCE(?, status)
            WHERE id = ? AND merchant_id = ?
        `, [categoryId, name, description, price, originalPrice, stock, imageUrl, status, id, merchantId]);

        // Invalidate cache
        if (redisClient.isReady) {
            await redisClient.del(`product:${id}`);
            const keys = await redisClient.keys('products:search:*');
            if (keys.length > 0) await redisClient.del(keys);
        }

        res.json({ success: true, message: '商品更新成功' });

    } catch (error) {
        console.error('更新商品错误:', error);
        res.status(500).json({ error: '更新商品失败' });
    }
});

// 删除商品 (Delete Product)
app.delete('/api/merchant/products/:id', async (req, res) => {
    const { id } = req.params;
    const { merchantId } = req.query;

    if (!merchantId) {
        return res.status(400).json({ error: '商家ID不能为空' });
    }

    try {
        // 验证商品属于该商家
        const [[product]] = await dbPool.query(
            'SELECT id FROM products WHERE id = ? AND merchant_id = ?',
            [id, merchantId]
        );

        if (!product) {
            return res.status(404).json({ error: '商品不存在或无权限' });
        }

        // 软删除：改为 inactive 状态
        await dbPool.query(
            "UPDATE products SET status = 'inactive' WHERE id = ?",
            [id]
        );

        // Invalidate cache
        if (redisClient.isReady) {
            await redisClient.del(`product:${id}`);
            const keys = await redisClient.keys('products:search:*');
            if (keys.length > 0) await redisClient.del(keys);
        }

        res.json({ success: true, message: '商品删除成功' });

    } catch (error) {
        console.error('删除商品错误:', error);
        res.status(500).json({ error: '删除商品失败' });
    }
});

// ============ 用户地址管理 (User Address Management) ============

// 获取用户地址列表
app.get('/api/addresses', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: '用户ID不能为空' });
    }

    try {
        const [addresses] = await dbPool.query(
            `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
            [userId]
        );
        res.json({ addresses });
    } catch (error) {
        console.error('获取地址错误:', error);
        res.status(500).json({ error: '获取地址失败' });
    }
});

// 添加新地址
app.post('/api/addresses', async (req, res) => {
    const { userId, recipientName, phone, province, city, district, address, isDefault } = req.body;

    if (!userId || !recipientName || !phone || !address) {
        return res.status(400).json({ error: '请填写完整的地址信息' });
    }

    try {
        // 如果设为默认地址，先取消其他默认
        if (isDefault) {
            await dbPool.query(
                `UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`,
                [userId]
            );
        }

        const [result] = await dbPool.query(
            `INSERT INTO user_addresses (user_id, recipient_name, phone, province, city, district, address, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, recipientName, phone, province || '', city || '', district || '', address, isDefault || false]
        );

        res.status(201).json({
            success: true,
            message: '地址添加成功',
            addressId: result.insertId
        });
    } catch (error) {
        console.error('添加地址错误:', error);
        res.status(500).json({ error: '添加地址失败' });
    }
});

// 删除地址
app.delete('/api/addresses/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    try {
        await dbPool.query(
            `DELETE FROM user_addresses WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        res.json({ success: true, message: '地址删除成功' });
    } catch (error) {
        console.error('删除地址错误:', error);
        res.status(500).json({ error: '删除地址失败' });
    }
});

// ============ 用户信息管理 (User Profile) ============

// 获取用户信息
app.get('/api/auth/profile', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: '用户ID不能为空' });
    }

    try {
        const [[user]] = await dbPool.query(
            `SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?`,
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({ user });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
});

// 更新用户信息
app.put('/api/auth/profile', async (req, res) => {
    const { userId, name, phone } = req.body;

    if (!userId) {
        return res.status(400).json({ error: '用户ID不能为空' });
    }

    try {
        await dbPool.query(
            `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`,
            [name, phone, userId]
        );

        res.json({ success: true, message: '用户信息更新成功' });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ error: '更新用户信息失败' });
    }
});

// ============ 商家订单管理 (Merchant Order Management) ============

// 获取商家订单列表
app.get('/api/merchant/orders', async (req, res) => {
    const { merchantId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!merchantId) {
        return res.status(400).json({ error: '商家ID不能为空' });
    }

    try {
        let sql = `
            SELECT DISTINCT o.id, o.order_no, o.total_amount, o.status, o.created_at,
                   u.name as customer_name, u.phone as customer_phone,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
            FROM orders o
            JOIN order_items oi2 ON o.id = oi2.order_id
            JOIN products p ON oi2.product_id = p.id
            JOIN users u ON o.user_id = u.id
            WHERE p.merchant_id = ?
        `;
        const params = [merchantId];

        if (status) {
            sql += ` AND o.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await dbPool.query(sql, params);

        // Get total count
        const [[{ total }]] = await dbPool.query(
            `SELECT COUNT(DISTINCT o.id) as total
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id
             WHERE p.merchant_id = ?` + (status ? ` AND o.status = ?` : ''),
            status ? [merchantId, status] : [merchantId]
        );

        res.json({
            orders,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        console.error('获取商家订单错误:', error);
        res.status(500).json({ error: '获取订单失败' });
    }
});

// 更新订单状态
app.put('/api/merchant/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, merchantId } = req.body;

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: '无效的订单状态' });
    }

    try {
        // 验证订单属于该商家
        const [[order]] = await dbPool.query(
            `SELECT DISTINCT o.id FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id
             WHERE o.id = ? AND p.merchant_id = ?`,
            [id, merchantId]
        );

        if (!order) {
            return res.status(404).json({ error: '订单不存在或无权限' });
        }

        await dbPool.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);

        res.json({ success: true, message: '订单状态更新成功' });
    } catch (error) {
        console.error('更新订单状态错误:', error);
        res.status(500).json({ error: '更新订单状态失败' });
    }
});

// ============ 启动服务器 (Start Server) ============
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║         小型网店信息系统 - 后端服务已启动                 ║
║         Small Online Store Information System            ║
╠══════════════════════════════════════════════════════════╣
║  端口: ${PORT}                                              ║
║  API: http://localhost:${PORT}/api                          ║
║  健康检查: http://localhost:${PORT}/api/health              ║
╚══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('正在关闭服务器...');
    await redisClient.quit();
    await dbPool.end();
    process.exit(0);
});
