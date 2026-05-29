/**
 * Tính toán độ xuống cấp của động cơ (Piston, xupap, thành xi-lanh).
 * Trả về: Điểm trừ hao mòn động cơ (Engine Health Degradation Point)
 */
const calculateEngineWear = (distance_km, current_odo, fuel_consumed, driving_behavior) => {
    // Hao mòn cơ bản dựa trên quãng đường
    let baseDegradation = distance_km * 0.01; 
    let wearMultiplier = 1.0;

    // 1. Xe đi càng lâu (ODO cao), các chi tiết cơ khí càng dễ bị tổn thương thêm
    if (current_odo > 50000) wearMultiplier *= 1.2; // Xe cũ rệu rã
    if (current_odo > 100000) wearMultiplier *= 1.5; // Xe quá cũ

    // 2. Lượng nhiên liệu đốt cháy (Nếu 1 chuyến đi ngắn nhưng đốt quá nhiều xăng -> động cơ đang bị ép tải nặng/quá nhiệt)
    const expectedFuel = (distance_km / 100) * 2.0; // Mức lý tưởng
    if (fuel_consumed > expectedFuel * 1.5) {
        wearMultiplier *= 1.3; // Ép máy quá mức, pitton ma sát nhiệt độ cao
    }

    // 3. Hành vi lái
    if (driving_behavior === 'Aggressive') wearMultiplier *= 1.4; // Thốc ga liên tục ép vòng tua (RPM) cao

    return Math.round((baseDegradation * wearMultiplier) * 1000) / 1000;
};

module.exports = { calculateEngineWear };