# 🏢 HRM Management System (Expo / React Native)

Hệ thống Quản lý Nhân sự (Human Resource Management System) đa nền tảng dành cho thiết bị di động, được phát triển trên nền tảng **React Native (Expo Router)**. Hệ thống phân quyền chặt chẽ cho 3 nhóm người dùng chính: **Admin**, **Team Lead**, và **Employee**.

---

## 💼 Internship Credits

* **Thực tập sinh:** Hoàng Minh Chí - *Software Developer Intern*
* **Mentor hướng dẫn (Doanh nghiệp):** Anh Minh ([minhdc.reactnative@gmail.com](mailto:minhdc.reactnative@gmail.com)) - *Dev-Team*
* **Đơn vị thực tập:** Công ty cổ phần VACOM
* **Giảng viên hướng dẫn (Trường):** TS.Trần Đăng Công - *Khoa CNTT, Đại học Đại Nam*
---

## 📌 Tổng quan kiến trúc Monorepo

Dự án được tổ chức theo mô hình Monorepo gồm 2 phần chính:

```text
hrm-management-system/
├── mini-hrm/          # Cross-platform Mobile App (React Native / Expo)
├── server/            # RESTful API Backend (Node.js / Express / Prisma)
└── README.md
```

## 🛠️ Công nghệ sử dụng (Tech Stack)
**1. Front-end (`mini-hrm/`)**
* **Framework:** React Native (Expo SDK)
* **Router:** Expo Router (File-based Routing)
* **State Management:** Zustand, React Query (TanStack Query)
* **Form & Validation:** React Hook Form, Zod
* **UI/UX:** NativeWind (TailwindCSS for React Native), Custom Modals & Components

**2. Back-end (`server/`)**
* **Runtime & Framework:** Node.js, Express.js (TypeScript)
* **ORM & Database:** Prisma ORM, SQLite / PostgreSQL
* **Authentication:** JWT (JSON Web Token), Bcrypt
* **Architecture:** Controller - Service - Route Pattern, DTO Validation

## 🚀 Hướng dẫn cài đặt & Chạy dự án
**📋 Yêu cầu hệ thống**
* **Node.js:** `>= 18.x`
* **npm** hoặc **yarn**
* **Expo Go App** trên điện thoại (Android/iOS) hoặc Trình giả lập (Emulator).

**1. Cấu hình & Chạy Back-end Server (`server/`)**
```
# Di chuyển vào thư mục server
cd server

# Cài đặt các thư viện
npm install

# Tạo file môi trường .env (hoặc copy từ .env.example)
cp .env.example .env

# Chạy Migration cơ sở dữ liệu Prisma
npx prisma migrate dev --name init

# (Tùy chọn) Seed dữ liệu mẫu ban đầu
npx prisma db seed

# Khởi chạy server ở chế độ Development
npm run dev
```
*(Server sẽ mặc định chạy tại: `http://localhost:5000`)*

**2. Cấu hình & Chạy Front-end App (`mini-hrm/`)**
```
# Mở một cửa sổ Terminal mới và di chuyển vào thư mục mini-hrm
cd mini-hrm

# Cài đặt các thư viện
npm install

# Khởi chạy ứng dụng Expo
npx expo start
```
* **Dùng điện thoại thật:** Quét mã QR hiển thị ở Terminal bằng ứng dụng **Expo Go**.
* **Dùng giả lập:** Bấm `a` để mở Android Emulator hoặc `i` để mở iOS Simulator.

## ✨ Các tính năng chính
* **🔐 Xác thực & Phân quyền (Authentication & Authorization):**
  * Đăng nhập, quên mật khẩu, phân quyền theo vai trò (Admin, Teamlead, Employee).
* **⏱️ Chấm công (Check-in / Check-out):**
  * Ghi nhận thời gian ca làm việc, hỗ trợ kiểm tra kết nối WiFi/Vị trí.
* **📋 Quản lý công việc (Task Management):**
  * Giao việc, cập nhật tiến độ, danh sách công việc theo dự án và cá nhân.
* **📄 Yêu cầu & Phê duyệt (Requests & Approvals):**
  * Tạo đơn xin nghỉ phép/đi muộn/về sớm và ban quản lý phê duyệt trực tiếp.
* **🔔 Thông báo (Notifications):**
  * Hệ thống thông báo thời gian thực cho các sự kiện duyệt đơn và phân công việc.

## 📝 Quy chuẩn đóng góp Code (Git Workflow)
1. Giữ các thông tin nhạy cảm (như `DATABASE_URL`, `JWT_SECRET`) trong file `.env` và **không push** `.env` lên Git.
2. Viết commit message theo chuẩn Conventional Commits (ví dụ: `feat:`, `fix:`, `refactor:`, `docs:`).
