# Discipline 30

Ứng dụng theo dõi dinh dưỡng và kỷ luật trong 30 ngày, gồm React frontend,
Express API và PostgreSQL.

## Yêu cầu

- Node.js 20 trở lên
- PostgreSQL
- npm

Không mở trực tiếp `index.html` hoặc `dist/index.html`. Ứng dụng cần được chạy
qua Vite hoặc Express.

## Cài đặt lần đầu

### Cài đặt tự động

Windows:

```powershell
.\install.bat
```

macOS/Linux:

```bash
chmod +x install.sh run-public-server.sh
./install.sh
```

Các installer giữ nguyên `.env` nếu file đã tồn tại. Khi tạo `.env` mới, script
tự sinh `JWT_SECRET`; hãy kiểm tra lại `DATABASE_URL` trước khi chạy.

### 1. Tạo database

Mở PowerShell và chạy:

```powershell
createdb -U postgres discipline30
psql -U postgres -d discipline30 -f .\database\schema.sql
```

Nếu database đã tồn tại, chỉ cần chạy lệnh `psql` để cập nhật schema.

### 2. Tạo file môi trường

```powershell
Copy-Item .env.example .env
```

Tạo chuỗi bí mật JWT bằng Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Sao chép kết quả vào `JWT_SECRET` trong `.env`:

```env
PORT=3000
DATABASE_URL=postgres://postgres:MAT_KHAU_POSTGRES@localhost:5432/discipline30
JWT_SECRET=CHUOI_VUA_TAO
CLIENT_ORIGIN=http://localhost:4173
```

Không chia sẻ hoặc commit file `.env`.

### 3. Cài dependencies

```powershell
npm install
```

## Chạy development

```powershell
npm run dev
```

Sau đó mở:

- Web: `http://localhost:4173/`
- API health check: `http://localhost:3000/api/health`

Bạn cũng có thể chạy:

```powershell
.\run-public-server.bat
```

Trên macOS/Linux:

```bash
./run-public-server.sh
```

Hai script chạy sẽ tự dừng tiến trình đang lắng nghe trên cổng API trong `.env`
và cổng Vite `4173` trước khi khởi động.

Nhấn `Ctrl+C` để dừng frontend và backend.

## Chạy production local

```powershell
npm run build
npm start
```

Mở `http://localhost:3000/`.

## Kiểm tra mã nguồn

```powershell
npm run check
npm audit --omit=dev
```

## Thông báo tùy chọn

Email và Web Push không bắt buộc để chạy ứng dụng. Khi cần sử dụng, cấu hình
các biến `SMTP_*`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` và `VAPID_SUBJECT`
trong `.env`.
