// src/logic/speedBehaviorAnalyzer.js

/**
 * Phân tích hành vi lái xe dựa trên mẫu gia tốc/vận tốc.
 * Trả về: Hệ số hao hụt thêm và Nhãn hành vi (Driving Behavior Label)
 */
const analyzeSpeedBehavior = (acceleration_pattern) => {
    let behavior_label = 'Normal';
    let fuel_multiplier = 1.0;
    let wear_multiplier = 1.0;

    switch (acceleration_pattern) {
        case 'Uniform_Decelerating': // Chậm dần đều
            behavior_label = 'Smooth';
            fuel_multiplier = 0.95; // Tối ưu xăng (nhờ trớn)
            wear_multiplier = 0.90; // Rất bảo vệ phanh và lốp
            break;
        case 'Decelerating': // Chậm dần (không đều, phanh rà liên tục)
            behavior_label = 'Normal';
            fuel_multiplier = 1.0;
            wear_multiplier = 1.05; // Hơi mòn lốp
            break;
        case 'Constant': // Trung bình (Giữ đều ga / Cruise Control)
            behavior_label = 'Optimal';
            fuel_multiplier = 0.90; // Tiết kiệm xăng nhất
            wear_multiplier = 0.90; // Bảo vệ xe nhất
            break;
        case 'Uniform_Accelerating': // Nhanh dần đều
            behavior_label = 'Smooth';
            fuel_multiplier = 1.0; // Tiêu thụ chuẩn
            wear_multiplier = 1.0;
            break;
        case 'Accelerating': // Nhanh dần (Thốc ga lộn xộn)
            behavior_label = 'Aggressive';
            fuel_multiplier = 1.25; // Hao xăng mạnh
            wear_multiplier = 1.20; // Hại động cơ
            break;
        default:
            behavior_label = 'Normal';
            break;
    }

    return {
        behavior_label,
        fuel_impact: fuel_multiplier,
        wear_impact: wear_multiplier
    };
};

module.exports = { analyzeSpeedBehavior };