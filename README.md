# 🏢 Mini HRM - Hệ Thống Quản Trị Nhân Sự & Chấm Công Nội Bộ

![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-Internal-lightgrey)

Hệ thống Quản lý Nhân sự (Human Resource Management) đa nền tảng dành cho thiết bị di động, được xây dựng trên nền tảng **React Native (Expo)** kết hợp với máy chủ **Node.js Express & Prisma ORM**. Ứng dụng hỗ trợ vận hành doanh nghiệp thu nhỏ với cơ chế phân quyền chặt chẽ cho 3 vai trò: **Admin (HR)**, **Team Lead**, và **Employee**.

---

## 📑 Mục Lục

- [Thông Tin Đồ Án / Internship Credits](#-thông-tin-đồ-án--internship-credits)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống-monorepo-architecture)
- [Công Nghệ Sử Dụng](#️-công-nghệ-sử-dụng-tech-stack)
- [Các Tính Năng Cốt Lõi](#-các-tính-năng-cốt-lõi)
- [Hướng Dẫn Khởi Chạy Cục Bộ](#-hướng-dẫn-khởi-chạy-cục-bộ-local-setup)
- [Tài Khoản Trải Nghiệm Mẫu](#-tài-khoản-trải-nghiệm-mẫu-demo-accounts)
- [Quy Chuẩn Đóng Góp & Commit](#-quy-chuẩn-đóng-góp--commit-git-workflow)

---

## 💼 Thông Tin Đồ Án / Internship Credits

| Vai trò | Thông tin |
|---|---|
| **Thực tập sinh** | Hoàng Minh Chí - Software Developer Intern |
| **Đơn vị thực tập** | Công ty Cổ phần VACOM |
| **Mentor hướng dẫn (Doanh nghiệp)** | Anh Minh ([minhdc.reactnative@gmail.com](mailto:minhdc.reactnative@gmail.com)) - Dev-Team |
| **Giảng viên hướng dẫn (Trường)** | TS. Trần Đăng Công - Khoa CNTT, Trường Đại học Đại Nam |

---

## 📌 Kiến Trúc Hệ Thống (Monorepo Architecture)

Dự án được tổ chức theo mô hình **Monorepo** gồm 2 phần độc lập:

```
hrm-management-system/
├── mini-hrm/                   # Frontend: Ứng dụng di động React Native (Expo)
│   ├── app/                    # File-based routing theo từng vai trò
│   │   ├── (admin)/            # Giao diện & tính năng dành cho Admin/HR
│   │   ├── (teamlead)/         # Giao diện quản lý đội ngũ của Trưởng nhóm
│   │   ├── (employee)/         # Giao diện chấm công, công việc của Nhân viên
│   │   └── login.tsx           # Màn hình đăng nhập & điều hướng thông minh
│   ├── components/             # Reusable UI components, Modals cắt ảnh, hộp thoại
│   ├── features/               # Module nghiệp vụ chuyên biệt theo từng Role
│   ├── hooks/                  # Custom hooks (useWifiCheck, useShiftTimer, Queries)
│   ├── services/               # Cấu hình Axios Interceptors, API Client
│   └── store/                  # Quản lý State toàn cục bằng Zustand
│
├── server/                     # Backend: Dịch vụ RESTful API Server (Express + Prisma)
│   ├── prisma/                 # Định nghĩa Schema Database & Script Seed dữ liệu
│   ├── src/
│   │   ├── controllers/        # Điều phối xử lý logic request & response
│   │   ├── middlewares/        # Xác thực JWT, kiểm tra Role-Based Guard, Validate
│   │   ├── routes/             # Định tuyến các API endpoints
│   │   └── services/           # Tầng nghiệp vụ tương tác với cơ sở dữ liệu
│   └── .env.example            # Cấu hình mẫu biến môi trường
└── README.md
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### 1. Front-end Mobile (`mini-hrm/`)

- **Core:** React Native (Expo SDK), TypeScript.
- **Routing:** Expo Router (File-based Routing, Groups theo Role `(admin)`, `(teamlead)`, `(employee)`).
- **State Management:**
  - *Global State:* Zustand (quản lý Auth Session, Thông báo).
  - *Server State:* TanStack React Query v5 (caching, revalidation dữ liệu ngầm).
- **Form & Validation:** React Hook Form kết hợp Zod schema.
- **UI/UX:** NativeWind (Tailwind CSS cho React Native), Feather/Ionicons Icons.
- **Device Features:** Kiểm tra kết nối mạng (Wi-Fi), Bộ đếm thời gian ca thực (`useShiftTimer`), Crop & Upload ảnh đại diện.

### 2. Back-end Server (`server/`)

- **Runtime & Framework:** Node.js, Express.js (TypeScript).
- **ORM & Database:** Prisma ORM, cơ sở dữ liệu SQLite (`dev.db`).
- **Bảo mật:** JSON Web Token (JWT), mã hóa mật khẩu một chiều Bcrypt.
- **Kiến trúc:** Layered Architecture (Routes → Middlewares → Controllers → Services → Prisma Client).
- **Validation:** Express Middleware Validator kết hợp Zod DTOs.

---

## ✨ Các Tính Năng Cốt Lõi

| Phân hệ | Tính năng chi tiết |
|---|---|
| 🔐 **Xác thực & Phân quyền** | - Đăng nhập tài khoản, ghi nhớ phiên làm việc bằng JWT token.<br>- Tự động điều hướng đúng giao diện theo Role (`ADMIN`, `TEAM_LEAD`, `EMPLOYEE`).<br>- Hỗ trợ luồng quên mật khẩu (forgot-password). |
| ⏱️ **Chấm công Thông minh** | - Xác thực kết nối mạng Wi-Fi công ty trước khi mở quyền Check-in.<br>- Bộ đếm thời gian ca làm việc trực quan (`useShiftTimer`).<br>- Hộp thoại xác nhận và nhập lý do khi Check-out sớm trước giờ quy định. |
| 📋 **Quản lý Công việc (Tasks)** | - Phân công công việc theo cá nhân hoặc dự án.<br>- Thiết lập độ ưu tiên, hạn chót (deadline) và cập nhật trạng thái (`TODO`, `IN_PROGRESS`, `COMPLETED`).<br>- Team Lead theo dõi tổng thể tiến độ các thành viên trong nhóm. |
| 📄 **Yêu cầu & Phê duyệt** | - Nhân viên gửi đơn xin nghỉ phép, xin đi muộn / về sớm.<br>- Cấp quản lý (Lead/Admin) nhận danh sách chờ duyệt và thực hiện Duyệt/Từ chối trực tiếp. |
| 🔔 **Thông báo & Cá nhân hóa** | - Nhận thông báo sự kiện khi có task mới hoặc đơn từ được duyệt.<br>- Cập nhật hồ sơ cá nhân, hỗ trợ chọn và cắt tỉa ảnh đại diện (Crop Image). |

---

## 🚀 Hướng Dẫn Khởi Chạy Cục Bộ (Local Setup)

### 📋 Yêu Cầu Cần Có

- **Node.js:** phiên bản 18.x trở lên.
- **Trình quản lý gói:** npm (hoặc yarn / pnpm).
- **Thiết bị chạy:** Ứng dụng Expo Go trên điện thoại thật (cùng mạng Wi-Fi) hoặc máy ảo (Android Studio Emulator / iOS Simulator).

### Bước 1: Khởi Động Backend Server (`server/`)

Mở Terminal tại thư mục gốc và di chuyển vào `server`:

```bash
cd server

# 1. Cài đặt các thư viện
npm install

# 2. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env

# 3. Đồng bộ schema vào cơ sở dữ liệu SQLite
npx prisma db push

# 4. Nạp dữ liệu mẫu ban đầu (nhân viên, ca làm, task)
npx prisma db seed

# 5. Khởi chạy máy chủ API
npm run dev
```

> Mặc định API Server sẽ lắng nghe tại: `http://localhost:5000`

### Bước 2: Khởi Động Ứng Dụng Di Động (`mini-hrm/`)

Mở một cửa sổ Terminal mới và di chuyển vào `mini-hrm`:

```bash
cd mini-hrm

# 1. Cài đặt các thư viện
npm install

# 2. Khởi chạy dự án với Expo
npx expo start
```

> ⚠️ **Lưu ý quan trọng khi test trên điện thoại thật:**
> Nếu bạn quét mã QR qua ứng dụng Expo Go trên điện thoại, điện thoại sẽ **không thể** gọi đến `localhost`. Hãy mở file cấu hình API tại `mini-hrm/config/api.ts` (hoặc file cấu hình tương ứng) và đổi `localhost` thành địa chỉ IP mạng LAN của máy tính (Ví dụ: `http://192.168.1.15:5000/api`).

---

## 👥 Tài Khoản Trải Nghiệm Mẫu (Demo Accounts)

Sau khi chạy lệnh `npx prisma db seed`, cơ sở dữ liệu đã có sẵn các tài khoản thử nghiệm tương ứng với từng vai trò. Bạn có thể kiểm tra trực tiếp danh sách tài khoản trong file `server/prisma/seed.ts` hoặc mở giao diện trực quan bằng lệnh:

```bash
# Chạy tại thư mục server
npx prisma studio
```

Mở trình duyệt tại `http://localhost:5555` → Chọn bảng **User** để xem toàn bộ danh sách Email và mật khẩu đã khởi tạo.

---

## 📝 Quy Chuẩn Đóng Góp & Commit (Git Workflow)

**Bảo mật:** Không bao giờ đẩy file môi trường `.env`, file cơ sở dữ liệu `*.db`, hoặc thư mục `node_modules` lên Git.

**Quy chuẩn thông điệp Commit:** Tuân thủ chuẩn [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Ý nghĩa |
|---|---|
| `feat:` | Tính năng mới hoàn chỉnh. |
| `fix:` | Vá lỗi trong quá trình phát triển. |
| `refactor:` | Tái cấu trúc mã nguồn mà không thay đổi nghiệp vụ. |
| `docs:` | Cập nhật tài liệu kỹ thuật hoặc README. |
