// src/services/cronService.js
const cron = require('node-cron');
const db = require('../config/db');

const startCronJobs = () => {
    console.log('🤖 Hệ thống Cron Job đã được kích hoạt. Chờ đến lịch trình...');

    // Lên lịch chạy vào đúng 00:00 (Nửa đêm) mỗi ngày
    // Cú pháp cron: 'Phút Giờ Ngày_trong_tháng Tháng Ngày_trong_tuần'
    // Mẹo: Nếu bạn muốn test ngay lập tức, hãy đổi '0 0 * * *' thành '* * * * *' (chạy mỗi 1 phút)
    cron.schedule('0 0 * * *', async () => {
        console.log('\n🤖 [CRON JOB - 00:00] Bắt đầu quét các xe cần bảo dưỡng...');
        
        try {
            // Giả định mốc bảo dưỡng mặc định là mỗi 1500km
            // Câu lệnh này quét các xe có ODO >= 1500km
            const [vehicles] = await db.execute(
                'SELECT id, user_id, plate_number, current_odo_km FROM user_vehicles WHERE current_odo_km >= 1500'
            );

            if (vehicles.length === 0) {
                console.log('✅ [CRON JOB] Trạng thái ổn định: Không có xe nào cần bảo dưỡng hôm nay.');
                return;
            }

            console.log(`🔍 [CRON JOB] Phát hiện ${vehicles.length} xe cần bảo dưỡng. Đang xử lý thông báo...`);

            for (const vehicle of vehicles) {
                // TẠO THÔNG BÁO VÀ CHÈN VÀO DATABASE
                const title = 'Nhắc nhở bảo dưỡng định kỳ';
                const message = `Xe biển số ${vehicle.plate_number} của bạn đã đạt mốc ${vehicle.current_odo_km} km. Vui lòng sắp xếp thay nhớt để đảm bảo động cơ hoạt động tốt nhất!`;

                // Câu lệnh chèn vào bảng thông báo (Giả sử bạn có bảng notifications)
                // Lưu ý: Nếu Database chưa có bảng notifications, bạn cần tạo nó trong file SQL
                await db.execute(
                    'INSERT INTO notifications (user_id, vehicle_id, title, message, is_read, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)',
                    [vehicle.user_id, vehicle.id, title, message]
                );

                console.log(`✅ [CRON JOB] Đã bắn thông báo thay nhớt cho xe: ${vehicle.plate_number}`);
                
                // (Tùy chọn) Gửi kèm email ở đây nếu sau này bạn tích hợp Nodemailer
            }

            console.log('🤖 [CRON JOB] Hoàn tất đợt quét định kỳ ban đêm!');

        } catch (error) {
            console.error('❌ [CRON JOB] Đã xảy ra lỗi trong quá trình quét bảo dưỡng:', error.message);
        }
    });
};

module.exports = { startCronJobs };