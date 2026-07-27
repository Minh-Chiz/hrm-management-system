import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu hoàn chỉnh...');

  // ─── Xóa dữ liệu cũ ────────────────────────────────────────────────────────
  await prisma.checkIn.deleteMany();
  await prisma.request.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Đã làm sạch dữ liệu cũ');

  // ─── Tạo Mật Khẩu Hash ──────────────────────────────────────────────────────
  const hashedAdmin    = await bcrypt.hash('admin123', 10);
  const hashedLeader   = await bcrypt.hash('leader123', 10);
  const hashedUser     = await bcrypt.hash('user123', 10);

  // ─── Danh sách 19 Nhân viên ──────────────────────────────────────────────────
  const usersData = [
    { name: 'Nguyễn Văn Admin', email: 'admin@vp.com', password: hashedAdmin, role: 'admin', specialization: 'Quản lý hệ thống', team: 'Ban Giám Đốc', status: 'Active', phone: '0901234567', accentColor: '#ef4444' },
    { name: 'Lê Hoàng Dương', email: 'leader@vp.com', password: hashedLeader, role: 'teamlead', specialization: 'Frontend', team: 'Frontend', status: 'Active', phone: '0987654321', accentColor: '#00daf3' },
    { name: 'Trần Văn A', email: 'nhanvien@vp.com', password: hashedUser, role: 'employee', specialization: 'Frontend', team: 'Frontend', status: 'Active', phone: '0912345678', accentColor: '#00e475' },
    { name: 'Nguyễn Thị B', email: 'nguyenthib@vp.com', password: hashedUser, role: 'employee', specialization: 'Mobile', team: 'Frontend', status: 'Active', phone: '0923456780', accentColor: '#849396' },
    { name: 'Phạm Minh D', email: 'phamminhd@vp.com', password: hashedUser, role: 'employee', specialization: 'Backend', team: 'Backend', status: 'Active', phone: '0934567891', accentColor: '#00e475' },
    { name: 'Hoàng Thu E', email: 'hoangthu@vp.com', password: hashedUser, role: 'employee', specialization: 'Tester', team: 'Backend', status: 'Inactive', phone: '0945678902', accentColor: '#849396' },
    { name: 'Vũ Lan F', email: 'vulan@vp.com', password: hashedUser, role: 'teamlead', specialization: 'Backend', team: 'Backend', status: 'Active', phone: '0956789013', accentColor: '#00daf3' },
    { name: 'Đỗ Anh G', email: 'doanhg@vp.com', password: hashedUser, role: 'employee', specialization: 'UI/UX Design', team: 'Design', status: 'Active', phone: '0967890124', accentColor: '#ff80ab' },
    { name: 'Ngô Quốc H', email: 'ngoquoch@vp.com', password: hashedUser, role: 'employee', specialization: 'Mobile', team: 'Frontend', status: 'Active', phone: '0978901235', accentColor: '#00e5ff' },
    { name: 'Lý Mỹ I', email: 'lymyi@vp.com', password: hashedUser, role: 'employee', specialization: 'UI/UX Design', team: 'Design', status: 'Inactive', phone: '0989012346', accentColor: '#849396' },
    { name: 'Bùi Tiến J', email: 'buitienj@vp.com', password: hashedUser, role: 'teamlead', specialization: 'UI/UX Design', team: 'Design', status: 'Active', phone: '0990123457', accentColor: '#ffeb3b' },
    { name: 'Trần Thị K', email: 'tranthik@vp.com', password: hashedUser, role: 'employee', specialization: 'Frontend', team: 'Frontend', status: 'Active', phone: '0901122334', accentColor: '#00e475' },
    { name: 'Nguyễn Văn L', email: 'nguyenvanl@vp.com', password: hashedUser, role: 'employee', specialization: 'Frontend', team: 'Frontend', status: 'Active', phone: '0912233445', accentColor: '#849396' },
    { name: 'Lê Văn M', email: 'levanm@vp.com', password: hashedUser, role: 'employee', specialization: 'Backend', team: 'Backend', status: 'Active', phone: '0923344556', accentColor: '#00e475' },
    { name: 'Phan Thanh N', email: 'phanthanhn@vp.com', password: hashedUser, role: 'employee', specialization: 'Backend', team: 'Backend', status: 'Active', phone: '0934455667', accentColor: '#849396' },
    { name: 'Đặng Văn O', email: 'dangvano@vp.com', password: hashedUser, role: 'teamlead', specialization: 'Mobile', team: 'Mobile', status: 'Active', phone: '0945566778', accentColor: '#00daf3' },
    { name: 'Trịnh Thị P', email: 'trinhthip@vp.com', password: hashedUser, role: 'employee', specialization: 'Mobile', team: 'Mobile', status: 'Active', phone: '0956677889', accentColor: '#849396' },
    { name: 'Lâm Văn Q', email: 'lamvanq@vp.com', password: hashedUser, role: 'teamlead', specialization: 'Tester', team: 'QA', status: 'Active', phone: '0967788990', accentColor: '#00daf3' },
    { name: 'Phùng Thị R', email: 'phungthir@vp.com', password: hashedUser, role: 'employee', specialization: 'Tester', team: 'QA', status: 'Active', phone: '0978899001', accentColor: '#849396' },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    createdUsers[u.email] = user;
  }
  console.log(`👥 Đã khởi tạo ${Object.keys(createdUsers).length} tài khoản người dùng`);

  const adminUser = createdUsers['admin@vp.com'];
  const leaderUser = createdUsers['leader@vp.com']; // Lê Hoàng Dương
  const employeeA = createdUsers['nhanvien@vp.com']; // Trần Văn A
  const employeeB = createdUsers['nguyenthib@vp.com']; // Nguyễn Thị B
  const employeeD = createdUsers['phamminhd@vp.com']; // Phạm Minh D
  const employeeE = createdUsers['hoangthu@vp.com']; // Hoàng Thu E

  // ─── Tạo Tasks ──────────────────────────────────────────────────────────────
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const addDays = (d: Date, n: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + n);
    return fmt(res);
  };

  // Master Project
  const masterProject = await prisma.task.create({
    data: {
      title: '[Dự án] Nâng cấp Hệ thống Đăng nhập Sinh trắc học & AI Security',
      assigneeId: leaderUser.id,
      supporters: JSON.stringify([]),
      deadline: addDays(today, 30),
      status: 'Đang làm',
      statusType: 'warning',
      dueType: 'normal',
      description: 'Dự án nâng cấp hệ thống xác thực sinh trắc học và AI Security cho doanh nghiệp',
      isMasterProject: true,
      creatorId: leaderUser.id,
      creatorName: leaderUser.name,
      progress: 50,
      pipelineStage: 'development',
      budget: '150,000,000 VNĐ',
      handoverHistory: JSON.stringify([
        {
          id: 'h_1',
          fromStage: 'design',
          toStage: 'development',
          approvedBy: 'Lê Hoàng Dương (Team Lead)',
          approvedAt: addDays(today, -3),
          note: 'Đã hoàn thiện UI/UX biometric login.',
        },
      ]),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Thiết kế UI/UX Đăng nhập Vân tay & FaceID',
        assigneeId: leaderUser.id,
        supporters: JSON.stringify([]),
        deadline: addDays(today, -3),
        status: 'Hoàn thành',
        statusType: 'success',
        dueType: 'normal',
        description: 'Mockup và prototype giao diện xác thực vân tay',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: leaderUser.id,
        creatorName: leaderUser.name,
        progress: 100,
        pipelineStage: 'design',
      },
      {
        title: 'Lập trình tích hợp Biometric SDK & API Authentication',
        assigneeId: employeeA.id,
        supporters: JSON.stringify([employeeB.name]),
        deadline: addDays(today, 15),
        status: 'Đang làm',
        statusType: 'warning',
        dueType: 'normal',
        description: 'Tích hợp thư viện Native Biometric SDK và API Node.js JWT',
        isMasterProject: false,
        masterTaskId: masterProject.id,
        masterTaskTitle: masterProject.title,
        creatorId: leaderUser.id,
        creatorName: leaderUser.name,
        progress: 50,
        pipelineStage: 'development',
      },
      {
        title: 'Code giao diện Login',
        assigneeId: employeeA.id,
        supporters: JSON.stringify([employeeB.name, employeeD.name]),
        deadline: addDays(today, 2),
        status: 'Đang làm',
        statusType: 'warning',
        dueType: 'normal',
        description: 'Giao diện Đăng nhập đẹp mắt, hỗ trợ Dark Mode',
        progress: 40,
        pipelineStage: 'development',
        budget: '15,000,000 VNĐ',
      },
      {
        title: 'Fix bug màn Dashboard',
        assigneeId: employeeA.id,
        supporters: JSON.stringify([]),
        deadline: addDays(today, 3),
        status: 'Chờ test',
        statusType: 'primary',
        dueType: 'normal',
        description: 'Sửa lỗi hiển thị biểu đồ tròn tiến độ',
        progress: 80,
        pipelineStage: 'testing',
        budget: '10,000,000 VNĐ',
      },
      {
        title: 'Tạo data giả lập',
        assigneeId: employeeA.id,
        supporters: JSON.stringify([]),
        deadline: addDays(today, 4),
        status: 'Chờ review',
        statusType: 'primary',
        dueType: 'normal',
        description: 'Chuẩn bị dữ liệu test cho đợt Demo tuần tới',
        progress: 75,
        pipelineStage: 'development',
        budget: '8,500,000 VNĐ',
      },
      {
        title: 'Viết unit test cho API module',
        assigneeId: employeeA.id,
        supporters: JSON.stringify([]),
        deadline: addDays(today, -2),
        status: 'Hoàn thành',
        statusType: 'success',
        dueType: 'normal',
        description: 'Viết Jest unit tests cho các endpoint /auth và /users',
        progress: 100,
        pipelineStage: 'completed',
        budget: '12,000,000 VNĐ',
      },
      {
        title: 'Tối ưu API Dashboard',
        assigneeId: employeeB.id,
        supporters: JSON.stringify([]),
        deadline: addDays(today, -5),
        status: 'Trễ hạn',
        statusType: 'danger',
        dueType: 'overdue',
        description: 'Tối ưu tốc độ query SQL cho trang Dashboard',
        progress: 25,
        pipelineStage: 'development',
        budget: '20,000,000 VNĐ',
      },
    ],
  });

  console.log('📋 Đã khởi tạo 8 công việc (Tasks & Projects)');

  // ─── Tạo Requests ───────────────────────────────────────────────────────────
  await prisma.request.createMany({
    data: [
      {
        senderId: employeeB.id,
        senderName: employeeB.name,
        role: 'Mobile Dev',
        type: 'Nghỉ phép',
        description: 'Xin nghỉ phép chiều Thứ 4 để đi khám răng',
        reason: 'Đi khám răng định kỳ',
        date: addDays(today, 2),
        status: 'pending',
        hasAttachment: false,
      },
      {
        senderId: employeeA.id,
        senderName: employeeA.name,
        role: 'Frontend Dev',
        type: 'Nghỉ phép',
        description: 'Xin nghỉ phép nguyên ngày Thứ 6 để giải quyết việc gia đình',
        reason: 'Việc gia đình',
        date: addDays(today, 4),
        status: 'pending',
        hasAttachment: false,
      },
      {
        senderId: employeeD.id,
        senderName: employeeD.name,
        role: 'Backend Dev',
        type: 'WFH',
        description: 'Xin làm việc tại nhà Thứ 2',
        reason: 'Sửa nhà, không thể đến văn phòng',
        date: addDays(today, 7),
        status: 'pending',
        hasAttachment: false,
      },
      {
        senderId: employeeE.id,
        senderName: employeeE.name,
        role: 'Tester',
        type: 'WFH',
        description: 'Xin làm việc tại nhà cả tuần',
        reason: 'Chăm sóc người thân ốm',
        date: addDays(today, 8),
        status: 'pending',
        hasAttachment: false,
      },
      {
        senderId: employeeD.id,
        senderName: employeeD.name,
        role: 'Backend Dev',
        type: 'Chấm công bù',
        description: 'Chấm công bù (quên check-in)',
        reason: 'Vào muộn do tắc đường, quên bấm check-in',
        date: addDays(today, -3),
        status: 'approved',
        hasAttachment: false,
      },
      {
        senderId: employeeA.id,
        senderName: employeeA.name,
        role: 'Frontend Dev',
        type: 'OT',
        description: 'Xin OT dự án cuối tuần',
        reason: 'Chạy kịp tiến độ release',
        date: addDays(today, 3),
        status: 'approved',
        hasAttachment: true,
        attachmentName: 'bang_cham_cong_tay.pdf',
      },
    ],
  });

  console.log('📨 Đã khởi tạo 6 đơn xin nghỉ phép / OT / Chấm công bù');

  // ─── Tạo CheckIns ───────────────────────────────────────────────────────────
  const todayStr = fmt(today);
  const yesterdayStr = addDays(today, -1);

  await prisma.checkIn.createMany({
    data: [
      { userId: employeeA.id, userName: employeeA.name, type: 'in', time: '08:02', date: todayStr },
      { userId: employeeB.id, userName: employeeB.name, type: 'in', time: '08:15', date: todayStr },
      { userId: leaderUser.id, userName: leaderUser.name, type: 'in', time: '07:58', date: todayStr },
      { userId: adminUser.id, userName: adminUser.name, type: 'in', time: '08:30', date: todayStr },
      { userId: employeeA.id, userName: employeeA.name, type: 'in', time: '08:05', date: yesterdayStr },
      { userId: employeeA.id, userName: employeeA.name, type: 'out', time: '17:30', date: yesterdayStr },
      { userId: employeeB.id, userName: employeeB.name, type: 'in', time: '08:20', date: yesterdayStr },
      { userId: employeeB.id, userName: employeeB.name, type: 'out', time: '18:00', date: yesterdayStr },
      { userId: leaderUser.id, userName: leaderUser.name, type: 'in', time: '08:00', date: yesterdayStr },
      { userId: leaderUser.id, userName: leaderUser.name, type: 'out', time: '17:45', date: yesterdayStr },
    ],
  });

  console.log('⏰ Đã khởi tạo 10 lượt điểm danh check-in');
  console.log('\n🎉 Seed dữ liệu hoàn tất!');
  console.log('────────────────────────────────────────────────');
  console.log('🔑 THÔNG TIN DÙNG ĐỂ ĐĂNG NHẬP:');
  console.log('👑 Admin:    admin@vp.com     / admin123');
  console.log('👔 Teamlead: leader@vp.com    / leader123  (Lê Hoàng Dương)');
  console.log('💻 Employee: nhanvien@vp.com  / user123    (Trần Văn A)');
  console.log('📱 Employee: nguyenthib@vp.com / user123   (Nguyễn Thị B)');
  console.log('────────────────────────────────────────────────');
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
