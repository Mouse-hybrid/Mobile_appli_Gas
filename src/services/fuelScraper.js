const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');
const cron = require('node-cron');

async function scrapePetrolimexPrice() {
    try {
        const response = await axios.get('https://webgia.com/gia-xang-dau/petrolimex/');
        const $ = cheerio.load(response.data);

        const targets = [
            { keyword: 'RON 95-V', dbKey: 'FUEL_PRICE_RON95_V' },
            { keyword: 'RON 95-III', dbKey: 'FUEL_PRICE_RON95_III' },
            { keyword: 'RON 95 E10', dbKey: 'FUEL_PRICE_RON95_E10' },
            { keyword: 'E5 RON 92', dbKey: 'FUEL_PRICE_E5_RON92' },
            { keyword: 'DO 0,05S', dbKey: 'FUEL_PRICE_DO' }
        ];

        console.log('[BOT] Bắt đầu rà quét bảng giá xăng Petrolimex...');

        let ron95V_price = 0; // Biến ghi nhớ giá RON 95-V để làm cơ sở nội suy

        for (let target of targets) {
            let priceStr = $(`table tbody tr:contains("${target.keyword}") td:nth-child(2)`).first().text();
            let price = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);

            if (!isNaN(price) && price > 0) {
                // Nhớ lại giá RON 95-V nếu quét trúng nó
                if (target.keyword === 'RON 95-V') ron95V_price = price;

                await db.execute(
                    'UPDATE system_configs SET config_value = ? WHERE config_key = ?',
                    [price, target.dbKey]
                );
                console.log(`✅ [BOT] Cập nhật thành công ${target.keyword}: ${price} VNĐ/Lít`);
            } else {
                // THUẬT TOÁN FALLBACK: Cứu hộ riêng cho E10
                if (target.keyword === 'RON 95 E10' && ron95V_price > 0) {
                    let estimatedE10Price = ron95V_price - 800; // Nội suy: Rẻ hơn 95-V 800đ
                    
                    await db.execute(
                        'UPDATE system_configs SET config_value = ? WHERE config_key = ?',
                        [estimatedE10Price, target.dbKey]
                    );
                    console.log(`💡 [BOT] Dùng giá NỘI SUY cho ${target.keyword}: ${estimatedE10Price} VNĐ/Lít (Tính từ RON 95-V)`);
                } else {
                    console.log(`⚠️ [BOT] Không tìm thấy giá cho: ${target.keyword}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ [BOT] Lỗi khi cào giá xăng:', error.message);
    }
}

cron.schedule('0 6 * * *', () => {
    scrapePetrolimexPrice();
});

setTimeout(() => {
    scrapePetrolimexPrice();
}, 3000);

module.exports = { scrapePetrolimexPrice };