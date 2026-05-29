# Our Fuel Backend

Hướng dẫn cài đặt nhanh cho dự án backend (Node.js + Docker). Nội dung bằng tiếng Việt để người phát triển dễ theo dõi.

## Mục tiêu
- Chạy ứng dụng backend cục bộ để phát triển hoặc deploy bằng Docker.

## Yêu cầu
- Node.js (>= 14)
- npm hoặc yarn
- Git
- MySQL / MariaDB (hoặc DB tương thích với các file SQL trong `db/`)
- (Tuỳ chọn) Docker & docker-compose

## Cài đặt nhanh

1. Clone repo:

```bash
git clone <repo-url>
cd our-fuel-backend
```

2. Cài phụ thuộc:

```bash
npm install
# hoặc
yarn install
```

3. Cấu hình biến môi trường
- Tạo file `.env` trong gốc project (nếu cần). Xem `config/db.js` để biết các biến DB cần thiết.
- Ví dụ biến môi trường thường cần: `PORT`, `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`.

4. Import cơ sở dữ liệu
- Trong thư mục `db/` có các file SQL: `DB QL_xăng_smart.sql`, `du_lieu_gia.sql`.
- Ví dụ import bằng MySQL:

```bash
# đăng nhập và import
mysql -u <user> -p < db/DB\ QL_xăng_smart.sql
mysql -u <user> -p < db/du_lieu_gia.sql
```

5. (Tuỳ chọn) Chạy script seed

```bash
node db/seed.js
```

## Chạy ứng dụng

- Chạy trực tiếp:

```bash
npm start
# hoặc trực tiếp
node src/server.js
```

- Chạy trong môi trường phát triển (nếu có script `dev`):

```bash
npm run dev
```

- Chạy với Docker Compose:

```bash
docker-compose up --build
```

## Các lệnh hữu ích
- Cài dependencies: `npm install`
- Chạy server: `npm start` hoặc `node src/server.js`
- Chạy Docker: `docker-compose up --build`
- Seed dữ liệu: `node db/seed.js`

## Lưu ý
- Private keys / certificates nằm ở `certs/` — tránh commit file chứa key riêng tư.
- Các file .sql trong `db/` nên được quản lý cẩn thận; nếu cần khôi phục, import các file đó vào DB.
- Nếu gặp lỗi kết nối DB, kiểm tra `config/db.js` và biến môi trường trong `.env`.

## Liên hệ
- Nếu cần hỗ trợ thêm, mô tả lỗi và log, sau đó liên hệ người giữ project hoặc tạo issue.

---

Tệp này cung cấp hướng dẫn cơ bản; nếu bạn muốn, tôi có thể mở rộng thêm phần cấu hình môi trường (mẫu `.env.example`), script chạy dev, hoặc hướng dẫn deploy chi tiết.