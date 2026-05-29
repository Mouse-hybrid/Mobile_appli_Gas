-- ========================================================
-- DỮ LIỆU GỐC (MASTER DATA) - SMART FUEL TRACKER
-- Lưu ý: Mật khẩu cho 3 user mặc định bên dưới là: 123456
-- ========================================================
USE smart_fuel_tracker;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE trip_gps_logs;
TRUNCATE TABLE trips;
TRUNCATE TABLE fuel_logs;
TRUNCATE TABLE payment_transactions;
TRUNCATE TABLE notifications;
TRUNCATE TABLE user_vehicles;
TRUNCATE TABLE users;
TRUNCATE TABLE subscription_plans;
TRUNCATE TABLE vehicle_models;
TRUNCATE TABLE vehicle_brands;
TRUNCATE TABLE system_configs;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Cấu hình Hệ thống (Master Data)
INSERT INTO system_configs (config_key, config_value, description) VALUES 
('FUEL_PRICE_RON95', '24500', 'Giá xăng RON 95 (VNĐ/Lít)'),
('HEAVY_TRAFFIC_PENALTY', '1.30', 'Hệ số kẹt xe'),
('WEATHER_RAIN_PENALTY', '1.10', 'Hệ số trời mưa'),
('WEATHER_STORM_PENALTY', '1.25', 'Hệ số bão/gió ngược'),
('ROAD_UPHILL_PENALTY', '1.30', 'Hệ số leo dốc'),
('ROAD_ROUGH_PENALTY', '1.15', 'Hệ số đường xấu');

-- 2. Hãng xe & Dòng xe (Master Data)
INSERT INTO vehicle_brands (brand_name) VALUES ('Honda'), ('Yamaha'), ('Toyota');
INSERT INTO vehicle_models (brand_id, model_name, engine_cc, fuel_tank_capacity, standard_consumption, fuel_type) VALUES 
(1, 'Vision 2023', 110, 4.9, 1.85, 'Xăng'),
(2, 'Exciter 155 VVA', 155, 5.4, 2.09, 'Xăng'),
(3, 'Vios 1.5G', 1500, 42.0, 5.80, 'Xăng');

-- 3. Gói cước (Master Data)
INSERT INTO subscription_plans (plan_name, price, duration_days) VALUES 
('Premium 1 Tháng', 49000, 30),
('Premium 1 Năm', 499000, 365);

-- 4. ĐÚNG 3 TÀI KHOẢN GỐC (Admin, Member, Guest)
-- Pass: 123456
INSERT INTO users (email, password_hash, first_name, middle_name, last_name, user_role, is_verified) VALUES 
('admin@domain.com', '123456', 'Admin', 'Hệ', 'Thống', 'Admin', TRUE),
('member@domain.com', '123456', 'Member', 'Tài', 'Khoản', 'Member', TRUE),
('guest@domain.com', '123456', 'Guest', 'Khách', 'Hàng', 'Guest', TRUE);

-- 5. Giá xăng quy chuẩn
INSERT IGNORE INTO system_configs (config_key, config_value, description) VALUES 
('FUEL_PRICE_RON95_V', '24000', 'Giá xăng RON 95-V (VNĐ/Lít)'),
('FUEL_PRICE_RON95_III', '23000', 'Giá xăng RON 95-III (VNĐ/Lít)'),
('FUEL_PRICE_E5_RON92', '22000', 'Giá xăng sinh học E5 RON 92 (VNĐ/Lít)'),
('FUEL_PRICE_RON95_E10', '23500', 'Giá xăng sinh học RON 95-E10 (VNĐ/Lít)'),
('FUEL_PRICE_DO', '20000', 'Giá dầu DO 0.05S (VNĐ/Lít)');
