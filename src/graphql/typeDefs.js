const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    first_name: String
    middle_name: String
    last_name: String
    full_name: String
    vehicles: [Vehicle]
    user_role: String
    is_verified: Boolean
  }

  type Vehicle {
    id: ID!
    plate_number: String
    current_fuel_liters: Float
    current_odo_km: Float!
    tire_health_percent: Float    
    engine_health_percent: Float
    status: String
    owner: User
    model_id: ID
    vehicle_name: String       
    model: VehicleModel  
    image_url: String      
  }

  type VehicleBrand {
    id: ID!
    brand_name: String!
  }

  type VehicleModel {
    id: ID!
    brand_id: ID!
    model_name: String!
    engine_cc: Int
    fuel_tank_capacity: Float
    standard_consumption: Float
    fuel_type: String
  }

  type FuelLog {
    id: ID!
    vehicle_id: ID!
    liters: Float
    total_price: Float
    odo_at_fill: Float
    status: String
    log_date: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Trip {
    id: ID!
    vehicle_id: ID!
    start_time: String
    end_time: String
    total_distance_km: Float
    traffic_multiplier: Float
    estimated_fuel_liters: Float
    status: String
  }

  type LiveTripInfo {
    trip_id: ID!
    vehicle_id: ID!
    vehicle_name: String
    plate_number: String
    status: String
  }

  type TripWaypointLog {
    id: ID!
    trip_id: ID!
    latitude: Float!
    longitude: Float!
    current_speed_kmh: Float
    weather_condition: String
    accumulated_fuel_consumed: Float
  }

  type Notification {
    id: ID!
    type: String
    title: String
    message: String
    is_read: Boolean
  }

  type DashboardStats {
    total_vehicles: Int
    total_distance_km: Float
    total_fuel_cost: Float
  }

  type AdminDashboardStats {
    total_users: Int
    total_vehicles: Int
    total_trips: Int
    total_fuel_tracked: Float
  }

  type VehicleFuelStat {
    vehicle_id: ID!
    vehicle_name: String!
    plate_number: String!
    owner_name: String!
    total_fuel_consumed: Float!
    total_distance_km: Float!
  }

  type Query {
    getAllUsers: [User]
    getUserById(id: ID!): User
    getAllVehicles: [Vehicle]
    getVehicleBrands: [VehicleBrand]
    getVehicleModels(brand_id: ID): [VehicleModel]
    getMyVehicles: [Vehicle]
    getFuelLogs(vehicle_id: ID): [FuelLog]
    getLiveTrips: [LiveTripInfo]
    getMyNotifications: [Notification]
    getMyDashboardStats: DashboardStats
    getAdminDashboardStats: AdminDashboardStats
    getVehicleFuelReport: [VehicleFuelStat]
  }

  type Mutation {
    register(email: String!, password: String!, first_name: String!, last_name: String!, middle_name: String): AuthPayload
    login(email: String!, password: String!): AuthPayload
    verifyAccount(email: String!): Boolean
    addVehicle(plate_number: String!, vehicle_name: String!, current_odo_km: Float!, standard_consumption: Float, fuel_tank_capacity: Float, fuel_type: String!): Vehicle
    addFuelLog(vehicle_id: ID!, liters: Float!, total_price: Float!, odo_at_fill: Float!): FuelLog
    startTrip(vehicle_id: ID!): Trip
    # 🌟 THÊM MỚI 2 DÒNG NÀY: Khai báo cổng API Sửa và Xóa cho GraphQL nhận diện
    updateVehicle(
      id: ID!
      plate_number: String
      vehicle_name: String
      current_odo_km: Float
      standard_consumption: Float
      fuel_tank_capacity: Float
      fuel_type: String
      image_url: String
    ): Vehicle

    deleteVehicle(id: ID!): Boolean
    
    # 🌟 ĐỒNG BỘ: Sửa lại tên hàm thành endTrip cho trùng khớp với logic xử lý
    endTrip(
      trip_id: ID!, 
      distance_km: Float!, 
      is_heavy_traffic: Boolean,
      end_lat: Float,           
      end_lon: Float,                    
      road_condition: String,   
      braking_type: String,     
      avg_speed_kmh: Float,      
      acceleration_pattern: String 
    ): Trip
    logTripWaypoint(trip_id: ID!, latitude: Float!, longitude: Float!, current_speed_kmh: Float): TripWaypointLog
    markNotificationRead(notification_id: ID!): Boolean
  }
`;

module.exports = typeDefs;