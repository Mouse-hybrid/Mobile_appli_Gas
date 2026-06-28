  // Thêm vào dòng đầu tiên của file src/graphql/resolvers.js
  const crypto = require('crypto');

  const db = require('../config/db');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');
  const { requireAuth, requireAdmin } = require('../utils/auth');

  const { calculateTripFuel } = require('../logic/fuelCalculator');
  const { calculateTireWear } = require('../logic/tireWearCalculator');
  const { calculateEngineWear } = require('../logic/engineWearCalculator');
  const { analyzeSpeedBehavior } = require('../logic/speedBehaviorAnalyzer');
  const { matchNearbyGasStations, calculateWaypointTelemetry } = require('../logic/gasStationMatcher'); 
  const { getWeatherByCoordinates } = require('../services/weatherService');

  const checkRole = (context, allowedRoles) => {
    if (!context.user) throw new Error('Từ chối truy cập! Vui lòng đăng nhập tài khoản.');
    if (!allowedRoles.includes(context.user.role)) throw new Error('Từ chối truy cập! Tài khoản không có quyền thực hiện.');
  };

  const resolvers = {
    User: {
      full_name: (p) => [p.first_name, p.middle_name, p.last_name].filter(x => x && x.trim() !== '').join(' '),
      vehicles: async (p) => {
        const [rows] = await db.execute(`SELECT uv.*, vm.model_name as vehicle_name FROM user_vehicles uv LEFT JOIN vehicle_models vm ON uv.model_id = vm.id WHERE uv.user_id = ?`, [p.id]);
        return rows;
      }
    },

    Vehicle: {
      owner: async (p) => { if (!p.user_id) return null; const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [p.user_id]); return rows[0]; },
      vehicle_name: async (p) => { if (p.vehicle_name || p.model_name) return p.vehicle_name || p.model_name; if (!p.model_id) return "Xe hệ thống"; const [rows] = await db.execute('SELECT model_name FROM vehicle_models WHERE id = ?', [p.model_id]); return rows.length > 0 ? rows[0].model_name : "Xe hệ thống"; },
      model: async (p) => { if (!p.model_id) return null; const [rows] = await db.execute('SELECT * FROM vehicle_models WHERE id = ?', [p.model_id]); return rows[0]; },
      image_url: (p) => p.image_url || null
    },

    Query: {
      getAllUsers: async (_, __, c) => { requireAdmin(c.user); const [rows] = await db.execute('SELECT id, first_name, middle_name, last_name, email FROM users'); return rows; },
      getUserById: async (_, { id }, c) => { checkRole(c, ['Admin']); const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]); return rows[0]; },
      getAllVehicles: async (_, __, c) => { requireAdmin(c.user); const [rows] = await db.execute('SELECT uv.*, vm.model_name as vehicle_name FROM user_vehicles uv LEFT JOIN vehicle_models vm ON uv.model_id = vm.id'); return rows; },
      getVehicleBrands: async () => { const [rows] = await db.execute('SELECT * FROM vehicle_brands'); return rows; },
      getVehicleModels: async (_, { brand_id }) => { let q = 'SELECT * FROM vehicle_models'; const p = []; if (brand_id) { q += ' WHERE brand_id = ?'; p.push(brand_id); } const [rows] = await db.execute(q, p); return rows; },
      getMyVehicles: async (_, __, c) => { const u = requireAuth(c.user); const [rows] = await db.execute('SELECT uv.*, vm.model_name as vehicle_name FROM user_vehicles uv LEFT JOIN vehicle_models vm ON uv.model_id = vm.id WHERE uv.user_id = ?', [u.id]); return rows; },
      getFuelLogs: async (_, { vehicle_id }, c) => { checkRole(c, ['Admin', 'Member']); const uid = parseInt(c.user.id, 10); let q = 'SELECT * FROM fuel_logs WHERE user_id = ?'; const p = [uid]; if (vehicle_id) { q += ' AND vehicle_id = ?'; p.push(parseInt(vehicle_id, 10)); } q += ' ORDER BY log_date DESC'; const [rows] = await db.execute(q, p); return rows.map(r => ({ ...r, log_date: r.log_date ? new Date(r.log_date).toISOString() : null })); },
      getMyNotifications: async (_, __, c) => { checkRole(c, ['Admin', 'Member', 'Guest']); const [rows] = await db.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC', [parseInt(c.user.id, 10)]); return rows; },
      getMyDashboardStats: async (_, __, c) => {
        const u = requireAuth(c.user);
        const [[v]] = await db.execute('SELECT COUNT(*) as total FROM user_vehicles WHERE user_id = ?', [u.id]);
        const [[t]] = await db.execute('SELECT SUM(total_distance_km) as total_km FROM trips WHERE user_id = ? AND status = "Completed"', [u.id]);
        const [[f]] = await db.execute('SELECT SUM(f.total_cost) as total_cost FROM fuel_logs f JOIN user_vehicles v ON f.vehicle_id = v.id WHERE v.user_id = ?', [u.id]);
        return { total_vehicles: v.total || 0, total_distance_km: t.total_km || 0, total_fuel_cost: f.total_cost || 0 };
      },
      getLiveTrips: async (_, __, c) => { requireAdmin(c.user); const [rows] = await db.execute('SELECT t.id as trip_id, v.id as vehicle_id, vm.model_name as vehicle_name, v.plate_number FROM trips t JOIN user_vehicles v ON t.vehicle_id = v.id LEFT JOIN vehicle_models vm ON v.model_id = vm.id WHERE t.status = "Ongoing"'); return rows; },
      
      getAdminDashboardStats: async (_, __, c) => {
        requireAuth(c.user);
        const [[u]] = await db.execute('SELECT COUNT(id) as total FROM users');
        const [[v]] = await db.execute('SELECT COUNT(id) as total FROM user_vehicles');
        const [[t]] = await db.execute('SELECT COUNT(id) as total FROM trips');
        const [[f]] = await db.execute('SELECT COALESCE(SUM(accumulated_fuel_consumed), 0) as total_fuel FROM trip_gps_logs');
        const [[a]] = await db.execute('SELECT COUNT(id) as total FROM trips WHERE has_anomaly = 1');
        
        return { 
          total_users: u.total || 0, 
          total_vehicles: v.total || 0, 
          total_trips: t.total || 0, 
          total_fuel_tracked: parseFloat(f.total_fuel).toFixed(2),
          total_anomalies: a.total || 0 
        };
      },
      getVehicleFuelReport: async (_, __, c) => {
        requireAdmin(c.user);
        const [rows] = await db.execute(`SELECT v.id as vehicle_id, v.plate_number, COALESCE(vm.model_name, 'Xe hệ thống') as vehicle_name, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as owner_name FROM user_vehicles v LEFT JOIN vehicle_models vm ON v.model_id = vm.id LEFT JOIN users u ON v.user_id = u.id`);
        const reports = [];
        for(let r of rows) {
          const [[f]] = await db.execute('SELECT COALESCE(SUM(estimated_fuel_liters), 0) as fuel FROM trips WHERE vehicle_id = ? AND status = "Completed"', [r.vehicle_id]);
          const [[d]] = await db.execute('SELECT COALESCE(SUM(total_distance_km), 0) AS dist FROM trips WHERE vehicle_id = ? AND status = "Completed"', [r.vehicle_id]);
          reports.push({ ...r, owner_name: r.owner_name.trim() || 'Chưa rõ chủ', total_fuel_consumed: parseFloat(parseFloat(f.fuel).toFixed(2)), total_distance_km: parseFloat(parseFloat(d.dist).toFixed(2)) });
        }
        return reports;
      },

      getRecentTrips: async (_, __, c) => {
        requireAdmin(c.user);
        const [rows] = await db.execute(`SELECT t.id, COALESCE(vm.model_name, 'Xe hệ thống') as vehicle_name, v.plate_number, CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as driver_name, t.total_distance_km, t.estimated_fuel_liters, t.end_time, t.has_anomaly FROM trips t JOIN user_vehicles v ON t.vehicle_id = v.id LEFT JOIN vehicle_models vm ON v.model_id = vm.id LEFT JOIN users u ON t.user_id = u.id WHERE t.status = 'Completed' ORDER BY t.end_time DESC LIMIT 5`);
        return rows.map(r => ({ 
          ...r, 
          driver_name: r.driver_name.trim() || 'Ẩn danh', 
          total_distance_km: parseFloat(parseFloat(r.total_distance_km).toFixed(1)), 
          estimated_fuel_liters: parseFloat(parseFloat(r.estimated_fuel_liters).toFixed(2)), 
          end_time: r.end_time ? new Date(r.end_time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '',
          has_anomaly: r.has_anomaly === 1 
        }));
      },

      getNearbyGasStations: async (_, { latitude, longitude }, context) => {
          requireAuth(context.user);
          return await matchNearbyGasStations(latitude, longitude); 
      },

      estimateRequiredFuel: async (_, { vehicle_id, distance_km, latitude, longitude }, context) => {
          requireAuth(context.user);
          const [rows] = await db.execute(`SELECT uv.current_fuel_liters, vm.standard_consumption FROM user_vehicles uv JOIN vehicle_models vm ON vm.id = uv.model_id WHERE uv.id = ?`, [vehicle_id]);
          if (rows.length === 0) throw new Error('Không tìm thấy phương tiện yêu cầu dữ liệu!');
          
          const vehicle = rows[0];
          const fuelCalculation = calculateTripFuel(distance_km, parseFloat(vehicle.standard_consumption), { weather: 'Normal', road_condition: 'Normal', is_heavy_traffic: false, driving_behavior: 'Normal' });
          
          const currentFuel = parseFloat(vehicle.current_fuel_liters);
          const neededFuel = fuelCalculation.estimated_fuel_liters;
          const isEnough = currentFuel >= neededFuel;

          let suggestedStations = [];
          if (!isEnough && latitude && longitude) {
              suggestedStations = await matchNearbyGasStations(latitude, longitude);
          }

          return {
              base_fuel_liters: fuelCalculation.base_fuel_liters,
              estimated_fuel_liters: neededFuel,
              current_fuel_liters: currentFuel,
              is_enough: isEnough,
              suggested_stations: suggestedStations
          };
      }
    },

    Mutation: {
      register: async (_, { email, password, first_name, last_name, middle_name }) => {
        const [ext] = await db.execute('SELECT id FROM users WHERE email = ?', [email]); if (ext.length > 0) throw new Error('Email đã tồn tại!');
        const salt = await bcrypt.genSalt(10); const hash = await bcrypt.hash(password, salt);
        const [res] = await db.execute('INSERT INTO users (email, password_hash, first_name, middle_name, last_name, user_role, is_verified) VALUES (?, ?, ?, ?, ?, "Guest", 1)', [email, hash, first_name, middle_name || null, last_name]);
        const [uRows] = await db.execute('SELECT * FROM users WHERE id = ?', [res.insertId]); const user = uRows[0];
        return { token: jwt.sign({ id: user.id, email: user.email, role: user.user_role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }), user };
      },
      login: async (_, { email, password }) => {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]); const u = users[0]; if (!u) throw new Error('Tài khoản không tồn tại!');
        const sp = u.password || u.password_hash; let match = (sp === password) ? true : await bcrypt.compare(password, sp); if (!match) throw new Error('Mật khẩu không chính xác!');
        return { token: jwt.sign({ id: u.id, email: u.email, role: u.user_role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }), user: u };
      },
      verifyAccount: async (_, { email }, c) => { requireAdmin(c.user); const [res] = await db.execute('UPDATE users SET is_verified = 1, user_role = "Member" WHERE email = ?', [email]); if (res.affectedRows === 0) throw new Error('Không tìm thấy user!'); return true; },
      addVehicle: async (_, { plate_number, vehicle_name, current_odo_km, standard_consumption, fuel_tank_capacity, fuel_type, engine_cc }, c) => {
        const u = requireAuth(c.user); 
        const [duplicateCheck] = await db.execute('SELECT id FROM user_vehicles WHERE plate_number = ?', [plate_number]);
        if (duplicateCheck.length > 0) throw new Error('đã có sẵn');
        const finalType = ['Xăng', 'Điện', 'Dầu'].includes(fuel_type) ? fuel_type : 'Xăng';
        const [mRes] = await db.execute('INSERT INTO vehicle_models (brand_id, model_name, standard_consumption, fuel_tank_capacity, fuel_type, engine_cc) VALUES (1, ?, ?, ?, ?, ?)', [vehicle_name, standard_consumption || 2.0, fuel_tank_capacity || 4.0, finalType, engine_cc || null]);
        const [res] = await db.execute('INSERT INTO user_vehicles (user_id, model_id, plate_number, current_odo_km, current_fuel_liters, status) VALUES (?, ?, ?, ?, ?, "Active")', [u.id, mRes.insertId, plate_number, current_odo_km, fuel_tank_capacity || 4.0]);
        return { id: res.insertId, user_id: u.id, model_id: mRes.insertId, plate_number, current_odo_km, status: 'Active' };
      },
      addFuelLog: async (_, { vehicle_id, liters, total_price, odo_at_fill }, c) => {
        const u = requireAuth(c.user); 
        const [v] = await db.execute(`SELECT uv.*, vm.fuel_type FROM user_vehicles uv LEFT JOIN vehicle_models vm ON uv.model_id = vm.id WHERE uv.id = ? AND uv.user_id = ?`, [vehicle_id, u.id]);
        if (v.length === 0) throw new Error('Từ chối quyền thao tác hoặc phương tiện không tồn tại!');
        let configKey = 'FUEL_PRICE_RON95'; if (v[0].fuel_type === 'Dầu') configKey = 'FUEL_PRICE_DO';
        const [configRows] = await db.execute('SELECT config_value FROM system_configs WHERE config_key = ?', [configKey]);
        const fuelPrice = configRows.length > 0 ? parseFloat(configRows[0].config_value) : 24500;
        let finalLiters = liters; let finalPrice = total_price;
        if (!finalLiters && !finalPrice) throw new Error('Vui lòng nhập số lít hoặc số tiền đổ nhiên liệu!');
        if (!finalLiters) { finalLiters = parseFloat((finalPrice / fuelPrice).toFixed(2)); } else if (!finalPrice) { finalPrice = parseFloat((finalLiters * fuelPrice).toFixed(2)); }
        const [res] = await db.execute('INSERT INTO fuel_logs (user_id, vehicle_id, total_cost, fuel_price_at_time, liters_calculated, status, log_date) VALUES (?, ?, ?, ?, ?, "Approved", CURRENT_TIMESTAMP)', [u.id, vehicle_id, finalPrice, fuelPrice, finalLiters]);
        await db.execute('UPDATE user_vehicles SET current_fuel_liters = current_fuel_liters + ?, current_odo_km = GREATEST(current_odo_km, ?) WHERE id = ?', [finalLiters, odo_at_fill, vehicle_id]);
        return { id: res.insertId, vehicle_id, liters: finalLiters, total_price: finalPrice, odo_at_fill, log_date: new Date().toISOString() };
      },
      startTrip: async (_, { vehicle_id }, c) => { checkRole(c, ['Admin', 'Member']); const [v] = await db.execute('SELECT id FROM user_vehicles WHERE id = ? AND user_id = ?', [vehicle_id, parseInt(c.user.id, 10)]); if (v.length === 0) throw new Error('Không tìm thấy xe!'); const [res] = await db.execute('INSERT INTO trips (user_id, vehicle_id, start_time, status) VALUES (?, ?, CURRENT_TIMESTAMP, "Ongoing")', [parseInt(c.user.id, 10), vehicle_id]); const [nt] = await db.execute('SELECT * FROM trips WHERE id = ?', [res.insertId]); return nt[0]; },
      logTripWaypoint: async (_, { trip_id, latitude, longitude, current_speed_kmh }, c) => {
        requireAuth(c.user); 
        let weather = 'Normal'; 
        try { weather = await getWeatherByCoordinates(latitude, longitude); } catch(e) {}
        const telemetry = await calculateWaypointTelemetry(db, trip_id, latitude, longitude);
        const [res] = await db.execute(
          'INSERT INTO trip_gps_logs (trip_id, latitude, longitude, current_speed_kmh, weather_condition, accumulated_fuel_consumed) VALUES (?, ?, ?, ?, ?, ?)', 
          [trip_id, latitude, longitude, current_speed_kmh, weather, telemetry.accumulated_fuel]
        );
        return { id: res.insertId, trip_id, latitude, longitude, current_speed_kmh, weather_condition: weather, accumulated_fuel_consumed: telemetry.accumulated_fuel };
      },
      updateVehicle: async (_, args, c) => {
        checkRole(c, ['Admin', 'Member']); 
        const { id, plate_number, vehicle_name, current_odo_km, standard_consumption, fuel_tank_capacity, fuel_type, image_url, engine_cc } = args;
        try {
            const [vehicles] = await db.execute('SELECT model_id, user_id FROM user_vehicles WHERE id = ?', [id]); if (vehicles.length === 0) throw new Error('Không tìm thấy phương tiện này trên hệ thống!');
            const vehicleRow = vehicles[0]; if (c.user.role === 'Member' && parseInt(vehicleRow.user_id, 10) !== parseInt(c.user.id, 10)) { throw new Error('Từ chối thao tác! Bạn không được quyền thay đổi thông số xe của thành viên khác.'); }
            if (vehicle_name || standard_consumption || fuel_tank_capacity || fuel_type || engine_cc !== undefined) { await db.execute(`UPDATE vehicle_models SET model_name = COALESCE(?, model_name), standard_consumption = COALESCE(?, standard_consumption), fuel_tank_capacity = COALESCE(?, fuel_tank_capacity), fuel_type = COALESCE(?, fuel_type), engine_cc = COALESCE(?, engine_cc) WHERE id = ?`, [vehicle_name, standard_consumption, fuel_tank_capacity, fuel_type, engine_cc, vehicleRow.model_id]); }
            await db.execute(`UPDATE user_vehicles SET plate_number = COALESCE(?, plate_number), current_odo_km = COALESCE(?, current_odo_km), image_url = COALESCE(?, image_url) WHERE id = ?`, [plate_number, current_odo_km, image_url, id]);
            const [updatedRows] = await db.execute('SELECT * FROM user_vehicles WHERE id = ?', [id]); return updatedRows[0];
        } catch (error) { console.error("Lỗi khi cập nhật dữ liệu xe:", error.message); throw new Error(error.message); }
      },
      deleteVehicle: async (_, { id }, c) => { requireAdmin(c.user); const [res] = await db.execute('DELETE FROM user_vehicles WHERE id = ?', [id]); return res.affectedRows > 0; },
      endTrip: async (_, args, c) => {
        checkRole(c, ['Admin', 'Member']); const uid = parseInt(c.user.id, 10); const { trip_id, distance_km, is_heavy_traffic, end_lat, end_lon, road_condition, braking_type, avg_speed_kmh, acceleration_pattern } = args;
        const [ts] = await db.execute('SELECT * FROM trips WHERE id = ? AND user_id = ? AND status = "Ongoing"', [trip_id, uid]); if (ts.length === 0) throw new Error('Hành trình không hợp lệ!'); const trip = ts[0];
        let weather = 'Normal'; if (end_lat && end_lon) { try { weather = await getWeatherByCoordinates(end_lat, end_lon); } catch(e){} }
        const [vd] = await db.execute('SELECT v.id, v.current_odo_km, vm.standard_consumption FROM user_vehicles v JOIN vehicle_models vm ON v.model_id = vm.id WHERE v.id = ?', [trip.vehicle_id]); const vehicle = vd[0];
        const sa = analyzeSpeedBehavior(acceleration_pattern); const fr = calculateTripFuel(distance_km, vehicle.standard_consumption, { weather, road_condition, is_heavy_traffic, driving_behavior: sa.behavior_label });
        const tw = calculateTireWear(distance_km, avg_speed_kmh || 40, weather, braking_type) * sa.wear_impact; const ew = calculateEngineWear(distance_km, vehicle.current_odo_km, fr.estimated_fuel_liters, sa.behavior_label) * sa.wear_impact;
        const theoreticalStandardFuel = (distance_km * parseFloat(vehicle.standard_consumption)) / 100;
        const hasAnomaly = fr.estimated_fuel_liters > (theoreticalStandardFuel * 1.6);
        await db.execute('UPDATE trips SET end_time = CURRENT_TIMESTAMP, total_distance_km = ?, traffic_multiplier = ?, estimated_fuel_liters = ?, has_anomaly = ?, status = "Completed" WHERE id = ?', [distance_km, fr.multiplier_applied, fr.estimated_fuel_liters, hasAnomaly ? 1 : 0, trip_id]);
        await db.execute('UPDATE user_vehicles SET current_fuel_liters = GREATEST(current_fuel_liters - ?, 0), current_odo_km = current_odo_km + ?, tire_health_percent = GREATEST(tire_health_percent - ?, 0), engine_health_percent = GREATEST(engine_health_percent - ?, 0) WHERE id = ?', [fr.estimated_fuel_liters, distance_km, tw, ew, trip.vehicle_id]);
        if (hasAnomaly) {
            await db.execute('INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, "Anomaly_Alert", ?, ?, 0)', [uid, "⚠️ Phát hiện tiêu thụ xăng bất thường!", `Hành trình #${trip_id} tiêu thụ đến ${fr.estimated_fuel_liters} Lít, vượt ngưỡng an toàn so với định mức của xe. Vui lòng kiểm tra rò rỉ bình nhiên liệu.`]);
        }
        const [updatedTrip] = await db.execute('SELECT * FROM trips WHERE id = ?', [trip_id]); return updatedTrip[0];
      },

      resolveTripAnomaly: async (_, { trip_id, has_anomaly }, c) => {
        const u = requireAuth(c.user);
        const [rows] = await db.execute('SELECT * FROM trips WHERE id = ?', [trip_id]);
        if (rows.length === 0) throw new Error('Không tìm thấy bản ghi hành trình yêu cầu xử lý!');
        const trip = rows[0];
        if (u.role === 'Member' && parseInt(trip.user_id, 10) !== parseInt(u.id, 10)) { throw new Error('Từ chối thao tác! Bạn không được quyền can thiệp hành trình của thành viên khác.'); }
        if (u.role === 'Guest') { throw new Error('Từ chối quyền hạn! Tài khoản Khách chưa được phê duyệt nghiệp vụ.'); }
        await db.execute('UPDATE trips SET has_anomaly = ? WHERE id = ?', [has_anomaly ? 1 : 0, trip_id]);
        const [updatedTrip] = await db.execute('SELECT * FROM trips WHERE id = ?', [trip_id]); return updatedTrip[0];
      },

      // 🌟 MỚI: Resolver xử lý khởi tạo hóa đơn Premium & in log link kích hoạt
      requestPremiumSubscription: async (_, { plan_id }, c) => {
        const u = requireAuth(c.user);
        const [plans] = await db.execute('SELECT * FROM subscription_plans WHERE id = ?', [plan_id]);
        if (plans.length === 0) throw new Error('Gói cước trả phí này không tồn tại trên hệ thống!');
        const plan = plans[0];

        const emailToken = crypto.randomBytes(24).toString('hex');

        await db.execute(
          `INSERT INTO payment_transactions (user_id, plan_id, amount, status, token) 
          VALUES (?, ?, ?, 'Pending', ?)`,
          [u.id, plan.id, plan.price, emailToken]
        );

        const verificationLink = `https://localhost:6500/api/verify-premium?token=${emailToken}`;
        
        console.log(`\nGỬI MAIL PREMIUM AUTOMATION`);
        console.log(`Gửi đến Email: ${u.email}`);
        console.log(`Nội dung: Đăng ký gói ${plan.plan_name}.`);
        console.log(`🔗 LINK XÁC THỰC PREMIUM: ${verificationLink}\n`);

        return `Hệ thống đã bắn một Email xác nhận đến địa chỉ hòm thư của bạn!`;
      }
    }
  };

  module.exports = resolvers;