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

## Kết nối MySQL (Docker) và MySQL Workbench 8.0 CE

Nếu bạn khởi chạy database thông qua `docker-compose` (có sẵn cấu hình trong `docker-compose.yml`), dịch vụ MySQL của dự án được cấu hình như sau:

- Service name: `fuel_database`
- Host port (máy host) => container port: `3308:3306` (tức là MySQL trong container lắng nghe 3306 nhưng được map ra cổng 3308 trên máy của bạn)
- Username: `root`
- Password: `123456`
- Database mặc định: `smart_fuel_tracker`

Hướng dẫn kết nối bằng MySQL Workbench 8.0 CE:

1. Khởi động Docker Compose (nếu chưa chạy):

```bash
docker-compose up -d
```

2. Mở MySQL Workbench → `+` để tạo New Connection với thông tin:

- `Connection Name`: fuel_database (hoặc tên bạn muốn)
- `Connection Method`: Standard (TCP/IP)
- `Hostname`: 127.0.0.1
- `Port`: 3308
- `Username`: root
- `Password`: 123456 (hoặc chọn Store in Vault…)

3. Nhấn `Test Connection` để kiểm tra. Nếu thành công, nhấn `OK` để lưu và kết nối.

Lưu ý khi phát triển và chạy backend ngoài Docker:

- Khi bạn chạy backend trong container (`docker-compose`), `DB_HOST` trong biến môi trường của backend nên là `fuel_database` (tên service), `DB_PORT` tùy chỉnh là `3306` (container-internal).
- Khi bạn chạy backend trên máy host (ví dụ `npm start`), để kết nối tới DB chạy trong Docker trên máy host, đặt `DB_HOST=127.0.0.1` và `DB_PORT=3308` trong file `.env`.

Ví dụ nội dung `.env` khi chạy backend cục bộ (không dùng docker cho backend):

```
PORT=6500
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASSWORD=123456
DB_NAME=smart_fuel_tracker
JWT_SECRET=your_jwt_secret
```

Ví dụ nội dung `.env` khi chạy cả backend và DB bằng `docker-compose` (backend kết nối bằng tên service):

```
PORT=6500
DB_HOST=fuel_database
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=smart_fuel_tracker
JWT_SECRET=your_jwt_secret
```

Bảo mật: thay đổi mật khẩu `MYSQL_ROOT_PASSWORD` trong `docker-compose.yml` trước khi deploy lên môi trường thực tế. Tránh lưu mật khẩu thực tế trong repo — dùng secrets hoặc biến môi trường an toàn.

## Liên hệ
- Nếu cần hỗ trợ thêm, mô tả lỗi và log, sau đó liên hệ người giữ project hoặc tạo issue.

---

Tệp này cung cấp hướng dẫn cơ bản; nếu bạn muốn, tôi có thể mở rộng thêm phần cấu hình môi trường (mẫu `.env.example`), script chạy dev, hoặc hướng dẫn deploy chi tiết.