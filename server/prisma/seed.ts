import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed bộ dữ liệu hoàn chỉnh cho Demo Đồ án HRM...');

  // ─── 1. Xóa dữ liệu cũ (Idempotent cleanup theo thứ tự khóa ngoại) ────────────
  await prisma.notification.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.request.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Đã làm sạch toàn bộ dữ liệu cũ an toàn (Idempotent)');

  // ─── 2. Tạo Mật Khẩu Mã Hóa Đồng Bộ ("123456") ─────────────────────────────
  // Mật khẩu đồng bộ cho tất cả tài khoản là "123456"
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // ─── 3. Tạo Danh sách Người Dùng (Users) ──────────────────────────────────
  // 6 nhân sự đại diện 3 phòng ban: Kỹ thuật, Nhân sự, Marketing
  // Gồm 1 ADMIN, 2 TEAM_LEAD, 3 EMPLOYEE kèm avatar chân dung Unsplash sắc nét
  const usersData = [
    {
      name: 'Nguyễn Văn Admin',
      email: 'admin@vp.com',
      password: defaultPasswordHash,
      role: 'admin',
      specialization: 'Quản trị nhân sự & Giám đốc Hệ thống',
      team: 'Nhân sự',
      status: 'Active',
      phone: '0901234567',
      accentColor: '#ef4444',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Lê Hoàng Dương',
      email: 'leader@vp.com',
      password: defaultPasswordHash,
      role: 'teamlead',
      specialization: 'Trưởng nhóm Kỹ thuật (Tech Lead)',
      team: 'Kỹ thuật',
      status: 'Active',
      phone: '0987654321',
      accentColor: '#00daf3',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Trần Minh Tuấn',
      email: 'tuan.tm@vp.com',
      password: defaultPasswordHash,
      role: 'teamlead',
      specialization: 'Trưởng nhóm Marketing (Growth Lead)',
      team: 'Marketing',
      status: 'Active',
      phone: '0934567890',
      accentColor: '#f59e0b',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Trần Văn A',
      email: 'nhanvien@vp.com',
      password: defaultPasswordHash,
      role: 'employee',
      specialization: 'Kỹ sư Phần mềm (Fullstack Developer)',
      team: 'Kỹ thuật',
      status: 'Active',
      phone: '0912345678',
      accentColor: '#00e475',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Nguyễn Thị Thu Hà',
      email: 'ha.ntt@vp.com',
      password: defaultPasswordHash,
      role: 'employee',
      specialization: 'Chuyên viên Tuyển dụng & C&B',
      team: 'Nhân sự',
      status: 'Active',
      phone: '0923456789',
      accentColor: '#ec4899',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
      name: 'Đỗ Anh Dũng',
      email: 'dung.da@vp.com',
      password: defaultPasswordHash,
      role: 'employee',
      specialization: 'Chuyên viên Content & Truyền thông',
      team: 'Marketing',
      status: 'Active',
      phone: '0945678901',
      accentColor: '#8b5cf6',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    createdUsers[u.email] = user;
  }
  console.log(`👥 Đã khởi tạo ${Object.keys(createdUsers).length} nhân sự thuộc các phòng ban`);

  const adminUser = createdUsers['admin@vp.com'];
  const leaderTech = createdUsers['leader@vp.com'];
  const leaderMarketing = createdUsers['tuan.tm@vp.com'];
  const employeeDev = createdUsers['nhanvien@vp.com'];
  const employeeHR = createdUsers['ha.ntt@vp.com'];
  const employeeMkt = createdUsers['dung.da@vp.com'];

  // Helper tính ngày linh hoạt
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const offsetDays = (d: Date, n: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + n);
    return fmt(res);
  };

  // ─── 4. Tạo Lịch sử Chấm Công (CheckIns 7 ngày gần nhất) ────────────────────
  // Bao gồm: ngày đúng giờ (8:45 AM - 5:30 PM), ngày đi muộn (9:20 AM),
  // ngày có cả Check-in/Check-out, và ngày hôm nay chưa check-out để sẵn sàng bấm demo!
  const todayStr = fmt(today);
  const day1Ago = offsetDays(today, -1);
  const day2Ago = offsetDays(today, -2);
  const day3Ago = offsetDays(today, -3);
  const day4Ago = offsetDays(today, -4);
  const day5Ago = offsetDays(today, -5);
  const day6Ago = offsetDays(today, -6);

  await prisma.checkIn.createMany({
    data: [
      // ── Ngày -6: Đúng giờ (8:45 AM - 5:30 PM)
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '08:45', date: day6Ago, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ (Ca Sáng)' },
      { userId: employeeDev.id, userName: employeeDev.name, type: 'out', time: '17:30', date: day6Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },
      { userId: leaderTech.id, userName: leaderTech.name, type: 'in', time: '08:20', date: day6Ago, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ' },
      { userId: leaderTech.id, userName: leaderTech.name, type: 'out', time: '17:45', date: day6Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out đúng giờ' },

      // ── Ngày -5: Đúng giờ
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '08:40', date: day5Ago, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ (Ca Sáng)' },
      { userId: employeeDev.id, userName: employeeDev.name, type: 'out', time: '17:35', date: day5Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },

      // ── Ngày -4: Đi muộn (9:20 AM)
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '09:20', date: day4Ago, shiftName: 'Ca Sáng', status: 'LATE', lateMinutes: 50, note: 'Điểm danh muộn 50 phút do kẹt xe cầu vượt' },
      { userId: employeeDev.id, userName: employeeDev.name, type: 'out', time: '17:40', date: day4Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },

      // ── Ngày -3: Đúng giờ
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '08:42', date: day3Ago, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ (Ca Sáng)' },
      { userId: employeeDev.id, userName: employeeDev.name, type: 'out', time: '17:30', date: day3Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },

      // ── Ngày -2: Đi muộn (9:15 AM)
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '09:15', date: day2Ago, shiftName: 'Ca Sáng', status: 'LATE', lateMinutes: 45, note: 'Điểm danh muộn 45 phút' },
      { userId: employeeDev.id, userName: employeeDev.name, type: 'out', time: '17:50', date: day2Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },

      // ── Ngày -1 (Hôm qua): Đúng giờ (8:45 AM - 5:30 PM)
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '08:45', date: day1Ago, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ (Ca Sáng)' },
      { userId: employeeDev.id, userName: employeeDev.name, type: 'out', time: '17:30', date: day1Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },
      { userId: leaderTech.id, userName: leaderTech.name, type: 'in', time: '08:15', date: day1Ago, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ' },
      { userId: leaderTech.id, userName: leaderTech.name, type: 'out', time: '17:40', date: day1Ago, shiftName: 'Ca Sáng', status: 'NORMAL', note: 'Check-out hoàn thành ca làm việc' },

      // ── Ngày 0 (Hôm nay):
      // Trần Văn A: ĐÃ Check-in lúc 8:45 AM, CHƯA check-out -> Nút hiện CHECK-OUT để demo bấm check-out ngay!
      { userId: employeeDev.id, userName: employeeDev.name, type: 'in', time: '08:45', date: todayStr, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đúng giờ (Ca Sáng)' },
      // Lê Hoàng Dương: Đã check-in lúc 7:58 AM
      { userId: leaderTech.id, userName: leaderTech.name, type: 'in', time: '07:58', date: todayStr, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Điểm danh đầu ngày' },
      // Nguyễn Văn Admin: Đã check-in lúc 8:30 AM
      { userId: adminUser.id, userName: adminUser.name, type: 'in', time: '08:30', date: todayStr, shiftName: 'Ca Sáng', status: 'ON_TIME', note: 'Quản trị viên điểm danh' },
      // Lưu ý: Nguyễn Thị Thu Hà và Đỗ Anh Dũng CHƯA check-in hôm nay -> Nút hiện CHECK-IN để demo bấm check-in!
    ],
  });
  console.log('⏰ Đã khởi tạo dữ liệu Chấm công 7 ngày gần nhất (đủ ca đúng giờ, đi muộn, check-in/out)');

  // ─── 5. Tạo Yêu Cầu Nghỉ Phép / Đơn từ (Requests) ──────────────────────────
  // Gồm: 2 đơn APPROVED (Đã duyệt) và 2 đơn PENDING (Chờ duyệt để demo duyệt/từ chối)
  await prisma.request.createMany({
    data: [
      // Đơn 1: ĐÃ DUYỆT (APPROVED)
      {
        senderId: employeeDev.id,
        senderName: employeeDev.name,
        role: 'Kỹ sư Phần mềm',
        type: 'Nghỉ phép',
        description: 'Xin nghỉ phép thường niên 1 ngày để giải quyết việc gia đình',
        reason: 'Giải quyết việc riêng gia đình ở quê',
        date: offsetDays(today, -5),
        status: 'approved',
        hasAttachment: false,
      },
      // Đơn 2: ĐÃ DUYỆT (APPROVED)
      {
        senderId: employeeHR.id,
        senderName: employeeHR.name,
        role: 'Chuyên viên Nhân sự',
        type: 'OT',
        description: 'Đăng ký làm thêm giờ (OT 2 tiếng) tối Thứ Năm',
        reason: 'Hoàn thiện hồ sơ đánh giá năng lực nhân sự quý 3',
        date: offsetDays(today, -2),
        status: 'approved',
        hasAttachment: true,
        attachmentName: 'ke_hoach_ot_q3.pdf',
      },
      // Đơn 3: CHỜ XỬ LÝ (PENDING) - Dành cho demo Duyệt/Từ chối trên máy Team Lead & Admin
      {
        senderId: employeeMkt.id,
        senderName: employeeMkt.name,
        role: 'Content & Truyền thông',
        type: 'WFH',
        description: 'Xin làm việc từ xa (WFH) ngày mai',
        reason: 'Nhà có thợ đến sửa chữa đường dây mạng cáp quang',
        date: offsetDays(today, 1),
        status: 'pending',
        hasAttachment: false,
      },
      // Đơn 4: CHỜ XỬ LÝ (PENDING) - Dành cho demo Duyệt/Từ chối
      {
        senderId: employeeDev.id,
        senderName: employeeDev.name,
        role: 'Kỹ sư Phần mềm',
        type: 'Chấm công bù',
        description: 'Xin chấm công bù ca sáng do mạng Wi-Fi bảo trì',
        reason: 'Đến đúng giờ lúc 8:30 nhưng thiết bị chưa nhận mạng nội bộ, có ảnh xác nhận',
        date: todayStr,
        status: 'pending',
        hasAttachment: true,
        attachmentName: 'anh_xac_nhan_cham_cong.jpg',
      },
    ],
  });
  console.log('📨 Đã khởi tạo 4 Đơn nghỉ phép / OT (2 Approved, 2 Pending sẵn sàng thao tác duyệt)');

  // ─── 6. Tạo Công Việc (Tasks) ──────────────────────────────────────────────
  // Tạo 6 công việc bao phủ đầy đủ trạng thái: Cần làm (TODO), Đang làm (IN_PROGRESS),
  // Hoàn thành (COMPLETED), có deadline gần (+1-2 ngày) và deadline xa (+10-20 ngày)

  // Master Project cấp cao
  const masterProject = await prisma.task.create({
    data: {
      title: '[Dự án] Nâng cấp Hệ thống Quản trị Nhân sự & Điểm danh Thông minh',
      assigneeId: leaderTech.id,
      supporters: JSON.stringify([employeeDev.name, employeeMkt.name]),
      deadline: offsetDays(today, 30),
      status: 'Đang làm',
      statusType: 'warning',
      dueType: 'normal',
      description: 'Dự án trọng điểm nâng cấp giải pháp chấm công sinh trắc học và quản trị hiệu suất toàn doanh nghiệp',
      isMasterProject: true,
      creatorId: adminUser.id,
      creatorName: adminUser.name,
      progress: 60,
      pipelineStage: 'development',
      budget: '180,000,000 VNĐ',
      handoverHistory: JSON.stringify([
        {
          id: 'h_1',
          fromStage: 'design',
          toStage: 'development',
          approvedBy: 'Lê Hoàng Dương (Tech Lead)',
          approvedAt: offsetDays(today, -4),
          note: 'Đã hoàn thiện thiết kế UI/UX và kiến trúc API.',
        },
      ]),
    },
  });

  await prisma.task.createMany({
    data: [
      // Task 1: [TODO / Cần làm] Deadline xa (+14 ngày)
      {
        title: 'Thiết kế Bộ nhận diện Chiến dịch Tuyển dụng Mùa Thu & Social Kit',
        assigneeId: employeeMkt.id,
        supporters: JSON.stringify([employeeHR.name]),
        deadline: offsetDays(today, 14),
        status: 'Cần làm',
        statusType: 'neutral',
        dueType: 'normal',
        description: 'Thiết kế key visuals, banner LinkedIn/Facebook và infographic phúc lợi nhân sự',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: leaderMarketing.id,
        creatorName: leaderMarketing.name,
        progress: 0,
        pipelineStage: 'design',
        budget: '15,000,000 VNĐ',
      },

      // Task 2: [TODO / Cần làm] Deadline gần (+2 ngày)
      {
        title: 'Kiểm toán Bảo mật Endpoint API & Nâng cấp thư viện phụ thuộc',
        assigneeId: employeeDev.id,
        supporters: JSON.stringify([]),
        deadline: offsetDays(today, 2),
        status: 'Cần làm',
        statusType: 'neutral',
        dueType: 'normal',
        description: 'Chạy kiểm tra mã nguồn tĩnh, quét lỗ hổng npm audit và rà soát CORS policy',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: leaderTech.id,
        creatorName: leaderTech.name,
        progress: 0,
        pipelineStage: 'development',
        budget: '8,000,000 VNĐ',
      },

      // Task 3: [IN_PROGRESS / Đang làm] Deadline gần (+1 ngày)
      {
        title: 'Phát triển Giao diện Check-in Biometric & Wi-Fi Demo Mode',
        assigneeId: employeeDev.id,
        supporters: JSON.stringify([leaderTech.name]),
        deadline: offsetDays(today, 1),
        status: 'Đang làm',
        statusType: 'warning',
        dueType: 'normal',
        description: 'Hoàn thiện giao diện chấm công 1-chạm, tích hợp cơ chế bypass Wi-Fi demo',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: leaderTech.id,
        creatorName: leaderTech.name,
        progress: 75,
        pipelineStage: 'development',
        budget: '25,000,000 VNĐ',
      },

      // Task 4: [IN_PROGRESS / Đang làm] Deadline xa (+20 ngày)
      {
        title: 'Triển khai Hạ tầng Microservices & Cấu hình Caching Redis',
        assigneeId: leaderTech.id,
        supporters: JSON.stringify([employeeDev.name]),
        deadline: offsetDays(today, 20),
        status: 'Đang làm',
        statusType: 'warning',
        dueType: 'normal',
        description: 'Phân tách service thông báo và ca làm việc, tích hợp hàng đợi Redis Queue',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        progress: 40,
        pipelineStage: 'development',
        budget: '45,000,000 VNĐ',
      },

      // Task 5: [COMPLETED / Hoàn thành] Deadline quá khứ (-3 ngày)
      {
        title: 'Xây dựng Module Xác thực JWT & Phân quyền RBAC Đa vai trò',
        assigneeId: employeeDev.id,
        supporters: JSON.stringify([]),
        deadline: offsetDays(today, -3),
        status: 'Hoàn thành',
        statusType: 'success',
        dueType: 'normal',
        description: 'Xây dựng middleware kiểm tra token, phân quyền Admin, Teamlead, Employee',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: leaderTech.id,
        creatorName: leaderTech.name,
        progress: 100,
        pipelineStage: 'completed',
        budget: '20,000,000 VNĐ',
      },

      // Task 6: [COMPLETED / Hoàn thành] Deadline hôm nay (0 ngày)
      {
        title: 'Chuẩn bị Kịch bản Thuyết trình & Dữ liệu Seed Demo Đồ án',
        assigneeId: employeeDev.id,
        supporters: JSON.stringify([employeeHR.name, employeeMkt.name]),
        deadline: todayStr,
        status: 'Hoàn thành',
        statusType: 'success',
        dueType: 'normal',
        description: 'Soạn thảo kịch bản demo tính năng, chuẩn bị bộ dữ liệu mẫu chân thực',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: adminUser.id,
        creatorName: adminUser.name,
        progress: 100,
        pipelineStage: 'completed',
        budget: '10,000,000 VNĐ',
      },
    ],
  });
  console.log('📋 Đã khởi tạo 6 Công việc (Tasks) bao phủ TODO, IN_PROGRESS, COMPLETED, deadline gần/xa');

  // ─── 7. Tạo Thông Báo (Notifications) ───────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: employeeDev.id,
        title: 'Đơn nghỉ phép đã duyệt',
        message: 'Đơn xin nghỉ phép của bạn đã được quản lý phê duyệt.',
        type: 'request_approved',
        icon: 'check-circle',
        iconColor: '#05e777',
        read: false,
      },
      {
        userId: employeeDev.id,
        title: 'Công việc mới được giao',
        message: 'Bạn được phân công: "Phát triển Giao diện Check-in Biometric & Wi-Fi Demo Mode"',
        type: 'task_assigned',
        icon: 'assignment',
        iconColor: '#00daf3',
        read: false,
      },
      {
        userId: leaderTech.id,
        title: 'Yêu cầu chờ phê duyệt',
        message: 'Trần Văn A đã gửi đơn: "Chấm công bù". Vui lòng kiểm tra và duyệt.',
        type: 'system',
        icon: 'campaign',
        iconColor: '#f59e0b',
        read: false,
      },
      {
        userId: adminUser.id,
        title: 'Báo cáo nhân sự tuần',
        message: 'Tỷ lệ điểm danh tuần này đạt 94.2%. Có 2 nhân sự đi muộn.',
        type: 'system',
        icon: 'campaign',
        iconColor: '#00e5ff',
        read: true,
      },
    ],
  });
  console.log('🔔 Đã khởi tạo thông báo hệ thống');

  console.log('\n🎉 ================================================');
  console.log('   SEED DỮ LIỆU MOCK DATA THÀNH CÔNG RỰC RỠ!');
  console.log('================================================');
  console.log('🔑 THÔNG TIN ĐĂNG NHẬP DÙNG ĐỂ THUYẾT TRÌNH:');
  console.log('   Mật khẩu chung cho tất cả tài khoản: 123456');
  console.log('   (Hỗ trợ cả admin123, leader123, user123)');
  console.log('────────────────────────────────────────────────');
  console.log('👑 1. ADMIN (Nhân sự):     admin@vp.com     / 123456');
  console.log('⚡ 2. TEAM LEAD (Kỹ thuật): leader@vp.com    / 123456');
  console.log('⚡ 3. TEAM LEAD (Marketing): tuan.tm@vp.com  / 123456');
  console.log('👤 4. EMPLOYEE (Kỹ thuật):  nhanvien@vp.com  / 123456');
  console.log('👤 5. EMPLOYEE (Nhân sự):   ha.ntt@vp.com    / 123456');
  console.log('👤 6. EMPLOYEE (Marketing): dung.da@vp.com   / 123456');
  console.log('================================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Lỗi seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
