import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PendingRequest, Employee } from '@/types';

interface ProfileTabContentProps {
  user: { name?: string; role?: string; specialization?: string; username?: string } | null;
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
  return (
    <View style={styles.container}>
      <View style={styles.profileCardSection}>
        <View style={styles.profileAvatarSection}>
          <View style={styles.profileLargeAvatar}>
            <MaterialIcons name="person" size={56} color="#00e5ff" />
          </View>
          <Text style={styles.profileUserName}>{user?.name ?? 'Nhân viên'}</Text>
          <View style={styles.profileSpecializationBadge}>
            <MaterialIcons name="workspace-premium" size={14} color="#00e5ff" />
            <Text style={styles.profileSpecializationText}>
              {user?.role === 'employee' ? 'Nhân viên' : 'Trưởng nhóm'} • {user?.specialization ?? 'Chuyên viên'}
            </Text>
          </View>
        </View>

        <View style={styles.profileInfoCard}>
          <View style={styles.profileInfoRow}>
            <MaterialIcons name="email" size={18} color="#00e5ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.profileInfoLabel}>Email liên hệ</Text>
              <Text style={styles.profileInfoValue}>{activeEmp?.email ?? `${user?.username ?? 'nhanvien'}@company.com`}</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <MaterialIcons name="phone" size={18} color="#00e5ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.profileInfoLabel}>Số điện thoại</Text>
              <Text style={styles.profileInfoValue}>0987.654.321</Text>
            </View>
          </View>
          <View style={styles.profileInfoRow}>
            <MaterialIcons name="groups" size={18} color="#00e5ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.profileInfoLabel}>Phòng ban / Team</Text>
              <Text style={styles.profileInfoValue}>{activeEmp?.team ?? 'Phòng Kỹ Thuật'}</Text>
            </View>
          </View>
        </View>
      </View>

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
  profileAvatarSection: { alignItems: 'center', backgroundColor: '#192122', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  profileLargeAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,229,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00e5ff' },
  profileUserName: { fontSize: 18, fontWeight: '700', color: '#dce4e5', marginTop: 10 },
  profileSpecializationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: 'rgba(0,229,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  profileSpecializationText: { fontSize: 11, color: '#00e5ff', fontWeight: '600' },
  profileInfoCard: { backgroundColor: '#192122', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', gap: 12 },
  profileInfoRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfoLabel: { fontSize: 11, color: '#849396' },
  profileInfoValue: { fontSize: 13, color: '#dce4e5', fontWeight: '600' },
  profileActionSection: { gap: 10, marginTop: 10 },
  changePasswordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,229,255,0.12)', height: 48, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)' },
  changePasswordText: { fontSize: 14, color: '#00e5ff', fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,77,79,0.12)', height: 48, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,77,79,0.3)' },
  logoutText: { fontSize: 14, color: '#ff4d4f', fontWeight: '700' },
});
