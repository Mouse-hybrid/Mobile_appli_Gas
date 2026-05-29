const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo pool kết nối để chịu tải tốt hơn khi có nhiều request GPS
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test kết nối thử khi khởi động
pool.getConnection()
    .then((conn) => {
        console.log('✅ Đã kết nối thành công tới MySQL Database!');
        conn.release();
    })
    .catch((err) => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

module.exports = pool;