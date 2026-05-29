const axios = require('axios');

/**
 * Gọi API OpenWeatherMap để lấy thời tiết dựa trên tọa độ GPS
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {string} - Nhãn thời tiết chuẩn của hệ thống (Sunny, Rain, Storm, Normal)
 */
const getWeatherByCoordinates = async (lat, lon) => {
    try {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        
        // Nếu quên nhập Key trong .env, báo lỗi nhẹ và trả về mặc định để không sập server
        if (!apiKey) {
            console.warn('⚠️ Chưa cấu hình OPENWEATHERMAP_API_KEY. Dùng thời tiết mặc định.');
            return 'Normal';
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);

        // OpenWeatherMap trả về một mảng weather, ta lấy phần tử đầu tiên
        const weatherMain = response.data.weather[0].main;
        
        console.log(`☁️ [Thời tiết thực tế tại ${lat}, ${lon}]: ${weatherMain}`);

        // Chuyển đổi mã thời tiết của họ sang chuẩn hệ thống của chúng ta
        switch (weatherMain) {
            case 'Clear':
                return 'Sunny';
            case 'Rain':
            case 'Drizzle':
                return 'Rain';
            case 'Thunderstorm':
            case 'Squall':
            case 'Tornado':
                return 'Storm';
            default:
                return 'Normal'; // Các trường hợp Clouds, Mist, Fog, Haze...
        }
    } catch (error) {
        console.error('❌ Lỗi gọi API Thời tiết (Có thể do sai Key hoặc mất mạng):', error.message);
        return 'Normal'; // Fallback an toàn: Trả về bình thường nếu lỗi
    }
};

module.exports = { getWeatherByCoordinates };