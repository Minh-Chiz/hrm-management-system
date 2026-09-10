import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PendingRequest, Employee } from '@/types';

interface ProfileTabContentProps {
  user: {
    id?: string | number;
    name?: string;
    role?: string;
    specialization?: string;
    username?: string;
    team?: string;
    position?: string;
    email?: string;
    phone?: string;
    companyCode?: string;
    avatar?: string;
  } | null;
  activeEmp?: Employee;
  requests: PendingRequest[];
  onOpenCreateModal: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const ProfileTabContent: React.FC<ProfileTabContentProps> = ({
  user,
  activeEmp,
  requests,
  onOpenCreateModal,
  onEditProfile,
  onLogout,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Thời gian kỳ lương hiện tại
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();
  const currentMonthYear = `${currentMonth}/${currentYear}`;
  const currentDateFormatted = `${String(now.getDate()).padStart(2, '0')}/${currentMonth}/${currentYear}`;

  const employeeName = user?.name || activeEmp?.name || 'Trần Văn A';
  const employeeCode = user?.username ? `VP-${user.username.toUpperCase()}` : 'VP-EMP004';
  const employeeTeam = activeEmp?.team || user?.team || 'Phòng Kỹ Thuật';
  const employeePosition = user?.position || user?.specialization || activeEmp?.specialization || 'Kỹ sư Phần mềm Fullstack';

  // Hàm tạo HTML phiếu lương doanh nghiệp sang trọng
  const generatePayslipHtml = () => {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Phiếu lương ${employeeName} - Tháng ${currentMonthYear}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      padding: 36px 40px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #00bcd4;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-logo {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .company-logo span { color: #00bcd4; }
    .company-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .doc-badge {
      text-align: right;
    }
    .badge-pill {
      display: inline-block;
      background: #ecfeff;
      color: #0891b2;
      border: 1px solid #a5f3fc;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
    }
    .payslip-title {
      text-align: center;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 10px;
      margin-bottom: 4px;
    }
    .payslip-period {
      text-align: center;
      font-size: 13px;
      color: #0891b2;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .info-grid {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 22px;
      border-collapse: separate;
    }
    .info-grid td {
      padding: 4px 8px;
      font-size: 12px;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
      width: 18%;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
      width: 32%;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .data-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 9px 12px;
      font-size: 11px;
      text-align: left;
      font-weight: 600;
    }
    .data-table th.text-right { text-align: right; }
    .data-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    .data-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .data-table td.text-right { text-align: right; font-weight: 600; }
    .row-total td {
      background: #f1f5f9;
      font-weight: 700;
      border-top: 1px solid #cbd5e1;
    }
    .net-salary-card {
      background: #065f46;
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .net-salary-table {
      width: 100%;
    }
    .net-salary-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #a7f3d0;
    }
    .net-salary-amount {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      text-align: right;
    }
    .net-words {
      font-size: 11px;
      font-style: italic;
      color: #d1fae5;
      margin-top: 4px;
    }
    .signatures-table {
      width: 100%;
      margin-top: 28px;
      text-align: center;
    }
    .signatures-table td {
      width: 33.33%;
      vertical-align: top;
      padding: 0 8px;
    }
    .sig-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
      margin-bottom: 50px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .footer-note {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="company-logo">VP <span>CORP</span> SYSTEMS</div>
        <div class="company-sub">CÔNG TY CỔ PHẦN CÔNG NGHỆ & GIẢI PHÁP VP - VIETNAM</div>
        <div class="company-sub">Trụ sở: Tòa nhà VP Tower, Quận Cầu Giấy, Hà Nội • Hotline: 1900 6868</div>
      </td>
      <td class="doc-badge">
        <div class="badge-pill">✓ CHÍNH THỨC</div>
        <div class="company-sub" style="margin-top: 6px;">Ngày lập: ${currentDateFormatted}</div>
      </td>
    </tr>
  </table>

  <div class="payslip-title">PHIẾU LƯƠNG NHÂN VIÊN</div>
  <div class="payslip-period">Kỳ lương: Tháng ${currentMonthYear} (01/${currentMonth}/${currentYear} - 30/${currentMonth}/${currentYear})</div>

  <table class="info-grid">
    <tr>
      <td class="info-label">Họ và tên:</td>
      <td class="info-value">${employeeName}</td>
      <td class="info-label">Mã nhân viên:</td>
      <td class="info-value">${employeeCode}</td>
    </tr>
    <tr>
      <td class="info-label">Phòng ban:</td>
      <td class="info-value">${employeeTeam}</td>
      <td class="info-label">Chức vụ:</td>
      <td class="info-value">${employeePosition}</td>
    </tr>
    <tr>
      <td class="info-label">Ngày công chuẩn:</td>
      <td class="info-value">22 ngày</td>
      <td class="info-label">Ngày công thực tế:</td>
      <td class="info-value" style="color: #059669;">22 / 22 ngày (Đủ công)</td>
    </tr>
    <tr>
      <td class="info-label">Tài khoản nhận:</td>
      <td class="info-value">9876.888.321 (Techcombank)</td>
      <td class="info-label">Hình thức:</td>
      <td class="info-value">Chuyển khoản trực tiếp</td>
    </tr>
  </table>

  <!-- Bảng 1: Thu nhập -->
  <div class="section-title">I. Các Khoản Thu Nhập (Gross Income)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 8%;">STT</th>
        <th style="width: 52%;">Khoản mục thu nhập</th>
        <th style="width: 20%;">Công thức / Ghi chú</th>
        <th style="width: 20%;" class="text-right">Số tiền (VNĐ)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>01</td>
        <td>Lương cơ bản theo hợp đồng lao động</td>
        <td>22 ngày công chuẩn</td>
        <td class="text-right">18,000,000</td>
      </tr>
      <tr>
        <td>02</td>
        <td>Phụ cấp ăn trưa & đi lại công tác</td>
        <td>Cố định hàng tháng</td>
        <td class="text-right">1,500,000</td>
      </tr>
      <tr>
        <td>03</td>
        <td>Thưởng hiệu suất công việc (KPI tháng)</td>
        <td>Xếp loại Xuất sắc (A+)</td>
        <td class="text-right">3,200,000</td>
      </tr>
      <tr>
        <td>04</td>
        <td>Trợ cấp thiết bị & dự án trọng điểm</td>
        <td>Theo chính sách R&D</td>
        <td class="text-right">1,000,000</td>
      </tr>
      <tr class="row-total">
        <td colspan="3">TỔNG THU NHẬP (1 + 2 + 3 + 4):</td>
        <td class="text-right" style="color: #0284c7;">23,700,000</td>
      </tr>
    </tbody>
  </table>

  <!-- Bảng 2: Giảm trừ -->
  <div class="section-title">II. Các Khoản Giảm Trừ (Deductions)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 8%;">STT</th>
        <th style="width: 52%;">Khoản mục giảm trừ</th>
        <th style="width: 20%;">Tỷ lệ / Căn cứ</th>
        <th style="width: 20%;" class="text-right">Số tiền (VNĐ)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>01</td>
        <td>Bảo hiểm xã hội, BHYT, BHTN (NLĐ đóng)</td>
        <td>10.5% mức đóng BH</td>
        <td class="text-right" style="color: #dc2626;">-1,450,000</td>
      </tr>
      <tr>
        <td>02</td>
        <td>Giảm trừ đi muộn / vi phạm giờ giấc</td>
        <td>2 lần vi phạm (Quy chế HRM)</td>
        <td class="text-right" style="color: #dc2626;">-200,000</td>
      </tr>
      <tr>
        <td>03</td>
        <td>Thuế thu nhập cá nhân (TNCN) tạm khấu trừ</td>
        <td>Theo biểu lũy tiến</td>
        <td class="text-right" style="color: #dc2626;">-300,000</td>
      </tr>
      <tr class="row-total">
        <td colspan="3">TỔNG GIẢM TRỪ (1 + 2 + 3):</td>
        <td class="text-right" style="color: #dc2626;">-1,950,000</td>
      </tr>
    </tbody>
  </table>

  <!-- Thẻ Lương thực nhận -->
  <div class="net-salary-card">
    <table class="net-salary-table">
      <tr>
        <td>
          <div class="net-salary-title">TỔNG THỰC LĨNH (NET SALARY)</div>
          <div class="net-words">Bằng chữ: Hai mươi mốt triệu bảy trăm năm mươi nghìn đồng chẵn.</div>
        </td>
        <td class="net-salary-amount">21,750,000 đ</td>
      </tr>
    </table>
  </div>

  <!-- Chữ ký -->
  <table class="signatures-table">
    <tr>
      <td>
        <div class="sig-title">Người Lập Phiếu</div>
        <div class="sig-sub">(Kế toán tiền lương)</div>
        <div class="sig-name">Trần Mai Chi</div>
      </td>
      <td>
        <div class="sig-title">Trưởng Phòng Nhân Sự</div>
        <div class="sig-sub">(Ký & đóng dấu)</div>
        <div class="sig-name">Nguyễn Văn Admin</div>
      </td>
      <td>
        <div class="sig-title">Người Nhận Tiền</div>
        <div class="sig-sub">(Ký & ghi rõ họ tên)</div>
        <div class="sig-name">${employeeName}</div>
      </td>
    </tr>
  </table>

  <div class="footer-note">
    Lưu ý: Mọi thắc mắc về bảng lương vui lòng liên hệ Ban Nhân sự trong vòng 03 ngày làm việc kể từ ngày nhận phiếu.<br>
    Tài liệu bảo mật nội bộ • Được phát hành tự động từ Hệ thống Quản trị Nhân sự Mini HRM.
  </div>
</body>
</html>
    `;
  };

  const handleExportPayslip = async () => {
    setIsExporting(true);
    try {
      const html = generatePayslipHtml();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Bảng lương tháng ${currentMonthYear} - ${employeeName}`,
        });
      } else {
        Alert.alert(
          'Đã tạo tệp PDF thành công',
          `Tệp đã được lưu tạm thời tại: ${uri}. Tính năng chia sẻ không được hỗ trợ trên môi trường này.`
        );
      }
    } catch (error) {
      console.error('Lỗi khi xuất PDF phiếu lương:', error);
      Alert.alert('Lỗi', 'Không thể tạo file PDF phiếu lương. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCardSection}>
        {/* Avatar Section */}
        <View style={styles.profileAvatarSection}>
          <View style={styles.profileLargeAvatar}>
            <MaterialIcons name="person" size={56} color="#00e5ff" />
          </View>
          <Text style={styles.profileUserName}>{employeeName}</Text>
          <View style={styles.profileSpecializationBadge}>
            <MaterialIcons name="workspace-premium" size={14} color="#00e5ff" />
            <Text style={styles.profileSpecializationText}>
              {user?.role === 'employee' ? 'Nhân viên' : 'Trưởng nhóm'} • {employeePosition}
            </Text>
          </View>
        </View>

        {/* Thông tin liên hệ */}
        <View style={styles.profileInfoCard}>
          <View style={styles.profileInfoRow}>
            <MaterialIcons name="email" size={18} color="#00e5ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.profileInfoLabel}>Email liên hệ</Text>
              <Text style={styles.profileInfoValue}>
                {user?.email || activeEmp?.email || `${user?.username ?? 'nhanvien'}@vp.com`}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <MaterialIcons name="phone" size={18} color="#00e5ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.profileInfoLabel}>Số điện thoại</Text>
              <Text style={styles.profileInfoValue}>{user?.phone || '0912.345.678'}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <MaterialIcons name="groups" size={18} color="#00e5ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.profileInfoLabel}>Phòng ban / Team</Text>
              <Text style={styles.profileInfoValue}>{employeeTeam}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Thẻ Chức Năng: Xuất Phiếu Lương PDF (Action Card) ── */}
      <View style={styles.payslipCard}>
        <View style={styles.payslipHeader}>
          <View style={styles.payslipIconWrapper}>
            <MaterialIcons name="receipt-long" size={24} color="#00e5ff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.payslipCardTitle}>Bảng Lương Tháng Hiện Tại</Text>
            <Text style={styles.payslipCardSubtitle}>Kỳ lương Tháng {currentMonthYear} • Đã chốt công</Text>
          </View>
        </View>

        <View style={styles.payslipPreviewRow}>
          <View style={styles.payslipStat}>
            <Text style={styles.payslipStatLabel}>Thực nhận (Net)</Text>
            <Text style={styles.payslipStatValue}>21.750.000 đ</Text>
          </View>
          <View style={styles.payslipDivider} />
          <View style={styles.payslipStat}>
            <Text style={styles.payslipStatLabel}>Ngày công thực tế</Text>
            <Text style={[styles.payslipStatValue, { color: '#05e777' }]}>22 / 22 ngày</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.exportPdfBtn, isExporting && styles.exportPdfBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleExportPayslip}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator size="small" color="#0d1516" />
              <Text style={styles.exportPdfBtnText}>Đang tạo file PDF...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="picture-as-pdf" size={18} color="#0d1516" />
              <Text style={styles.exportPdfBtnText}>Xem & Tải PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Hành động tài khoản */}
      <View style={styles.profileActionSection}>
        <TouchableOpacity style={styles.changePasswordBtn} activeOpacity={0.75} onPress={onEditProfile}>
          <MaterialIcons name="edit" size={18} color="#00e5ff" />
          <Text style={styles.changePasswordText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.75} onPress={onLogout}>
          <MaterialIcons name="logout" size={18} color="#ff4d4f" />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  profileCardSection: { gap: 16 },
  profileAvatarSection: {
    alignItems: 'center',
    backgroundColor: '#192122',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.3)',
  },
  profileLargeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,229,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00e5ff',
  },
  profileUserName: { fontSize: 18, fontWeight: '700', color: '#dce4e5', marginTop: 10 },
  profileSpecializationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(0,229,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileSpecializationText: { fontSize: 11, color: '#00e5ff', fontWeight: '600' },
  profileInfoCard: {
    backgroundColor: '#192122',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.3)',
    gap: 12,
  },
  profileInfoRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfoLabel: { fontSize: 11, color: '#849396' },
  profileInfoValue: { fontSize: 13, color: '#dce4e5', fontWeight: '600' },

  // ── Action Card: Bảng Lương PDF ──
  payslipCard: {
    backgroundColor: '#192122',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    gap: 14,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  payslipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payslipIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  payslipCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dce4e5',
  },
  payslipCardSubtitle: {
    fontSize: 12,
    color: '#849396',
    marginTop: 2,
  },
  payslipPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131a1b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.35)',
  },
  payslipStat: {
    flex: 1,
    alignItems: 'center',
  },
  payslipDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(59, 73, 76, 0.5)',
  },
  payslipStatLabel: {
    fontSize: 11,
    color: '#849396',
    marginBottom: 4,
  },
  payslipStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00e5ff',
  },
  exportPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00e5ff',
    height: 44,
    borderRadius: 12,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  exportPdfBtnDisabled: {
    opacity: 0.6,
  },
  exportPdfBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0d1516',
  },

  profileActionSection: { gap: 10, marginTop: 4 },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,229,255,0.12)',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
  },
  changePasswordText: { fontSize: 14, color: '#00e5ff', fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,77,79,0.12)',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,77,79,0.3)',
  },
  logoutText: { fontSize: 14, color: '#ff4d4f', fontWeight: '700' },
});
