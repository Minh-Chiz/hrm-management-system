# 🏢 HRM Management System (Expo / React Native)

Hệ thống Quản lý Nhân sự (Human Resource Management System) đa nền tảng dành cho thiết bị di động, được phát triển trên nền tảng **React Native (Expo Router)**. Hệ thống phân quyền chặt chẽ cho 3 nhóm người dùng chính: **Admin**, **Team Lead**, và **Employee**.

---

## 💼 Internship Credits

* **Thực tập sinh:** Hoàng Minh Chí - *Software Developer Intern*
* **Mentor hướng dẫn (Doanh nghiệp):** Anh Minh ([minhdc.reactnative@gmail.com](mailto:minhdc.reactnative@gmail.com)) - *Dev-Team*
* **Đơn vị thực tập:** Công ty cổ phần VACOM
* **Giảng viên hướng dẫn (Trường):** TS.Trần Đăng Công - *Khoa CNTT, Đại học Đại Nam*
---

## 🌟 Tính năng chính theo Phân quyền (Roles & Features)

### 👑 1. Phân hệ Admin (`app/(admin)`)
* **Thống kê tổng quan (Dashboard):** Xem chỉ số tổng quan về nhân sự, yêu cầu chờ duyệt, khối lượng công việc toàn công ty (`AdminStatsWidget`).
* **Quản lý người dùng (User Management):** Danh sách người dùng, thêm mới (`AddUserModal`), chỉnh sửa thông tin (`EditUserModal`), cấp quyền và quản lý tài khoản (`UserManagementTable`).
* **Phê duyệt đơn từ (Approve Requests):** Duyệt/từ chối các đơn xin nghỉ phép, giải trình chấm công từ nhân viên (`PendingApprovalsList`).
* **Quản lý công việc (Task Management):** Theo dõi và giám sát tiến độ toàn bộ công việc trong hệ thống.

### 👔 2. Phân hệ Team Lead (`app/(teamlead)`)
* **Tổng quan nhóm (Team Overview):** Theo dõi trạng thái làm việc và tiến độ công việc của các thành viên trong team (`TeamOverviewCard`).
* **Giao việc (Task Assignment):** Tạo và phân công công việc mới cho các thành viên với deadline và mức độ ưu tiên (`TaskAssignmentForm`).
* **Quản lý dự án:** Giám sát danh sách dự án và kết quả thực hiện của nhóm.

### 💼 3. Phân hệ Employee (`app/(employee)`)
* **Chấm công trực tuyến (Check-in / Check-out):** Tích hợp thẻ chấm công, tính thời gian làm việc thực tế theo ca (`CheckInCard`, `useShiftTimer`).
* **Quản lý công việc cá nhân:** Xem tóm tắt công việc (`TaskSummaryWidget`), xem danh sách chi tiết (`AllTasksModal`), và cập nhật trạng thái nhiệm vụ (`TaskDetailModal`).
* **Tạo & Gửi đơn từ:** Tạo đơn xin nghỉ phép, giải trình công việc (`CreateRequestModal`), theo dõi trạng thái phê duyệt (`LeaveRequestWidget`).
* **Thông báo & Hồ sơ:** Hệ thống thông báo thời gian thực (`NotificationModal`), cập nhật thông tin cá nhân (`EditProfileModal`), cắt/chỉnh ảnh đại diện (`CropImageModal`).

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Framework:** React Native, Expo (Expo Router v3+ - File-based Routing)
* **Ngôn ngữ:** TypeScript
* **Styling:** NativeWind / Tailwind CSS
* **Quản lý State:** Zustand (`/store`)
* **Data Fetching & Caching:** TanStack Query / React Query (`/hooks/queries`)
* **Form & Validation:** React Hook Form, Zod (`/schemas`)
* **HTTP Client:** Axios Client (`/services/apiClient.ts`)

---

## 📁 Cấu trúc thư mục dự án

```text
hrm-management-system/
├── app/                      # Luồng màn hình chính (Expo Router)
│   ├── (admin)/              # Màn hình dành cho Admin (Dashboard, User, Tasks, Requests)
│   ├── (teamlead)/           # Màn hình dành cho Team Lead (Dashboard, Team Overview)
│   ├── (employee)/           # Màn hình dành cho Employee (Dashboard, Tasks, Requests)
│   ├── (tabs)/               # Bottom Navigation Tabs
│   ├── login/                # Màn hình Đăng nhập & Quên mật khẩu
│   └── _layout.tsx           # Root Layout & Provider Setup (SafeArea, Auth, QueryClient)
├── components/               # Components dùng chung (Button, Input, Avatar, AlertBox...)
├── config/                   # Cấu hình API Endpoint và môi trường
├── constants/                # Hằng số (Theme, Request Types, Color Codes)
├── context/                  # React Contexts (AuthContext, DataContext)
├── features/                 # Components & Logic tách theo từng phân hệ
│   ├── admin/                # Widgets & Modals riêng của Admin
│   ├── teamlead/             # Forms & Overviews riêng của Team Lead
│   └── employee/             # Cards, Modals & Widgets riêng của Employee
├── hooks/                    # Custom Hooks (Queries, Theme, RealTime Clock...)
├── schemas/                  # Zod Validation Schemas (Auth, User, Task, Request)
├── services/                 # API Services, Mock Data, Utilities
├── store/                    # Zustand Stores (Auth, CheckIn, Task, Request, Notification)
└── types/                    # Định nghĩa TypeScript Interfaces/Types
```
## ⚙️ Hướng dẫn Cài đặt & Khởi chạy
1. Yêu cầu trước khi cài đặt
   * Node.js: `>= 18.x`
   * **npm** hoặc **yarn** / **pnpm**
   * **Expo Go** trên thiết bị di động (hoặc Android Emulator / iOS Simulator)

2. Cài đặt các thư viện
```
# Clone repository về máy
git clone [https://github.com/minh-chiz/hrm-management-system.git](https://github.com/minh-chiz/hrm-management-system.git)

# Di chuyển vào thư mục dự án
cd hrm-management-system

# Cài đặt gói phụ thuộc
npm install
```
3. Khởi chạy ứng dụng
```
# Chạy Expo Dev Server
npx expo start
```
   * Nhấn `a` để mở trên Android Emulator.
   * Nhấn `i` để mở trên iOS Simulator.
   * Khai báo hoặc quét mã QR bằng ứng dụng Expo Go trên điện thoại thật.

## 📝 Quy chuẩn Phát triển (Development Standards)
   * **Kiểm tra cú pháp (Linting):** `npm run lint`
   * **Kiểm tra kiểu dữ liệu:** `npx tsc --noEmit`
   * Dự án áp dụng mô hình Feature-driven Architecture giúp mã nguồn sạch sẽ, tách biệt trách nhiệm và dễ mở rộng.
