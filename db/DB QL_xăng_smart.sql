-- ========================================================
-- 1. KHỞI TẠO DATABASE
-- ========================================================
DROP DATABASE IF EXISTS smart_fuel_tracker;
CREATE DATABASE smart_fuel_tracker;
USE smart_fuel_tracker;

-- ========================================================
-- 2. BẢNG HÃNG XE & DÒNG XE
-- ========================================================
CREATE TABLE vehicle_brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE vehicle_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT,
    model_name VARCHAR(100) NOT NULL,
    engine_cc INT COMMENT 'Phân khối hoặc mã lực',
    fuel_tank_capacity DECIMAL(5, 2) COMMENT 'Dung tích bình xăng tối đa (Lít)',
    standard_consumption DECIMAL(5, 2) NOT NULL COMMENT 'Mức tiêu hao lý thuyết Lít/100km', 
    fuel_type ENUM('Xăng', 'Dầu', 'Điện') DEFAULT 'Xăng',
    FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id) ON DELETE CASCADE
);

-- ========================================================
-- 3. BẢNG NGƯỜI DÙNG (ĐÃ CẬP NHẬT TÁCH TÊN)
-- ========================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    middle_name VARCHAR(50),
    last_name VARCHAR(50),
    user_role ENUM('Admin', 'Member', 'Guest') DEFAULT 'Guest',
    is_verified BOOLEAN DEFAULT FALSE,
    premium_valid_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- 4. BẢNG XE (ĐÃ THÊM CỘT SỨC KHỎE XE)
-- ========================================================
CREATE TABLE user_vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    model_id INT,
    plate_number VARCHAR(20),
    image_url VARCHAR(255),
    current_fuel_liters DECIMAL(5, 2) DEFAULT 0.00,
    current_odo_km DECIMAL(10, 2) DEFAULT 0.00, 
    tire_health_percent DECIMAL(5, 2) DEFAULT 100.00,   -- Mới bổ sung
    engine_health_percent DECIMAL(5, 2) DEFAULT 100.00, -- Mới bổ sung
    status ENUM('Active', 'Needs_Maintenance', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES vehicle_models(id)
);
-- ========================================================
-- 5. BẢNG QUẢN LÝ GÓI CƯỚC & THANH TOÁN VNPAY
-- ========================================================
CREATE TABLE subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL COMMENT 'Giá tiền VNĐ',
    duration_days INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE payment_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    -- Các trường dành riêng cho VNPay
    vnp_TxnRef VARCHAR(100) UNIQUE COMMENT 'Mã đơn hàng nội bộ gửi sang VNPay',
    vnp_TransactionNo VARCHAR(100) COMMENT 'Mã giao dịch do VNPay trả về',
    vnp_BankCode VARCHAR(20) COMMENT 'Mã ngân hàng khách dùng (NCB, VCB...)',
    status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- ========================================================
-- 6. BẢNG CẤU HÌNH HỆ THỐNG
-- ========================================================
CREATE TABLE system_configs (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

-- ========================================================
-- 7. BẢNG HÀNH TRÌNH (TRIPS - Trái tim của hệ thống)
-- ========================================================
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    vehicle_id INT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    total_distance_km DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Hệ số Môi trường & Giao thông
    weather_multiplier DECIMAL(3, 2) DEFAULT 1.00 COMMENT 'Hệ số hao do thời tiết',
    traffic_multiplier DECIMAL(3, 2) DEFAULT 1.00 COMMENT 'Hệ số hao do kẹt xe',
    driving_behavior_multiplier DECIMAL(3, 2) DEFAULT 1.00 COMMENT 'Hệ số hao do gia tốc lái',
    
    estimated_fuel_liters DECIMAL(10, 3) DEFAULT 0.000 COMMENT 'Số lít xăng chuyến này tiêu thụ',
    has_anomaly BOOLEAN DEFAULT FALSE COMMENT 'Có bị rò rỉ/hao hụt bất thường không',
    status ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Ongoing',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES user_vehicles(id)
);

-- ========================================================
-- 8. BẢNG TỌA ĐỘ GPS LOGS
-- ========================================================
CREATE TABLE trip_gps_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    current_speed_kmh DECIMAL(5, 2),
    acceleration_ms2 DECIMAL(5, 2) COMMENT 'Gia tốc (để tính driving behavior)',
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- ========================================================
-- 9. BẢNG NHẬT KÝ ĐỔ XĂNG (SMART FUEL LOG)
-- ========================================================
CREATE TABLE fuel_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    vehicle_id INT,
    total_cost DECIMAL(15, 2) NOT NULL COMMENT 'Người dùng nhập số tiền', 
    fuel_price_at_time DECIMAL(10, 2) NOT NULL COMMENT 'Giá xăng hệ thống tự lấy', 
    liters_calculated DECIMAL(10, 2) NOT NULL COMMENT 'Cost / Price', 
    receipt_image_url VARCHAR(255),
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by INT NULL, 
    log_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES user_vehicles(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- ========================================================
-- 10. BẢNG THÔNG BÁO PUSH NOTIFICATION
-- ========================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('Anomaly_Alert', 'Maintenance_Reminder', 'Fuel_Warning', 'System') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
use smart_fuel_tracker;
select * from vehicle_brands;
select * from vehicle_models;

-- Thêm các cột mới vào bảng trip_gps_logs đã có sẵn
ALTER TABLE trip_gps_logs
ADD COLUMN weather_condition VARCHAR(50) DEFAULT 'Normal' COMMENT 'Thời tiết ngay tại tọa độ này (Sunny, Rain, Storm...)',
ADD COLUMN accumulated_fuel_consumed DECIMAL(10, 4) DEFAULT 0.0000 COMMENT 'Lượng xăng đã tiêu thụ tính từ đầu chuyến đến tọa độ này',
ADD COLUMN traffic_density ENUM('Light', 'Normal', 'Heavy') DEFAULT 'Normal' COMMENT 'Mật độ giao thông tại điểm này';

ALTER TABLE vehicle_models
ADD COLUMN image_url VARCHAR(255) COMMENT 'Ảnh minh họa gốc của dòng xe này';

ALTER TABLE payment_transactions 
ADD COLUMN token VARCHAR(255) NULL COMMENT 'Mã token xác thực qua Email Premium';