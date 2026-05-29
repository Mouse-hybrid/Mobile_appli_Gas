// src/graphql/resolvers.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireAuth, requireAdmin } = require('../utils/auth');

// IMPORT CÁC BỘ NÃO LOGIC VÀ SERVICES
const { calculateTripFuel } = require('../logic/fuelCalculator');
const { calculateTireWear } = require('../logic/tireWearCalculator');
const { calculateEngineWear } = require('../logic/engineWearCalculator');
const { analyzeSpeedBehavior } = require('../logic/speedBehaviorAnalyzer');
const { getWeatherByCoordinates } = require('../services/weatherService');

const checkRole = (context, allowedRoles) => {
  if (!context.user) {
    throw new Error('Từ chối truy cập! Vui lòng đăng nhập tài khoản.');
  }
  if (!allowedRoles.includes(context.user.role)) {
    throw new Error('Từ chối truy cập! Tài khoản của bạn không có quyền thực hiện hành động này.');
  }
};

const resolvers = {
  // 👥 GOM GỌN ĐỊNH NGHĨA USER
  User: {
    full_name: (parent) => {
      const parts = [parent.first_name, parent.middle_name, parent.last_name];
      return parts.filter(part => part && part.trim() !== '').join(' ');
    },
    vehicles: async (parentUser) => {
      try {
          const [vehicles] = await db.execute(
              `SELECT uv.id, uv.model_id, uv.plate_number, uv.image_url, vm.model_name as vehicle_name 
                FROM user_vehicles uv
                LEFT JOIN vehicle_models vm ON uv.model_id = vm.id
                WHERE uv.user_id = ?`,
              [parentUser.id]
          );
          return vehicles;
      } catch (error) {
          console.error("Lỗi lấy xe của user:", error.message);
          return [];
      }
    }
  },

  // 🚗 GIẢI QUYẾT TRƯỜNG DỮ LIỆU PHƯƠNG TIỆN (FIX LỖI TRẮNG TRANG PHƯƠNG TIỆN)
  Vehicle: {
    owner: async (parent) => {
      if (!parent.user_id) return null;
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [parent.user_id]);
      return rows[0];
    },
    vehicle_name: async (parent) => {
      // 🌟 ĐÃ SỬA: Nếu dữ liệu SQL đã JOIN sẵn trường vehicle_name (hoặc model_name) thì lấy luôn
      if (parent.vehicle_name) return parent.vehicle_name;
      if (parent.model_name) return parent.model_name;
      
      if (!parent.model_id) return "Phương tiện hệ thống";
      const [rows] = await db.execute('SELECT model_name FROM vehicle_models WHERE id = ?', [parent.model_id]);
      return rows.length > 0 ? rows[0].model_name : "Phương tiện hệ thống";
    },
    model: async (parent) => {
      if (!parent.model_id) return null;
      const [rows] = await db.execute('SELECT * FROM vehicle_models WHERE id = ?', [parent.model_id]);
      return rows.length > 0 ? rows[0] : null;
    },

    // 🌟 THÊM BLOCK NÀY: Đọc link ảnh từ bảng user_vehicles gửi sang React Frontend
    image_url: (parent) => {
      return parent.image_url || null;
    }
  },

  Query: {
    getAllUsers: async (_, args, context) => {
        requireAdmin(context.user);
        try {
            const [users] = await db.execute('SELECT id, first_name, middle_name, last_name, email FROM users');
            return users;
        } catch (error) {
            console.error("Lỗi lấy danh sách User:", error.message);
            throw new Error("Không thể tải danh sách người dùng.");
        }
    },

    getUserById: async (_, { id }, context) => {
      checkRole(context, ['Admin']);
      const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0];
    },

    getAllVehicles: async (_, __, context) => {
      checkRole(context, ['Admin']);
      // 🌟 ĐÃ NÂNG CẤP: Thực hiện LEFT JOIN sang bảng mẫu xe để bốc trường model_name làm vehicle_name cho Admin
      const [rows] = await db.execute(`
        SELECT uv.*, vm.model_name as vehicle_name 
        FROM user_vehicles uv
        LEFT JOIN vehicle_models vm ON uv.model_id = vm.id
      `);
      return rows;
    },

    getVehicleBrands: async () => {
      const [rows] = await db.execute('SELECT * FROM vehicle_brands');
      return rows;
    },

    getVehicleModels: async (_, { brand_id }) => {
      let query = 'SELECT * FROM vehicle_models';
      const params = [];
      if (brand_id) {
        query += ' WHERE brand_id = ?';
        params.push(brand_id);
      }
      const [rows] = await db.execute(query, params);
      return rows;
    },

    getMyVehicles: async (_, args, context) => {
        const currentUser = requireAuth(context.user);
        // 🌟 ĐÃ NÂNG CẤP: Tương tự, JOIN lấy tên xe cho App di động của Member
        const [vehicles] = await db.execute(`
          SELECT uv.*, vm.model_name as vehicle_name 
          FROM user_vehicles uv
          LEFT JOIN vehicle_models vm ON uv.model_id = vm.id
          WHERE uv.user_id = ?
        `, [currentUser.id]);
        return vehicles;
    },

    getFuelLogs: async (_, { vehicle_id }, context) => {
      checkRole(context, ['Admin', 'Member']);
      const currentUserId = parseInt(context.user.id, 10);
      let query = 'SELECT * FROM fuel_logs WHERE user_id = ?';
      const params = [currentUserId];

      if (vehicle_id) {
        query += ' AND vehicle_id = ?';
        params.push(parseInt(vehicle_id, 10));
      }
      query += ' ORDER BY log_date DESC';

      const [rows] = await db.execute(query, params);
      return rows.map(row => ({
        ...row,
        log_date: row.log_date ? new Date(row.log_date).toISOString() : null
      }));
    },

    getMyNotifications: async (_, __, context) => {
      checkRole(context, ['Admin', 'Member', 'Guest']);
      const currentUserId = parseInt(context.user.id, 10);
      const [rows] = await db.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC', [currentUserId]);
      return rows;
    },

    getMyDashboardStats: async (_, __, context) => {
      const currentUser = requireAuth(context.user);
      const [vehicleRows] = await db.execute('SELECT COUNT(*) as total FROM user_vehicles WHERE user_id = ?', [currentUser.id]);
      const [tripRows] = await db.execute('SELECT SUM(total_distance_km) as total_km FROM trips WHERE user_id = ? AND status = "Completed"', [currentUser.id]);
      const [fuelRows] = await db.execute(`
        SELECT SUM(f.total_cost) as total_cost 
        FROM fuel_logs f 
        JOIN user_vehicles v ON f.vehicle_id = v.id 
        WHERE v.user_id = ?`, [currentUser.id]);

      return {
        total_vehicles: vehicleRows[0].total || 0,
        total_distance_km: tripRows[0].total_km || 0,
        total_fuel_cost: fuelRows[0].total_cost || 0
      };
    },

    getLiveTrips: async (_, __, context) => {
        requireAdmin(context.user);
        try {
            const [rows] = await db.execute(`
                SELECT 
                    t.id as trip_id,
                    v.id as vehicle_id,
                    vm.model_name as vehicle_name,
                    v.plate_number
                FROM trips t
                JOIN user_vehicles v ON t.vehicle_id = v.id
                LEFT JOIN vehicle_models vm ON v.model_id = vm.id
                WHERE t.status = 'Ongoing'
            `);
            return rows;
        } catch (error) {
            console.error("Lỗi lấy danh sách chuyến đi live:", error.message);
            return [];
        }
    },

    getAdminDashboardStats: async (_, __, context) => {
        const currentUser = requireAuth(context.user);
        try {
            const [[userCount]] = await db.execute('SELECT COUNT(id) as total FROM users');
            const [[vehicleCount]] = await db.execute('SELECT COUNT(id) as total FROM user_vehicles');
            const [[tripCount]] = await db.execute('SELECT COUNT(id) as total FROM trips');
            const [[fuelSum]] = await db.execute('SELECT COALESCE(SUM(accumulated_fuel_consumed), 0) as total_fuel FROM trip_gps_logs');

            return {
                total_users: userCount.total || 0,
                total_vehicles: vehicleCount.total || 0,
                total_trips: tripCount.total || 0,
                total_fuel_tracked: parseFloat(fuelSum.total_fuel).toFixed(2)
            };
        } catch (error) {
            console.error("Lỗi khi lấy số liệu Admin:", error.message);
            throw new Error("Không thể tải dữ liệu thống kê!");
        }
    },

    getVehicleFuelReport: async (_, __, context) => {
        requireAdmin(context.user);
        try {
            const [rows] = await db.execute(`
                SELECT 
                    v.id as vehicle_id,
                    v.plate_number,
                    COALESCE(vm.model_name, 'Xe hệ thống') as vehicle_name,
                    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as owner_name,
                    COALESCE((SELECT SUM(t.estimated_fuel_liters) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed'), 0) as total_fuel_consumed,
                    COALESCE((SELECT SUM(t.total_distance_km) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed'), 0) as total_distance_km
                FROM user_vehicles v
                LEFT JOIN vehicle_models vm ON v.model_id = vm.id
                LEFT JOIN users u ON v.user_id = u.id
            `);
            
            return rows.map(r => ({
                vehicle_id: r.vehicle_id,
                vehicle_name: r.vehicle_name,
                plate_number: r.plate_number,
                owner_name: r.owner_name.trim() || 'Chưa rõ chủ xe',
                total_fuel_consumed: parseFloat(parseFloat(r.total_fuel_consumed).toFixed(2)),
                total_distance_km: parseFloat(parseFloat(r.total_distance_km).toFixed(2))
            }));
        } catch (error) {
            console.error("Lỗi lấy báo cáo nhiên liệu:", error.message);
            return [];
        }
    }
  },

  Mutation: {
    register: async (_, { email, password, first_name, last_name, middle_name }) => {
      const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) throw new Error('Email này đã được sử dụng!');

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await db.execute(
        'INSERT INTO users (email, password_hash, first_name, middle_name, last_name, user_role) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, first_name, middle_name || null, last_name, 'Guest'] 
      );

      const [newUserRows] = await db.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      const user = newUserRows[0];

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.user_role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );

      return { token, user };
    },

    login: async (_, { email, password }) => {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) throw new Error('Tài khoản không tồn tại!');

        let isMatch = false;
        const storedPassword = user.password || user.password_hash; 

        if (storedPassword === password) {
            isMatch = true;
        } else {
            isMatch = await bcrypt.compare(password, storedPassword);
        }

        if (!isMatch) throw new Error('Mật khẩu không chính xác!');

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.user_role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { token, user };
    },

    verifyAccount: async (_, { email }, context) => {
      requireAdmin(context.user); 
      const [result] = await db.execute('UPDATE users SET is_verified = 1, user_role = "Member" WHERE email = ?', [email]);
      if (result.affectedRows === 0) throw new Error('Không tìm thấy tài khoản này!');
      return true;
    },

    addVehicle: async (_, { plate_number, vehicle_name, current_odo_km, standard_consumption, fuel_tank_capacity, fuel_type }, context) => {
        const currentUser = requireAuth(context.user);
        const validFuelTypes = ['Xăng', 'Điện', 'Dầu'];
        const finalFuelType = validFuelTypes.includes(fuel_type) ? fuel_type : 'Xăng';

        const [modelResult] = await db.execute(
            'INSERT INTO vehicle_models (brand_id, model_name, standard_consumption, fuel_tank_capacity, fuel_type) VALUES (?, ?, ?, ?, ?)',
            [1, vehicle_name, standard_consumption || 2.0, fuel_tank_capacity || 4.0, finalFuelType]
        );
        
        const generatedModelId = modelResult.insertId;

        const [result] = await db.execute(
            'INSERT INTO user_vehicles (user_id, model_id, plate_number, current_odo_km, current_fuel_liters, status) VALUES (?, ?, ?, ?, ?, ?)',
            [currentUser.id, generatedModelId, plate_number, current_odo_km, fuel_tank_capacity || 4.0, 'Active']
        );

        return {
            id: result.insertId,
            user_id: currentUser.id,
            model_id: generatedModelId,
            plate_number,
            current_odo_km,
            status: 'Active'
        };
    },

    // 🌟 THÊM MỚI: Xử lý cập nhật thông tin xe và lưu trữ link ảnh mẫu xe từ mạng
    updateVehicle: async (_, args, context) => {
        requireAdmin(context.user); // Bảo mật: Chỉ tài khoản Admin mới được quyền sửa
        const { id, plate_number, vehicle_name, current_odo_km, standard_consumption, fuel_tank_capacity, fuel_type, image_url } = args;

        try {
            // 1. Kiểm tra xem chiếc xe có tồn tại trong hệ thống không để lấy model_id liên kết
            const [vehicles] = await db.execute('SELECT model_id FROM user_vehicles WHERE id = ?', [id]);
            if (vehicles.length === 0) throw new Error('Không tìm thấy phương tiện này trên hệ thống!');
            const modelId = vehicles[0].model_id;

            // 2. Tiến hành cập nhật thông số dòng xe ở bảng mẫu (vehicle_models)
            if (vehicle_name || standard_consumption || fuel_tank_capacity || fuel_type) {
                await db.execute(
                    `UPDATE vehicle_models SET 
                        model_name = COALESCE(?, model_name),
                        standard_consumption = COALESCE(?, standard_consumption),
                        fuel_tank_capacity = COALESCE(?, fuel_tank_capacity),
                        fuel_type = COALESCE(?, fuel_type)
                     WHERE id = ?`,
                    [vehicle_name, standard_consumption, fuel_tank_capacity, fuel_type, modelId]
                );
            }

            // 3. Tiến hành cập nhật biển kiểm soát, số Km và lưu đường dẫn ảnh vào bảng xe (user_vehicles)
            await db.execute(
                `UPDATE user_vehicles SET 
                    plate_number = COALESCE(?, plate_number),
                    current_odo_km = COALESCE(?, current_odo_km),
                    image_url = COALESCE(?, image_url)
                 WHERE id = ?`,
                [plate_number, current_odo_km, image_url, id]
            );

            // 4. Trả về thực thể xe sau khi đã hiệu chỉnh thông tin thành công
            return { id, plate_number, current_odo_km, image_url };
        } catch (error) {
            console.error("Lỗi khi cập nhật dữ liệu xe:", error.message);
            throw new Error(error.message);
        }
    },

    // 🌟 THÊM MỚI: Logic xóa sổ phương tiện khỏi hệ thống điều hành
    deleteVehicle: async (_, { id }, context) => {
        requireAdmin(context.user);
        try {
            const [result] = await db.execute('DELETE FROM user_vehicles WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Lỗi khi thực hiện xóa xe:", error.message);
            throw new Error("Không thể xóa xe này vì đang vướng các dữ liệu lịch sử chuyến đi.");
        }
    },

    addFuelLog: async (_, { vehicle_id, liters, total_price, odo_at_fill }, context) => {
        const currentUser = requireAuth(context.user);
        const [vehicles] = await db.execute('SELECT * FROM user_vehicles WHERE id = ? AND user_id = ?', [vehicle_id, currentUser.id]);

        if (vehicles.length === 0) throw new Error('Bạn không có quyền thao tác trên chiếc xe này!');

        const [result] = await db.execute(
            'INSERT INTO fuel_logs (user_id, vehicle_id, liters_calculated, total_cost) VALUES (?, ?, ?, ?)',
            [currentUser.id, vehicle_id, liters, total_price]
        );

        if (odo_at_fill > vehicles[0].current_odo_km) {
            await db.execute('UPDATE user_vehicles SET current_odo_km = ? WHERE id = ?', [odo_at_fill, vehicle_id]);
        }

        return {
            id: result.insertId,
            vehicle_id,
            liters,
            total_price,
            odo_at_fill,
            log_date: new Date().toISOString()
        };
    },

    startTrip: async (_, { vehicle_id }, context) => {
      checkRole(context, ['Admin', 'Member']);
      const currentUserId = parseInt(context.user.id, 10);

      const [vehicles] = await db.execute('SELECT id FROM user_vehicles WHERE id = ? AND user_id = ?', [vehicle_id, currentUserId]);
      if (vehicles.length === 0) throw new Error('Không tìm thấy xe hợp lệ!');

      const [result] = await db.execute(
        'INSERT INTO trips (user_id, vehicle_id, start_time, status) VALUES (?, ?, CURRENT_TIMESTAMP, ?)',
        [currentUserId, vehicle_id, 'Ongoing']
      );

      const [newTrip] = await db.execute('SELECT * FROM trips WHERE id = ?', [result.insertId]);
      return newTrip[0];
    },

    logTripWaypoint: async (_, { trip_id, latitude, longitude, current_speed_kmh }, context) => {
        const currentUser = requireAuth(context.user);
        let weather = 'Normal';
        try {
            weather = await getWeatherByCoordinates(latitude, longitude);
        } catch (e) {
            console.error("Lỗi khi gọi API Thời tiết:", e.message);
        }

        let partial_fuel_consumed = 0.015; 

        const [result] = await db.execute(
            `INSERT INTO trip_gps_logs 
            (trip_id, latitude, longitude, current_speed_kmh, weather_condition, accumulated_fuel_consumed) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [trip_id, latitude, longitude, current_speed_kmh, weather, partial_fuel_consumed]
        );

        return {
            id: result.insertId,
            trip_id,
            latitude,
            longitude,
            current_speed_kmh,
            weather_condition: weather,
            accumulated_fuel_consumed: partial_fuel_consumed
        };
    },

    endTrip: async (_, args, context) => {
      checkRole(context, ['Admin', 'Member']);
      const currentUserId = parseInt(context.user.id, 10);
      const { trip_id, distance_km, is_heavy_traffic, end_lat, end_lon, road_condition, braking_type, avg_speed_kmh, acceleration_pattern } = args;

      const [trips] = await db.execute('SELECT * FROM trips WHERE id = ? AND user_id = ? AND status = "Ongoing"', [trip_id, currentUserId]);
      if (trips.length === 0) throw new Error('Không tìm thấy chuyến đi đang diễn ra!');
      const trip = trips[0];

      let weather = 'Normal';
      if (end_lat && end_lon) {
          weather = await getWeatherByCoordinates(end_lat, end_lon);
      }

      const [vehicleData] = await db.execute(`
        SELECT v.id, v.current_odo_km, vm.standard_consumption 
        FROM user_vehicles v JOIN vehicle_models vm ON v.model_id = vm.id WHERE v.id = ?
      `, [trip.vehicle_id]);
      const vehicle = vehicleData[0];

      const speedAnalysis = analyzeSpeedBehavior(acceleration_pattern);
      const fuelResult = calculateTripFuel(distance_km, vehicle.standard_consumption, { 
          weather, 
          road_condition, 
          is_heavy_traffic, 
          driving_behavior: speedAnalysis.behavior_label 
      });

      const tireWear = calculateTireWear(distance_km, avg_speed_kmh || 40, weather, braking_type) * speedAnalysis.wear_impact;
      const engineWear = calculateEngineWear(distance_km, vehicle.current_odo_km, fuelResult.estimated_fuel_liters, speedAnalysis.behavior_label) * speedAnalysis.wear_impact;

      await db.execute(
        'UPDATE trips SET end_time = CURRENT_TIMESTAMP, total_distance_km = ?, traffic_multiplier = ?, estimated_fuel_liters = ?, status = "Completed" WHERE id = ?',
        [distance_km, fuelResult.multiplier_applied, fuelResult.estimated_fuel_liters, trip_id]
      );

      await db.execute(
        `UPDATE user_vehicles SET 
          current_fuel_liters = GREATEST(current_fuel_liters - ?, 0), 
          current_odo_km = current_odo_km + ?,
          tire_health_percent = GREATEST(tire_health_percent - ?, 0),
          engine_health_percent = GREATEST(engine_health_percent - ?, 0)
        WHERE id = ?`,
        [fuelResult.estimated_fuel_liters, distance_km, tireWear, engineWear, trip.vehicle_id]
      );

      if (fuelResult.is_anomaly || speedAnalysis.behavior_label === 'Aggressive') {
        const msg = fuelResult.anomaly_reasons.join(' ') + (speedAnalysis.behavior_label === 'Aggressive' ? ' Thốc ga quá mạnh.' : '');
        await db.execute(
          'INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, 0)',
          [currentUserId, 'Anomaly_Alert', 'Cảnh báo Hành vi Lái xe', `Hành trình vừa qua: ${msg}`]
        );
      }

      const [updatedTrip] = await db.execute('SELECT * FROM trips WHERE id = ?', [trip_id]);
      return updatedTrip[0];
    },

    markNotificationRead: async (_, { notification_id }, context) => {
      checkRole(context, ['Admin', 'Member', 'Guest']);
      const userId = parseInt(context.user.id, 10);
      const [result] = await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notification_id, userId]);
      return result.affectedRows > 0;
    }
  }
};

module.exports = resolvers;