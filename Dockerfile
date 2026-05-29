# Sử dụng môi trường Node.js bản 18 (nhẹ nhàng, ổn định)
FROM node:18-alpine

# Cài đặt thư mục làm việc trong container
WORKDIR /app

# Copy 2 file package.json và package-lock.json vào trước
COPY package*.json ./

# Cài đặt các thư viện (node_modules)
RUN npm install

# Copy toàn bộ code từ máy tính vào container
COPY . .

# Mở cổng 6500 để bên ngoài gọi vào API
EXPOSE 6500

# Lệnh khởi chạy server (dùng nodemon để dev)
CMD ["npm", "run", "dev"]