// src/seed.js
const db = require('../src/config/db.js');
const bcrypt = require('bcryptjs');
const mockData = require('../src/data/mockData.json');

const seedDatabase = async () => {
    try {
        console.log('🌱 Đang kiểm tra và bổ sung dữ liệu (Seeding)...');

        // 1. Quét và thêm Users (Chỉ thêm nếu chưa tồn tại email đó)
        if (mockData.mock_users) {
            for (const user of mockData.mock_users) {
                const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [user.email]);
                
                if (existing.length === 0) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(user.password_plaintext, salt);
                    
                    await db.execute(
                        'INSERT INTO users (email, password_hash, first_name, middle_name, last_name, user_role, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)',
                        [user.email, hashedPassword, user.first_name, user.middle_name, user.last_name, user.user_role]
                    );
                    console.log(`✅ Đã thêm User mới: ${user.email}`);
                } else {
                    console.log(`ℹ️ User đã tồn tại, bỏ qua: ${user.email}`);
                }
            }
        }

        const getUserId = async (email) => {
            const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
            return rows.length ? rows[0].id : null;
        };

        const getVehicleId = async (plate) => {
            const [rows] = await db.execute('SELECT id FROM user_vehicles WHERE plate_number = ?', [plate]);
            return rows.length ? rows[0].id : null;
        };

        // 2. Quét và thêm Xe (Chỉ thêm nếu chưa tồn tại biển số đó)
        if (mockData.mock_vehicles) {
            for (const veh of mockData.mock_vehicles) {
                const [existing] = await db.execute('SELECT id FROM user_vehicles WHERE plate_number = ?', [veh.plate_number]);
                
                if (existing.length === 0) {
                    const userId = await getUserId(veh.user_email);
                    if (userId) {
                        await db.execute(
                            'INSERT INTO user_vehicles (user_id, model_id, plate_number, current_fuel_liters, current_odo_km) VALUES (?, ?, ?, ?, ?)',
                            [userId, veh.model_id, veh.plate_number, veh.current_fuel_liters, veh.current_odo_km]
                        );
                        console.log(`✅ Đã thêm Xe mới: ${veh.plate_number}`);
                    }
                } else {
                    console.log(`ℹ️ Xe đã tồn tại, bỏ qua: ${veh.plate_number}`);
                }
            }
        }

        // 3. Quét và thêm Lịch sử đổ xăng
        if (mockData.mock_fuel_logs) {
            for (const log of mockData.mock_fuel_logs) {
                const vehicleId = await getVehicleId(log.vehicle_plate);
                if (vehicleId) {
                    // Kiểm tra xem đã có log nào tương tự chưa (đơn giản hóa bằng cách check vehicle và time)
                    const [vehRows] = await db.execute('SELECT user_id FROM user_vehicles WHERE id = ?', [vehicleId]);
                    const userId = vehRows[0].user_id;

                    await db.execute(
                        'INSERT INTO fuel_logs (user_id, vehicle_id, total_cost, fuel_price_at_time, liters_calculated, status, log_date) VALUES (?, ?, ?, 24500, ?, ?, CURRENT_TIMESTAMP)',
                        [userId, vehicleId, log.total_cost, log.liters_calculated, log.status]
                    );
                    console.log(`✅ Đã thêm hóa đơn xăng cho xe: ${log.vehicle_plate}`);
                }
            }
        }

        console.log('🎉 QUÁ TRÌNH CẬP NHẬT DỮ LIỆU HOÀN TẤT!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi seeding dữ liệu:', error);
        process.exit(1);
    }
};

seedDatabase();