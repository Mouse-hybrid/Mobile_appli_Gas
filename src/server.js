// src/server.js
const { File } = require('buffer');
globalThis.File = File;
const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const db = require('./config/db'); // 🌟 MỚI: Import kết nối DB phục vụ cổng REST API verify
const { startCronJobs } = require('./services/cronService');
require('./services/fuelScraper');

const app = express();
const PORT = process.env.PORT || 6500;

const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    introspection: true, 
    plugins: [ApolloServerPluginLandingPageLocalDefault({ footer: false, embed: true })] 
});

async function startServer() {
    await server.start();

    // 🌟 MỚI INTEGRATED: ENDPOINT REST API TIẾP NHẬN XÁC THỰC MAIL PREMIUM & REDIRECT
    app.get('/api/verify-premium', async (req, res) => {
        const { token } = req.query;
        if (!token) return res.status(400).send('Mã Token xác thực không hợp lệ!');

        try {
            // 1. Kiểm tra Token xem có trùng khớp với hóa đơn giao dịch Pending nào không
            const [transactions] = await db.execute(
                `SELECT pt.*, sp.duration_days, sp.plan_name 
                 FROM payment_transactions pt
                 JOIN subscription_plans sp ON pt.plan_id = sp.id
                 WHERE pt.token = ? AND pt.status = 'Pending'`,
                [token]
            );

            if (transactions.length === 0) {
                return res.status(400).send('Mã xác thực đã hết hạn hoặc giao dịch này đã được xử lý!');
            }

            const transaction = transactions[0];
            const userId = transaction.user_id;
            const daysToAdd = transaction.duration_days;

            // 2. Chốt cập nhật hóa đơn giao dịch thành công (Success)
            await db.execute('UPDATE payment_transactions SET status = "Success", paid_at = CURRENT_TIMESTAMP WHERE id = ?', [transaction.id]);

            // 3. Kích hoạt tính toán thời hạn cộng dồn vào cột premium_valid_until của bảng users
            await db.execute('UPDATE users SET premium_valid_until = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY) WHERE id = ?', [daysToAdd, userId]);

            // 4. Tạo thông báo chúc mừng hiển thị trên thanh Notification hệ thống
            await db.execute(
                `INSERT INTO notifications (user_id, type, title, message, is_read) 
                 VALUES (?, 'System', '🎉 Nâng cấp Premium thành công!', ?, 0)`,
                [userId, `Tài khoản của bạn đã được gia hạn gói ${transaction.plan_name} thêm ${daysToAdd} ngày.`]
            );

            console.log(`[PREMIUM] Đã xử lý nâng cấp gói thành công cho User ID: ${userId}`);

            // 5. ĐIỀU HƯỚNG QUAY TRỞ VỀ TRANG CHỦ (HTTP REDIRECT) ĐÚNG YÊU CẦU UX
            return res.redirect('http://localhost:5173/');

        } catch (error) {
            console.error("Lỗi hệ thống khi kích hoạt Premium:", error.message);
            return res.status(500).send('Có lỗi xảy ra trong quá trình xử lý kích hoạt gói cước Premium!');
        }
    });

    // Middleware cho Apollo Server tại endpoint /graphql
    app.use(
        '/graphql', 
        cors(), 
        express.json(), 
        (req, res, next) => {
            if (req.body === undefined) {
                req.body = {};
            }
            next();
        },
        expressMiddleware(server, {
            context: async ({ req }) => {
                const token = (req.headers.authorization || '').replace('Bearer ', '');
                try {
                    return { user: token ? jwt.verify(token, process.env.JWT_SECRET) : null };
                } catch (err) {
                    return { user: null };
                }
            }
        })
    );

    // Khởi chạy HTTPS
    try {
        const sslOptions = {
            key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
            cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.cert'))
        };

        const httpServer = https.createServer(sslOptions, app);
        
        httpServer.listen(PORT, () => {
            console.log(`🚀 HTTPS Server tại: https://localhost:${PORT}/graphql`);
            console.log('🤖 Đang đánh thức hệ thống Robot (Cron Jobs)...');
            startCronJobs();
        });

        process.on('SIGUSR2', () => {
            httpServer.close();
            process.exit();
        });

    } catch (err) {
        console.error('Lỗi khởi động:', err.message);
    }
}

startServer().catch(err => console.error(err));