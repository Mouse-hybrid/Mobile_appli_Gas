// src/logic/fuelCalculator.js

/**
 * Module tính toán hao hụt nhiên liệu nâng cao (Advanced Fuel Calculator)
 * Áp dụng các hệ số môi trường, thời tiết và phát hiện bất thường.
 */

const calculateTripFuel = (distance_km, standard_consumption, factors) => {
    let multiplier = 1.0;
    let anomalyWarnings = [];

    // 1. Ảnh hưởng của Khí hậu / Thời tiết
    if (factors.weather === 'Rain') multiplier *= 1.10; // Mưa làm tăng 10%
    if (factors.weather === 'Storm') multiplier *= 1.25; // Bão, gió ngược tăng 25%

    // 2. Ảnh hưởng của Đường xá (Road Conditions)
    if (factors.road_condition === 'Uphill') multiplier *= 1.30; // Đường đèo dốc leo núi tăng 30%
    if (factors.road_condition === 'Rough') multiplier *= 1.15; // Đường gập ghềnh, ổ gà tăng 15%
    if (factors.is_heavy_traffic) multiplier *= 1.30; // Kẹt xe nhích từng chút một

    // 3. Ảnh hưởng của Hành vi lái xe (Lấy từ dữ liệu GPS)
    if (factors.driving_behavior === 'Aggressive') {
        multiplier *= 1.20;
        anomalyWarnings.push("Phát hiện hành vi thốc ga và phanh gấp liên tục.");
    }

    // 4. Tính toán lượng xăng tiêu thụ (Làm tròn 2 chữ số)
    let estimatedFuel = (distance_km / 100) * standard_consumption * multiplier;
    estimatedFuel = Math.round(estimatedFuel * 100) / 100;

    // 5. CẢNH BÁO BẤT THƯỜNG (Anomaly Detection)
    let isAnomaly = false;
    
    // Nếu hệ số nhân vượt quá 1.8 (tức là hao tốn hơn 80% so với bình thường)
    if (multiplier > 1.8) {
        isAnomaly = true;
        anomalyWarnings.push(`Hao hụt môi trường quá cao (Hệ số x${multiplier.toFixed(2)}).`);
    }

    // Lát nữa ở Resolver, chúng ta có thể so sánh estimatedFuel này với lượng xăng thực tế
    // bị tụt trong phao xăng. Nếu phao xăng tụt nhanh hơn ước tính, ghi nhận "Rò rỉ/Bị hút trộm".

    return {
        base_fuel_liters: Math.round((distance_km / 100) * standard_consumption * 100) / 100,
        estimated_fuel_liters: estimatedFuel,
        multiplier_applied: Math.round(multiplier * 100) / 100,
        is_anomaly: isAnomaly,
        anomaly_reasons: anomalyWarnings
    };
};

module.exports = { calculateTripFuel };