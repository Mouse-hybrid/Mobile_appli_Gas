/**
 * Tính toán độ mòn lốp xe dựa trên hành vi phanh, tốc độ và thời tiết.
 * Trả về: Phần trăm mòn lốp (ví dụ: 0.005%)
 */
const calculateTireWear = (distance_km, avg_speed_kmh, weather, braking_type) => {
    // Độ mòn tiêu chuẩn (Giả sử 1 lốp chạy được 20,000km là mòn 100%)
    // Base wear cho mỗi km = 100 / 20000 = 0.005% / km
    let baseWearPerKm = 0.005; 
    let multiplier = 1.0;

    // 1. Ảnh hưởng của tốc độ (Chạy càng nhanh, ma sát nhiệt càng lớn)
    if (avg_speed_kmh > 80) multiplier *= 1.2; 
    
    // 2. Ảnh hưởng của thời tiết (Nắng nóng làm lốp mềm và bám đường, mòn nhanh hơn. Mưa thì trơn trượt, ít mòn lốp hơn nhưng nguy hiểm)
    if (weather === 'Sunny') multiplier *= 1.15;
    if (weather === 'Rain') multiplier *= 0.90; 

    // 3. Hành vi phanh (Yếu tố quyết định)
    if (braking_type === 'Light') multiplier *= 0.9;     // Thắng nhẹ/từ từ: Bảo vệ lốp
    if (braking_type === 'Normal') multiplier *= 1.0;    // Thắng bình thường
    if (braking_type === 'Hard') multiplier *= 1.5;      // Thắng gấp/lết bánh: Bào lốp cực mạnh

    let totalWearPercentage = (distance_km * baseWearPerKm) * multiplier;
    return Math.round(totalWearPercentage * 10000) / 10000; // Làm tròn 4 chữ số thập phân
};

module.exports = { calculateTireWear };