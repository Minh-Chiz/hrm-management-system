import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { useTeamleadDashboard, TeamOverviewCard } from '@/features/teamlead';
import { CheckInCard } from '@/features/employee/components/CheckInCard';
import { NotificationModal, ProjectTabContent, CreateRequestModal, EarlyCheckOutModal } from '@/features/employee';
import { EditProfileModal } from '@/components/EditProfileModal';
import { useCreateRequestMutation } from '@/hooks/queries/useRequestQueries';
import { REQUEST_TYPES } from '@/constants/requestTypes';

export default function TeamleadDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createRequestMutation = useCreateRequestMutation();
  const {
    tasks,
    employees,
    onlineMembers,
    teamStats,
    pendingRequests,
    shiftInfo,
    myCheckInHistory,
    user,
    activeEmp,
    activeTab,
    setActiveTab,
    notiModalVisible,
    setNotiModalVisible,
    myNotifications,
    unreadNotiCount,
    handleMarkNotificationAsRead,
    handleMarkAllNotificationsAsRead,
    handleCheckInPress,
    handleApproveRequest,
    logout,
    earlyCheckOutModalVisible,
    setEarlyCheckOutModalVisible,
    confirmEarlyCheckOut,
    wifiSSID,
    isCompanyWifi,
    onToggleWifi,
  } = useTeamleadDashboard() as any;

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Request creation state for TeamLead
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0]);
  const [applyDate, setApplyDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setSelectedType(REQUEST_TYPES[0]);
    setApplyDate('');
    setReason('');
    setAttachedFile(null);
    setCreateModalVisible(true);
  };

  const handleAttachFile = async () => {
    if (attachedFile) {
      setAttachedFile(null);
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setAttachedFile(result.assets[0].name);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở trình chọn tệp.');
    }
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền lý do trước khi gửi.');
      return;
    }
    const formattedDate = applyDate.trim() || new Date().toLocaleDateString('vi-VN');
    await createRequestMutation.mutateAsync({
      senderId: activeEmp?.id || user?.id || 'lead',
      senderName: user?.name || activeEmp?.name || 'Trưởng nhóm',
      role: 'Trưởng nhóm',
      type: selectedType.label as any,
      description: `${selectedType.label} ngày ${formattedDate}`,
      reason: reason.trim(),
      date: formattedDate,
      hasAttachment: !!attachedFile,
      attachmentName: attachedFile || undefined,
    });
    setCreateModalVisible(false);
    setTimeout(() => Alert.alert('✅ Gửi đơn thành công', 'Đơn của trưởng nhóm đã được tạo và lưu hệ thống.'), 300);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <MaterialIcons name="star" size={20} color="#e9c400" />
          </View>
          <View>
            <Text style={styles.greeting}>Xin chào, Trưởng nhóm</Text>
            <Text style={styles.name}>{user?.name ?? 'Lê Hoàng Dương'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => setNotiModalVisible(true)}
          >
            <View>
              <MaterialIcons name="notifications-none" size={22} color="#bac9cc" />
              {unreadNotiCount > 0 && (
                <View style={styles.notiBadge}>
                  <Text style={styles.notiBadgeText}>
                    {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtnPrimary}
            activeOpacity={0.8}
            onPress={handleOpenCreateModal}
          >
            <MaterialIcons name="post-add" size={22} color="#00daf3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <MaterialIcons name="logout" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'dashboard' && (
          <>
            <CheckInCard
              shiftInfo={shiftInfo}
              checkInsHistory={myCheckInHistory}
              wifiSSID={wifiSSID}
              isCompanyWifi={isCompanyWifi}
              onToggleWifi={onToggleWifi}
              onCheckInPress={handleCheckInPress}
            />

            <TeamOverviewCard
              onlineCount={teamStats.onlineCount}
              totalCount={teamStats.totalCount}
              members={onlineMembers}
              completionRate={teamStats.completionRate}
              completedCount={teamStats.completed}
              totalTasks={teamStats.total}
              inReviewCount={teamStats.inReview}
              overdueCount={teamStats.overdue}
              onPressAssignTask={() => router.push('/(tabs)/assign-task' as any)}
            />

            {pendingRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Đơn chờ trưởng nhóm duyệt</Text>
                  <Text style={styles.badge}>{pendingRequests.length}</Text>
                </View>
                {pendingRequests.slice(0, 3).map((req: any) => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reqTitle}>{req.senderName} • {req.type}</Text>
                      <Text style={styles.reqReason} numberOfLines={1}>{req.reason || req.description}</Text>
                    </View>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveRequest(req.id)}>
                      <Text style={styles.approveBtnText}>Duyệt</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Công việc nhóm ({tasks.length})</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/assign-task' as any)}>
                  <Text style={styles.linkText}>+ Giao việc mới</Text>
                </TouchableOpacity>
              </View>

              {tasks.slice(0, 5).map((task: any) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskMeta}>Phụ trách: {task.assigneeName} • Hạn: {task.deadline}</Text>
                  </View>
                  <View style={styles.statusChip}>
                    <Text style={styles.statusText}>{task.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'projects' && <ProjectTabContent tasks={tasks} />}

        {activeTab === 'tasks' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh sách công việc nhóm ({tasks.length})</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/assign-task' as any)}>
                <MaterialIcons name="add" size={16} color="#00141a" />
                <Text style={styles.primaryBtnText}>Giao việc</Text>
              </TouchableOpacity>
            </View>

            {tasks.map((task: any) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>Phụ trách: {task.assigneeName} • Hạn: {task.deadline}</Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusText}>{task.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'team' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đơn chờ duyệt ({pendingRequests.length})</Text>
              </View>
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MaterialIcons name="task-alt" size={32} color="#849396" />
                  <Text style={styles.emptyText}>Không có đơn nào cần xử lý</Text>
                </View>
              ) : (
                pendingRequests.map((req: any) => (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reqTitle}>{req.senderName} • {req.type}</Text>
                      <Text style={styles.reqReason}>{req.reason || req.description}</Text>
                      <Text style={styles.taskMeta}>Ngày: {req.date || req.createdAt}</Text>
                    </View>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveRequest(req.id)}>
                      <Text style={styles.approveBtnText}>Duyệt đơn</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thành viên phòng ban ({employees.length})</Text>
              {employees.map((emp: any) => (
                <View key={emp.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <MaterialIcons name="person" size={20} color="#00e5ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{emp.name}</Text>
                    <Text style={styles.memberMeta}>{emp.role === 'teamlead' ? 'Trưởng nhóm' : 'Nhân viên'} • {emp.team || 'Kỹ thuật'}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: emp.status === 'Active' ? '#05e777' : '#849396' }]} />
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'profile' && (
          <View style={styles.section}>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatarLarge}>
                <MaterialIcons name="star" size={36} color="#e9c400" />
              </View>
              <Text style={styles.profileName}>{user?.name ?? 'Lê Hoàng Dương'}</Text>
              <Text style={styles.profileRole}>Trưởng nhóm • {activeEmp?.team || 'Kỹ thuật'}</Text>

              <View style={styles.profileDivider} />

              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={18} color="#00e5ff" />
                <Text style={styles.infoText}>{user?.email || activeEmp?.email || 'teamlead@company.com'}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={18} color="#00e5ff" />
                <Text style={styles.infoText}>0987.654.321</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, width: '100%' }}>
                <TouchableOpacity style={[styles.editBtn, { flex: 1 }]} onPress={() => setShowEditProfileModal(true)}>
                  <MaterialIcons name="edit" size={18} color="#00141a" />
                  <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                  <MaterialIcons name="logout" size={18} color="#ff4d4f" />
                  <Text style={styles.logoutBtnText}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {([
          { id: 'dashboard', icon: 'dashboard', label: 'Tổng quan' },
          { id: 'projects', icon: 'folder-open', label: 'Dự án' },
          { id: 'tasks', icon: 'assignment', label: 'Công việc' },
          { id: 'team', icon: 'groups', label: 'Đội ngũ', badge: pendingRequests.length },
          { id: 'profile', icon: 'account-circle', label: 'Tài khoản' },
        ] as Array<{ id: 'dashboard' | 'projects' | 'tasks' | 'team' | 'profile'; icon: any; label: string; badge?: number }>).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navTab}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.75}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name={tab.icon} size={22} color={isActive ? '#00e5ff' : '#849396'} />
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modals */}
      <EarlyCheckOutModal
        visible={earlyCheckOutModalVisible}
        shiftName={shiftInfo.activeShiftName}
        shiftEndTime={shiftInfo.shiftEndTime}
        remainingText={shiftInfo.remainingText || ''}
        onCancel={() => setEarlyCheckOutModalVisible(false)}
        onConfirm={confirmEarlyCheckOut}
      />
      <NotificationModal
        visible={notiModalVisible}
        onClose={() => setNotiModalVisible(false)}
        notifications={myNotifications}
        unreadCount={unreadNotiCount}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
      />

      <CreateRequestModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        applyDate={applyDate}
        onApplyDateChange={setApplyDate}
        reason={reason}
        onReasonChange={setReason}
        attachedFile={attachedFile}
        onAttachFile={handleAttachFile}
        onSubmit={handleSubmitRequest}
      />

      <EditProfileModal visible={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1516' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(13,21,22,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,73,76,0.3)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(233, 196, 0, 0.15)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 11, color: '#849396' },
  name: { fontSize: 14, fontWeight: '700', color: '#00daf3' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  iconBtnPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,218,243,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,218,243,0.45)',
  },
  notiBadge: {
    position: 'absolute',
    top: -4,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff4d4f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0d1516',
    paddingHorizontal: 2,
  },
  notiBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff', lineHeight: 11 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#dce4e5' },
  badge: { backgroundColor: '#ff4d4f', color: '#fff', fontSize: 10, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  linkText: { fontSize: 12, color: '#00daf3', fontWeight: '600' },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161f21', padding: 12, borderRadius: 10, gap: 10 },
  reqTitle: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  reqReason: { fontSize: 11, color: '#849396', marginTop: 2 },
  approveBtn: { backgroundColor: '#05e777', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  approveBtnText: { fontSize: 11, fontWeight: '800', color: '#003918' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161f21', padding: 12, borderRadius: 10, gap: 10 },
  taskTitle: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  taskMeta: { fontSize: 11, color: '#849396', marginTop: 2 },
  statusChip: { backgroundColor: 'rgba(0, 218, 243, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, color: '#00daf3', fontWeight: '700' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00e5ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, gap: 4 },
  primaryBtnText: { fontSize: 12, fontWeight: '700', color: '#00141a' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#161f21', borderRadius: 10, gap: 8 },
  emptyText: { fontSize: 13, color: '#849396' },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161f21', padding: 12, borderRadius: 10, gap: 12 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,229,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  memberMeta: { fontSize: 11, color: '#849396', marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  profileCard: { backgroundColor: '#161f21', padding: 20, borderRadius: 12, alignItems: 'center' },
  profileAvatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(233, 196, 0, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  profileRole: { fontSize: 12, color: '#849396', marginTop: 2 },
  profileDivider: { width: '100%', height: 1, backgroundColor: 'rgba(59,73,76,0.3)', marginVertical: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 10 },
  infoText: { fontSize: 13, color: '#dce4e5' },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00e5ff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#00141a' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,77,79,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,79,0.4)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  logoutBtnText: { fontSize: 13, fontWeight: '700', color: '#ff4d4f' },
  bottomNav: { flexDirection: 'row', backgroundColor: 'rgba(13,21,22,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(59,73,76,0.3)', paddingTop: 8 },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  iconContainer: { position: 'relative' },
  navBadge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#ff4d4f', borderRadius: 8, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  navBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  navLabel: { fontSize: 11, color: '#849396', marginTop: 2 },
  navLabelActive: { color: '#00e5ff', fontWeight: '700' },
});
