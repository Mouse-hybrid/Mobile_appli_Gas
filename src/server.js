
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

    // Middleware cho Apollo Server tại endpoint /graphql
    app.use(
        '/graphql', 
        cors(), 
        express.json(), 
        (req, res, next) => {
            // TUYỆT CHIÊU: Nếu express.json() bỏ qua và req.body vẫn undefined (như khi mở bằng trình duyệt)
            // Ta ép nó thành một object rỗng để Apollo Server không bị crash và chịu nhả giao diện ra.
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

        // Đảm bảo nodemon tắt server sạch sẽ, không bị treo cổng*
        process.on('SIGUSR2', () => {
            httpServer.close();
            process.exit();
        });

    } catch (err) {
        console.error('Lỗi khởi động:', err.message);
    }
}

startServer().catch(err => console.error(err));