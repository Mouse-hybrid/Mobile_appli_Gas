// src/utils/auth.js
const { GraphQLError } = require('graphql');

// Chặn những ai chưa có Token (chưa đăng nhập)
const requireAuth = (user) => {
    if (!user) {
        throw new GraphQLError('Bạn chưa đăng nhập hoặc Token đã hết hạn!', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }
    return user; // Trả về thông tin user để dùng tiếp
};

// Chặn những ai không phải là Admin
const requireAdmin = (user) => {
    // Gọi hàm requireAuth trước để chắc chắn họ đã đăng nhập
    requireAuth(user);
    
    if (user.role !== 'Admin') {
        throw new GraphQLError('Truy cập bị từ chối! Chỉ Admin mới có quyền này.', {
            extensions: { code: 'FORBIDDEN' }
        });
    }
    return user;
};

module.exports = { requireAuth, requireAdmin };