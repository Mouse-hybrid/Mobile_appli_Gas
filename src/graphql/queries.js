// src/graphql/queries.js
import { gql } from '@apollo/client';

// 🌟 ĐỒNG BỘ TRUNG TÂM ĐIỀU HÀNH: Gom cụm dữ liệu phục vụ cơ chế PollInterval 4s của Dashboard
export const GET_ADMIN_DASHBOARD_DATA = gql`
  query GetAdminDashboardData {
    getAdminDashboardStats {
      total_users
      total_vehicles
      total_trips
      total_fuel_tracked
      total_anomalies # 🔴 MỚI: Tổng số vụ hao hụt xăng bất thường toàn hệ thống
    }
    getRecentTrips {
      id
      vehicle_name
      plate_number
      driver_name
      total_distance_km
      estimated_fuel_liters
      end_time
      has_anomaly # 🔴 MỚI: Trạng thái chuyến đi (True/False) để bật cảnh báo màu
    }
  }
`;

// 👥 2. API Lấy toàn bộ người dùng cho trang quản lý tài khoản
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      full_name
      email
      vehicles {
        id
        plate_number
        vehicle_name
      }
    }
  }
`;

// 🚗 3. API Quét danh sách xe thực tế cho trang Quản lý Phương tiện (FIX LỖI)
export const GET_ALL_VEHICLES = gql`
  query GetAllVehicles {
    getAllVehicles {
      id
      plate_number
      current_fuel_liters
      current_odo_km
      status
      vehicle_name
      image_url
      model {
        id
        model_name
        engine_cc # 🔴 MỚI: Lấy thêm thông tin phân khối xi lanh hiển thị lên Card
        fuel_tank_capacity
        standard_consumption
        fuel_type
      }
    }
  }
`;

// 🗺️ 4. API Lấy tất cả chuyến đi đang bật định vị ngoài đường cho Bản đồ Live
export const GET_LIVE_TRIPS = gql`
  query GetLiveTrips {
    getLiveTrips {
      trip_id
      vehicle_id
      vehicle_name
      plate_number
    }
  }
`;

// ⛽ 5. Query bốc dữ liệu làm nguyên liệu vẽ biểu đồ Master-Detail xăng cộ
export const GET_VEHICLE_FUEL_REPORT = gql`
  query GetVehicleFuelReport {
    getVehicleFuelReport {
      vehicle_id
      vehicle_name
      plate_number
      owner_name
      total_fuel_consumed
      total_distance_km
    }
  }
`;