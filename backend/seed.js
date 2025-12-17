/**
 * 数据库种子脚本 - 插入丰富的示例数据
 * Database Seed Script - Insert comprehensive sample data with proper UTF-8 encoding
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');

// 简单密码哈希 - 与 server.js 保持一致
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');
const defaultPassword = hashPassword('123456'); // 所有测试账户使用 123456 作为密码

async function seedDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3307,
        user: 'storeuser',
        password: 'storepassword',
        database: 'store_db',
        charset: 'utf8mb4'
    });

    console.log('Connected to MySQL');

    try {
        // 先删除现有数据 (按外键依赖顺序)
        await connection.query('DELETE FROM order_items');
        await connection.query('DELETE FROM orders');
        await connection.query('DELETE FROM product_reviews');
        await connection.query('DELETE FROM products');
        await connection.query('DELETE FROM categories');
        await connection.query('DELETE FROM users WHERE id > 0');
        console.log('Cleared existing data');

        // ============ 插入用户 ============
        console.log('\n📝 Inserting users...');

        // 管理员
        await connection.query(`
            INSERT INTO users (email, password_hash, name, role, phone) VALUES
            ('admin@store.com', '${defaultPassword}', '系统管理员', 'admin', '13800000001')
        `);

        // 商家
        const [merchant1] = await connection.query(`
            INSERT INTO users (email, password_hash, name, role, phone) VALUES
            ('shop@electronics.com', '${defaultPassword}', '数码科技旗舰店', 'merchant', '13800000002')
        `);
        const merchantId1 = merchant1.insertId;

        const [merchant2] = await connection.query(`
            INSERT INTO users (email, password_hash, name, role, phone) VALUES
            ('fashion@store.com', '${defaultPassword}', '时尚潮流服饰店', 'merchant', '13800000003')
        `);
        const merchantId2 = merchant2.insertId;

        const [merchant3] = await connection.query(`
            INSERT INTO users (email, password_hash, name, role, phone) VALUES
            ('home@living.com', '${defaultPassword}', '品质家居生活馆', 'merchant', '13800000004')
        `);
        const merchantId3 = merchant3.insertId;

        // 顾客
        const customers = [];
        const customerData = [
            ['zhang@test.com', '张小明', '13900001111'],
            ['li@test.com', '李雨晴', '13900002222'],
            ['wang@test.com', '王建国', '13900003333'],
            ['chen@test.com', '陈美玲', '13900004444'],
            ['liu@test.com', '刘志强', '13900005555'],
            ['zhao@test.com', '赵雅婷', '13900006666']
        ];

        for (const [email, name, phone] of customerData) {
            const [result] = await connection.query(
                `INSERT INTO users (email, password_hash, name, role, phone) VALUES (?, ?, ?, 'customer', ?)`,
                [email, defaultPassword, name, phone]
            );
            customers.push(result.insertId);
        }
        console.log(`✓ Inserted ${3 + customers.length} users`);

        // ============ 插入分类 ============
        console.log('\n📁 Inserting categories...');
        await connection.query(`
            INSERT INTO categories (name, description, sort_order) VALUES
            ('电子产品', '手机、电脑、数码配件等高科技产品', 1),
            ('服装鞋帽', '男装、女装、鞋类、配饰等时尚单品', 2),
            ('家居生活', '家具、家纺、厨房用品等生活必需品', 3),
            ('食品饮料', '零食、饮品、生鲜食品等美味佳品', 4),
            ('运动户外', '运动装备、户外用品、健身器材', 5),
            ('美妆护肤', '护肤品、彩妆、个人护理产品', 6)
        `);
        const [categories] = await connection.query('SELECT id, name FROM categories ORDER BY sort_order');
        console.log(`✓ Inserted ${categories.length} categories`);

        const catElectronics = categories.find(c => c.name === '电子产品').id;
        const catClothing = categories.find(c => c.name === '服装鞋帽').id;
        const catHome = categories.find(c => c.name === '家居生活').id;
        const catFood = categories.find(c => c.name === '食品饮料').id;
        const catSports = categories.find(c => c.name === '运动户外').id;
        const catBeauty = categories.find(c => c.name === '美妆护肤').id;

        // ============ 插入商品 ============
        console.log('\n📦 Inserting products...');

        const products = [];

        // 电子产品 (商家1)
        const electronicsProducts = [
            [merchantId1, catElectronics, '无线蓝牙耳机 Pro Max', '高品质HiFi音效，主动降噪，40小时超长续航，IPX5防水', 299.00, 399.00, 156, 82, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'],
            [merchantId1, catElectronics, '便携式充电宝 20000mAh', '大容量快充，65W超级快充，轻薄设计仅300g', 129.00, 169.00, 324, 156, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop'],
            [merchantId1, catElectronics, '智能手表 Ultra', '血氧监测，心率追踪，GPS定位，7天续航', 899.00, 1299.00, 89, 45, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'],
            [merchantId1, catElectronics, '蓝牙机械键盘', '青轴手感，RGB背光，三模连接，续航60天', 349.00, 449.00, 78, 38, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop'],
            [merchantId1, catElectronics, '游戏鼠标 无线版', '16000DPI超高精度，低延迟无线，人体工学设计', 199.00, 259.00, 145, 67, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop'],
            [merchantId1, catElectronics, '平板电脑 10.9英寸', '2K高清屏，8核处理器，128GB存储，支持手写笔', 1599.00, 1999.00, 56, 28, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop'],
            [merchantId1, catElectronics, '蓝牙音箱 迷你版', '360度环绕立体声，IPX7防水，15小时续航', 159.00, 199.00, 234, 112, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop']
        ];

        for (const p of electronicsProducts) {
            const [result] = await connection.query(`
                INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, sales_count, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, p);
            products.push({ id: result.insertId, ...p });
        }

        // 服装鞋帽 (商家2)
        const clothingProducts = [
            [merchantId2, catClothing, '潮流运动鞋 Air系列', '透气网面，减震科技，百搭时尚，多色可选', 399.00, 599.00, 189, 95, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'],
            [merchantId2, catClothing, '纯棉休闲T恤 经典款', 'A类纯棉，透气舒适，不变形不起球，5色可选', 79.00, 99.00, 567, 289, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
            [merchantId2, catClothing, '修身牛仔裤 男款', '弹力面料，舒适版型，经典蓝色水洗', 189.00, 259.00, 234, 118, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop'],
            [merchantId2, catClothing, '轻薄羽绒服 女款', '90%白鹅绒，轻盈保暖，可收纳便携', 459.00, 699.00, 123, 67, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop'],
            [merchantId2, catClothing, '针织开衫外套', '柔软面料，宽松版型，春秋必备单品', 169.00, 229.00, 189, 78, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop'],
            [merchantId2, catClothing, '真皮皮带 商务款', '头层牛皮，自动扣设计，低调奢华', 129.00, 199.00, 345, 156, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop']
        ];

        for (const p of clothingProducts) {
            const [result] = await connection.query(`
                INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, sales_count, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, p);
            products.push({ id: result.insertId, ...p });
        }

        // 家居生活 (商家3)
        const homeProducts = [
            [merchantId3, catHome, '北欧风台灯 护眼版', 'LED节能灯，五档调光，无频闪护眼', 149.00, 199.00, 123, 56, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop'],
            [merchantId3, catHome, '四件套床品 纯棉', '100%长绒棉，亲肤透气，多种花色可选', 299.00, 399.00, 89, 45, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop'],
            [merchantId3, catHome, '收纳箱三件套', 'PP材质，防潮防尘，可叠放设计', 69.00, 99.00, 456, 234, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'],
            [merchantId3, catHome, '创意装饰画 现代简约', '高清微喷，环保画框，多尺寸可选', 89.00, 129.00, 234, 112, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop'],
            [merchantId3, catHome, '陶瓷餐具套装 16件', '骨瓷材质，简约设计，微波炉可用', 199.00, 299.00, 78, 34, 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop']
        ];

        for (const p of homeProducts) {
            const [result] = await connection.query(`
                INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, sales_count, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, p);
            products.push({ id: result.insertId, ...p });
        }

        // 食品饮料 (商家3)
        const foodProducts = [
            [merchantId3, catFood, '进口咖啡豆 500g', '阿拉比卡豆，中度烘焙，香醇浓郁', 89.00, 119.00, 345, 178, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop'],
            [merchantId3, catFood, '坚果大礼包 混合装', '每日坚果，6种混合，独立包装30袋', 99.00, 149.00, 567, 289, 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400&h=400&fit=crop'],
            [merchantId3, catFood, '有机绿茶 龙井', '明前特级，手工采摘，茶香四溢', 168.00, 238.00, 123, 56, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop'],
            [merchantId3, catFood, '进口巧克力礼盒', '比利时纯可可，丝滑口感，精美包装', 128.00, 168.00, 234, 112, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop']
        ];

        for (const p of foodProducts) {
            const [result] = await connection.query(`
                INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, sales_count, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, p);
            products.push({ id: result.insertId, ...p });
        }

        // 运动户外 (商家1)
        const sportsProducts = [
            [merchantId1, catSports, '瑜伽垫 加厚防滑', 'TPE环保材质，6mm加厚，双面防滑', 79.00, 129.00, 234, 123, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop'],
            [merchantId1, catSports, '哑铃套装 可调节', '包胶材质，2-20kg可调，家用健身必备', 299.00, 399.00, 89, 45, 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop']
        ];

        for (const p of sportsProducts) {
            const [result] = await connection.query(`
                INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, sales_count, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, p);
            products.push({ id: result.insertId, ...p });
        }

        // 美妆护肤 (商家2)
        const beautyProducts = [
            [merchantId2, catBeauty, '补水面膜 玻尿酸', '深层补水，舒缓修护，10片装', 59.00, 89.00, 678, 345, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop'],
            [merchantId2, catBeauty, '防晒霜 SPF50+', '清爽不油腻，防水防汗，全身可用', 89.00, 129.00, 345, 178, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop']
        ];

        for (const p of beautyProducts) {
            const [result] = await connection.query(`
                INSERT INTO products (merchant_id, category_id, name, description, price, original_price, stock, sales_count, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, p);
            products.push({ id: result.insertId, ...p });
        }

        console.log(`✓ Inserted ${products.length} products`);

        // ============ 插入商品评价 ============
        console.log('\n💬 Inserting product reviews...');

        const reviews = [
            // 电子产品评价
            [products[0].id, customers[0], 5, '音质非常棒，降噪效果超出预期！戴着很舒服，续航也给力。'],
            [products[0].id, customers[1], 5, '用了一周了，每天通勤必备，降噪开启后世界都安静了～'],
            [products[0].id, customers[2], 4, '整体不错，就是充电盒有点大，其他都很满意'],
            [products[1].id, customers[3], 5, '充电速度很快，出差必备神器！'],
            [products[1].id, customers[4], 5, '性价比超高，可以给手机充3次，推荐购买'],
            [products[2].id, customers[5], 4, '功能很全面，就是表带有点硬，需要适应几天'],
            [products[3].id, customers[0], 5, '手感绝了！青轴打字很爽，RGB灯效也很酷'],
            [products[5].id, customers[1], 5, '屏幕清晰度很高，玩游戏看视频都很棒'],

            // 服装评价
            [products[7].id, customers[2], 5, '鞋子很舒服，跑步逛街都很合适，颜值也高'],
            [products[8].id, customers[3], 5, '纯棉质量真的好，洗了几次都不变形'],
            [products[8].id, customers[4], 4, '衣服不错，就是码数偏小，建议买大一号'],
            [products[10].id, customers[5], 5, '羽绒服很轻便，但是保暖效果杠杠的！'],

            // 家居评价
            [products[13].id, customers[0], 5, '台灯很护眼，熬夜加班必备'],
            [products[14].id, customers[1], 5, '床品质量超好，睡眠质量都提升了'],
            [products[15].id, customers[2], 4, '收纳箱挺实用的，就是稍微有点味道，晾几天就好了'],

            // 食品评价
            [products[18].id, customers[3], 5, '咖啡豆很新鲜，香味浓郁，每天早上一杯超满足'],
            [products[19].id, customers[4], 5, '坚果很新鲜，独立包装方便携带，办公室必备零食'],
            [products[19].id, customers[5], 4, '口味不错，就是分量可以再多一点'],

            // 运动评价
            [products[22].id, customers[0], 5, '瑜伽垫防滑效果很好，做瑜伽很稳'],
            [products[23].id, customers[1], 5, '哑铃手感不错，在家健身很方便']
        ];

        for (const [productId, userId, rating, comment] of reviews) {
            await connection.query(`
                INSERT INTO product_reviews (product_id, user_id, rating, content)
                VALUES (?, ?, ?, ?)
            `, [productId, userId, rating, comment]);
        }
        console.log(`✓ Inserted ${reviews.length} product reviews`);

        // ============ 插入订单 ============
        console.log('\n🛒 Inserting orders...');

        const orderData = [
            { userId: customers[0], status: 'delivered', items: [[products[0].id, 1, 299.00], [products[1].id, 1, 129.00]] },
            { userId: customers[1], status: 'delivered', items: [[products[8].id, 2, 79.00], [products[11].id, 1, 169.00]] },
            { userId: customers[2], status: 'delivered', items: [[products[7].id, 1, 399.00]] },
            { userId: customers[3], status: 'shipped', items: [[products[18].id, 2, 89.00], [products[19].id, 1, 99.00]] },
            { userId: customers[4], status: 'paid', items: [[products[14].id, 1, 299.00], [products[13].id, 1, 149.00]] },
            { userId: customers[5], status: 'pending', items: [[products[2].id, 1, 899.00]] },
            { userId: customers[0], status: 'delivered', items: [[products[22].id, 1, 79.00], [products[23].id, 1, 299.00]] },
            { userId: customers[1], status: 'delivered', items: [[products[10].id, 1, 459.00]] },
            { userId: customers[2], status: 'shipped', items: [[products[24].id, 3, 59.00], [products[25].id, 1, 89.00]] }
        ];

        let orderCount = 0;
        for (const order of orderData) {
            const totalAmount = order.items.reduce((sum, [, qty, price]) => sum + qty * price, 0);
            const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            const [orderResult] = await connection.query(`
                INSERT INTO orders (order_no, user_id, total_amount, status)
                VALUES (?, ?, ?, ?)
            `, [orderNo, order.userId, totalAmount, order.status]);

            const orderId = orderResult.insertId;

            for (const [productId, quantity, price] of order.items) {
                const [productInfo] = await connection.query('SELECT name FROM products WHERE id = ?', [productId]);
                await connection.query(`
                    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [orderId, productId, productInfo[0].name, price, quantity, price * quantity]);
            }
            orderCount++;
        }
        console.log(`✓ Inserted ${orderCount} orders with items`);

        // ============ 验证数据 ============
        console.log('\n📊 Database summary:');
        const [[userCount]] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [[productCount]] = await connection.query('SELECT COUNT(*) as count FROM products');
        const [[categoryCount]] = await connection.query('SELECT COUNT(*) as count FROM categories');
        const [[reviewCount]] = await connection.query('SELECT COUNT(*) as count FROM product_reviews');
        const [[ordersCount]] = await connection.query('SELECT COUNT(*) as count FROM orders');

        console.log(`  Users: ${userCount.count}`);
        console.log(`  Categories: ${categoryCount.count}`);
        console.log(`  Products: ${productCount.count}`);
        console.log(`  Reviews: ${reviewCount.count}`);
        console.log(`  Orders: ${ordersCount.count}`);

        console.log('\n✅ 数据库种子数据插入成功！');
        console.log('   测试账户：');
        console.log('   - 顾客: zhang@test.com / 任意密码');
        console.log('   - 商家: shop@electronics.com / 任意密码');
        console.log('   - 管理员: admin@store.com / 任意密码');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

seedDatabase();
