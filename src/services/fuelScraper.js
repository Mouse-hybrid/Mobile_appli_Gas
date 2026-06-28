const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');
const cron = require('node-cron');

async function scrapePetrolimexPrice() {
    try {
        const response = await axios.get('https://luatvietnam.vn/bang-gia-xang-dau-hom-nay.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);

        console.log('[BOT] Bắt đầu rà quét bảng giá xăng Petrolimex từ LuatVietnam...');

        // Đối tượng bộ nhớ đệm lưu trữ giá tạm thời sau khi quét
        const scrapedPrices = {
            FUEL_PRICE_RON95_V: 0,
            FUEL_PRICE_RON95_III: 0,
            FUEL_PRICE_RON95_E10: 0,
            FUEL_PRICE_E5_RON92: 0,
            FUEL_PRICE_DO: 0
        };

        // 🎯 NÂNG CẤP LUẬT QUÉT: Dùng hàm match chính xác để không bị nhận vơ chuỗi
        const targets = [
            { 
                name: 'RON 95-V', 
                dbKey: 'FUEL_PRICE_RON95_V',
                match: (text) => text.includes('RON 95-V') && !text.includes('E10')
            },
            { 
                name: 'RON 95-III', 
                dbKey: 'FUEL_PRICE_RON95_III',
                match: (text) => text.includes('RON 95-III') && !text.includes('E10')
            },
            { 
                name: 'RON 95 E10', 
                dbKey: 'FUEL_PRICE_RON95_E10',
                match: (text) => text.includes('RON 95 E10') || (text.includes('E10') && text.includes('RON 95'))
            },
            { 
                name: 'E5 RON 92', 
                dbKey: 'FUEL_PRICE_E5_RON92',
                match: (text) => text.includes('E5 RON 92')
            },
            { 
                name: 'DO 0,05S', 
                dbKey: 'FUEL_PRICE_DO',
                match: (text) => text.includes('DO 0,05S') || text.includes('Dầu DO')
            }
        ];

        // Bước 1: Quét trích xuất dữ liệu trực tiếp từ các hàng (tr) của bảng
        $('tr').each((index, element) => {
            const rowText = $(element).text();
            
            for (let target of targets) {
                // Nếu chưa tìm thấy giá cho loại này và hàng này khớp luật match
                if (scrapedPrices[target.dbKey] === 0 && target.match(rowText)) {
                    $(element).find('td').each((cellIndex, cell) => {
                        let cellText = $(cell).text().replace(/[^0-9]/g, '');
                        let parsedPrice = parseInt(cellText, 10);
                        
                        if (!isNaN(parsedPrice) && parsedPrice >= 15000 && parsedPrice <= 35000) {
                            scrapedPrices[target.dbKey] = parsedPrice;
                            return false; // Đã tìm thấy giá, thoát khỏi các ô td
                        }
                    });
                }
            }
        });

        // 💡 Bước 2: THUẬT TOÁN NỘI SUY HAI CHIỀU THÔNG MINH 
        
        // Chiều 1: Nếu có bản thuần (III hoặc V) nhưng thiếu E10 (Logic cũ của nhóm)
        if (scrapedPrices.FUEL_PRICE_RON95_E10 === 0) {
            if (scrapedPrices.FUEL_PRICE_RON95_V > 0) {
                scrapedPrices.FUEL_PRICE_RON95_E10 = scrapedPrices.FUEL_PRICE_RON95_V - 800;
                console.log(`💡 [BOT] Nội suy RON 95 E10 từ bản V: ${scrapedPrices.FUEL_PRICE_RON95_E10} VNĐ/Lít`);
            } else if (scrapedPrices.FUEL_PRICE_RON95_III > 0) {
                scrapedPrices.FUEL_PRICE_RON95_E10 = scrapedPrices.FUEL_PRICE_RON95_III - 300;
                console.log(`💡 [BOT] Nội suy RON 95 E10 từ bản III: ${scrapedPrices.FUEL_PRICE_RON95_E10} VNĐ/Lít`);
            }
        } 
        
        // Chiều 2: Nếu chỉ có bản E10 trên bảng giá nhưng thiếu bản thuần (Tình huống thực tế hôm nay)
        if (scrapedPrices.FUEL_PRICE_RON95_E10 > 0) {
            if (scrapedPrices.FUEL_PRICE_RON95_III === 0) {
                scrapedPrices.FUEL_PRICE_RON95_III = scrapedPrices.FUEL_PRICE_RON95_E10 + 300; // Bản thuần đắt hơn E10 tầm 300đ
                console.log(`💡 [BOT] Nội suy NGƯỢC bản RON 95-III từ E10: ${scrapedPrices.FUEL_PRICE_RON95_III} VNĐ/Lít`);
            }
            if (scrapedPrices.FUEL_PRICE_RON95_V === 0) {
                scrapedPrices.FUEL_PRICE_RON95_V = scrapedPrices.FUEL_PRICE_RON95_III + 900; // Bản V đắt hơn bản III tầm 900đ
                console.log(`💡 [BOT] Nội suy NGƯỢC bản RON 95-V từ RON 95-III: ${scrapedPrices.FUEL_PRICE_RON95_V} VNĐ/Lít`);
            }
        }

        // Bước 3: Đẩy dữ liệu sạch vào Database và in log tổng kết
        for (let target of targets) {
            const finalPrice = scrapedPrices[target.dbKey];
            if (finalPrice > 0) {
                await db.execute(
                    'UPDATE system_configs SET config_value = ? WHERE config_key = ?',
                    [finalPrice, target.dbKey]
                );
                console.log(`✅ [BOT] Cập nhật thành công ${target.name}: ${finalPrice} VNĐ/Lít`);
            } else {
                console.log(`⚠️ [BOT] Không thể xác định giá cho: ${target.name}`);
            }
        }

    } catch (error) {
        console.error('❌ [BOT] Lỗi khi cào giá xăng từ LuatVietnam:', error.message);
    }
}

cron.schedule('0 6 * * *', () => {
    scrapePetrolimexPrice();
});

setTimeout(() => {
    scrapePetrolimexPrice();
}, 3000);

module.exports = { scrapePetrolimexPrice };