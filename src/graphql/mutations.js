// src/graphql/mutations.js
import { gql } from '@apollo/client/core/index.js';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        full_name
      }
    }
  }
`;

export const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle(
    $id: ID!
    $plate_number: String
    $vehicle_name: String
    $current_odo_km: Float
    $standard_consumption: Float
    $fuel_tank_capacity: Float
    $fuel_type: String
    $image_url: String
    $engine_cc: Int # 🌟 MỚI: Khai báo cổng nhận biến phân khối dạng số nguyên
  ) {
    updateVehicle(
      id: $id
      plate_number: $plate_number
      vehicle_name: $vehicle_name
      current_odo_km: $current_odo_km
      standard_consumption: $standard_consumption
      fuel_tank_capacity: $fuel_tank_capacity
      fuel_type: $fuel_type
      image_url: $image_url
      engine_cc: $engine_cc # 🌟 MỚI: Truyền tham số đồng bộ xuống tầng xử lý
    ) {
      id
      plate_number
      image_url
      model {
        id
        engine_cc # Trả dữ liệu mới về để Apollo Client tự cập nhật UI cache công tác
      }
    }
  }
`;

export const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($id: ID!) {
    deleteVehicle(id: $id)
  }
`;

export const RESOLVE_TRIP_ANOMALY = gql`
  mutation ResolveTripAnomaly($trip_id: ID!, $has_anomaly: Boolean!) {
    resolveTripAnomaly(trip_id: $trip_id, has_anomaly: $has_anomaly) {
      id
      has_anomaly
    }
  }
`;