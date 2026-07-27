import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { Task, PendingRequest, useData } from '@/context/DataContext';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import { EditProfileModal } from '@/components/EditProfileModal';
import { useRealTimeClock } from '@/hooks/useRealTimeClock';
import { REQUEST_TYPES } from '@/constants/requestTypes';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Mock Notifications ────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  { id: 'n1', icon: 'check-circle' as const, iconColor: '#05e777', title: 'Đơn được duyệt', message: 'Đơn xin nghỉ phép ngày 21/07 đã được duyệt.', time: '10 phút trước' },
  { id: 'n2', icon: 'assignment' as const, iconColor: '#00e5ff', title: 'Công việc mới', message: 'Bạn được giao công việc mới: Code giao diện Login.', time: '1 giờ trước' },
  { id: 'n3', icon: 'warning' as const, iconColor: '#f5cd00', title: 'Sắp đến hạn', message: 'Công việc "Fix bug màn Dashboard" sắp đến hạn vào 16/07.', time: '3 giờ trước' },
  { id: 'n4', icon: 'campaign' as const, iconColor: '#bac9cc', title: 'Thông báo hệ thống', message: 'Hệ thống sẽ bảo trì từ 23:00 - 01:00 ngày 20/07/2026.', time: 'Hôm qua' },
];

// ─── Helper ────────────────────────────────────────────────────────────────────
function getTaskStatusStyle(statusType: string) {
  switch (statusType) {
    case 'warning': return { pill: { backgroundColor: 'rgba(245,205,0,0.15)' }, text: { color: '#ffecac' }, border: '#f5cd00' };
    case 'primary': return { pill: { backgroundColor: 'rgba(0,229,255,0.12)' }, text: { color: '#00e5ff' }, border: '#00e5ff' };
    case 'success': return { pill: { backgroundColor: 'rgba(5,231,119,0.12)' }, text: { color: '#7dffa2' }, border: '#05e777' };
    default: return { pill: { backgroundColor: 'rgba(186,201,204,0.10)' }, text: { color: '#bac9cc' }, border: '#849396' };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const { tasks, requests, addRequest, checkIns, addCheckIn, employees, updateTaskStatus, updateTaskProgress, addNotification, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const insets = useSafeAreaInsets();


  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'personal' | 'project' | 'profile'>('personal');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // ── Search & Filter state for personal tasks ──
  const [searchTaskQuery, setSearchTaskQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('Tất cả');

  const activeEmp = employees.find(e => e.name === user?.name || (user?.email && e.email === user.email));
  const currentUserId = user?.id || activeEmp?.id;
  const myTasks = tasks.filter(t => t.assigneeId === activeEmp?.id || (currentUserId && String(t.assigneeId) === String(currentUserId)));
  const myHistory = checkIns.filter(c => (currentUserId && String(c.userId) === String(currentUserId)) || (user?.name && c.userName === user.name));

  const todayIsoDate = new Date().toISOString().split('T')[0];
  const localTodayDate = new Date().toLocaleDateString('vi-VN');
  const todayRecords = myHistory.filter(c => c.date === todayIsoDate || c.date === localTodayDate);

  // Tìm ca làm việc đang dở dang (đã check-in nhưng chưa check-out)
  const openShift = ['Ca Sáng', 'Ca Chiều', 'Ca Tối'].find(s => {
    const shiftRecs = todayRecords.filter(r => (r.shiftName || 'Ca Sáng') === s);
    const hasIn = shiftRecs.some(r => r.type === 'in');
    const hasOut = shiftRecs.some(r => r.type === 'out');
    return hasIn && !hasOut;
  });

  const getShiftNameByTime = (): string => {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    if (hour < 12.0) return 'Ca Sáng';
    if (hour < 17.5) return 'Ca Chiều';
    return 'Ca Tối';
  };

  const currentTimeShift = getShiftNameByTime();
  const checkedIn = !!openShift;
  
  // Kiểm tra xem ca hiện tại theo giờ thực tế đã Check-out chưa
  const currentShiftRecords = todayRecords.filter(r => (r.shiftName || 'Ca Sáng') === currentTimeShift);
  const isCompletedToday = !checkedIn && currentShiftRecords.some(r => r.type === 'out');
  const activeShiftName = openShift || currentTimeShift;

  const myRequests = requests.filter(r => (currentUserId && String(r.senderId) === String(currentUserId)) || r.senderName === user?.name);
  const myNotifications = notifications.filter(n => (currentUserId && String(n.userId) === String(currentUserId)) || n.userId === '1' || n.userId === 'all');
  const unreadNotiCount = myNotifications.filter(n => !n.read).length;


  // Filtered personal tasks list based on search and status filter
  const filteredMyTasks = myTasks.filter((task) => {
    const matchesSearch =
      !searchTaskQuery.trim() ||
      task.title.toLowerCase().includes(searchTaskQuery.toLowerCase().trim());

    let matchesFilter = true;
    if (taskFilter === 'Đang làm') {
      matchesFilter = task.status === 'Đang làm' || task.status === 'Cần làm';
    } else if (taskFilter === 'Chờ test/review') {
      matchesFilter = task.status === 'Chờ test' || task.status === 'Chờ review';
    } else if (taskFilter === 'Hoàn thành') {
      matchesFilter = task.status === 'Hoàn thành';
    } else if (taskFilter === 'Trễ hạn') {
      matchesFilter = task.status === 'Trễ hạn';
    }

    return matchesSearch && matchesFilter;
  });

  // ── Request modal ──
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0]);
  const [applyDate, setApplyDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // ── Notification modal ──
  const [notiModalVisible, setNotiModalVisible] = useState(false);

  // ── All tasks modal ──
  const [allTasksVisible, setAllTasksVisible] = useState(false);

  // ── Task detail modal ──
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [showAllStatusOptions, setShowAllStatusOptions] = useState(false);
  const isAnyModalVisible = modalVisible || notiModalVisible || allTasksVisible || taskDetailVisible;

  const handleUpdateStatus = (status: Task['status'], statusType: Task['statusType']) => {
    if (selectedTask) {
      updateTaskStatus(selectedTask.id, status, statusType);
      setTaskDetailVisible(false);
      setSelectedTask(null);
      Alert.alert('Thành công', `Đã cập nhật trạng thái thành "${status}"`);
    }
  };

  const handleProgressStep = async (newProgress: number) => {
    if (!selectedTask) return;

    if (newProgress === 100) {
      Alert.alert(
        'Xác nhận nộp duyệt hoàn thành 100%',
        `Bạn có chắc chắn đã hoàn thành 100% công việc "${selectedTask.title}" và muốn gửi cho Trưởng nhóm kiểm tra nghiệm thu?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: '📤 GỬI NỘP BÀN GIAO FOR LEAD',
            onPress: async () => {
              await updateTaskProgress(selectedTask.id, 100);
              await updateTaskStatus(selectedTask.id, 'Chờ review', 'primary');
              setSelectedTask((prev) => (prev ? { ...prev, progress: 100, status: 'Chờ review', statusType: 'primary' } : null));
              setTaskDetailVisible(false);
              Alert.alert('Đã gửi nộp duyệt! 📤', 'Công việc 100% đã được gửi đến Hàng chờ nghiệm thu của Trưởng nhóm.');
            },
          },
        ]
      );
      return;
    }

    await updateTaskProgress(selectedTask.id, newProgress);

    const isSlow = newProgress < 50;
    const isNearDeadline = selectedTask.dueType === 'overdue' || selectedTask.status === 'Trễ hạn';

    if (isSlow && isNearDeadline) {
      await addNotification({
        userId: selectedTask.assigneeId,
        title: '⚠️ CẢNH BÁO TIẾN ĐỘ CHẬM (2 NGÀY)',
        message: `Công việc "${selectedTask.title}" sắp tới hạn trong 2 ngày nhưng mới đạt ${newProgress}%. Vui lòng đẩy nhanh tiến độ!`,
        type: 'system',
        icon: 'warning',
        iconColor: '#ff4d4d',
      });
    }

    setSelectedTask((prev) => (prev ? { ...prev, progress: newProgress } : null));
    Alert.alert('Cập nhật tiến độ', `Công việc đã cập nhật tiến độ đạt ${newProgress}%`);
  };

  const handleOpenModal = () => {
    setSelectedType(REQUEST_TYPES[0]); setApplyDate(''); setReason(''); setAttachedFile(null); setModalVisible(true);
  };

  const [fileObj, setFileObj] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const handleAttachFile = async () => {
    // Nếu đã đính kèm tệp, cho phép nhấn vào để xóa
    if (attachedFile) {
      setAttachedFile(null);
      setFileObj(null);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg'], // Giới hạn định dạng
        copyToCacheDirectory: true, // Lưu vào bộ nhớ tạm để chuẩn bị gửi lên server
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Kiểm tra dung lượng (Tối đa 15MB = 15 * 1024 * 1024 bytes)
        const MAX_SIZE = 15 * 1024 * 1024;
        if (file.size && file.size > MAX_SIZE) {
          Alert.alert('Lỗi', 'Dung lượng tệp vượt quá 15MB. Vui lòng chọn tệp nhỏ hơn.');
          return;
        }

        // Cập nhật giao diện
        setAttachedFile(file.name);

        // Lưu trữ đối tượng tệp để gọi API
        setFileObj(file);
      }
    } catch (error) {
      console.error('Lỗi khi chọn tệp:', error);
      Alert.alert('Lỗi', 'Không thể mở trình chọn tệp. Vui lòng thử lại.');
    }
  };

  const handleSubmitRequest = () => {
    if (!reason.trim()) { Alert.alert('Thiếu thông tin', 'Vui lòng điền lý do trước khi gửi.'); return; }
    const formattedDate = applyDate.trim() || new Date().toLocaleDateString('vi-VN');
    addRequest(
      activeEmp?.id || 'guest', activeEmp?.name || 'Nhân viên',
      activeEmp?.role === 'teamlead' ? 'Trưởng nhóm' : 'Nhân viên',
      selectedType.label as PendingRequest['type'], `${selectedType.label} ngày ${formattedDate}`,
      reason, formattedDate, !!attachedFile, attachedFile || undefined
    );
    setModalVisible(false);
    setTimeout(() => Alert.alert('✅ Gửi đơn thành công', 'Đơn của bạn đã được gửi và đang chờ duyệt.', [{ text: 'Đã rõ' }]), 300);
  };

  // ── Check-in animation ──
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const handleCheckInPress = async () => {
    if (isCompletedToday) {
      Alert.alert('Đã hoàn thành', 'Bạn đã hoàn thành điểm danh tất cả các ca hôm nay rồi!', [{ text: 'Đã rõ' }]);
      return;
    }
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = new Date().toISOString().split('T')[0];
    await addCheckIn(String(currentUserId || 'guest'), user?.name || activeEmp?.name || 'Guest', checkedIn ? 'out' : 'in', time, date, activeShiftName);
    pulseAnim.setValue(0);
    Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const { timeStr, dateStr } = useRealTimeClock();

  // ─── Tab: Cá nhân ────────────────────────────────────────────────────────────
  const renderPersonalTab = () => (
    <>
      <View style={styles.timeBanner}>
        <Text style={styles.timeText}>{timeStr}</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      {/* Chấm công */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chấm công hôm nay</Text>
        <View style={styles.attendanceCard}>
          <View style={styles.buttonContainer}>
            <View style={[styles.attendanceGlow, (checkedIn || isCompletedToday) && styles.attendanceGlowActive]} />
            <View style={[styles.fingerprintGlow, (checkedIn || isCompletedToday) && styles.fingerprintGlowActive]} />
            <Animated.View pointerEvents="none" style={[styles.checkInRipple, (checkedIn || isCompletedToday) && styles.checkInRippleActive, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleCheckInPress}>
              <Animated.View style={[styles.checkInButton, (checkedIn || isCompletedToday) && styles.checkInButtonActive, { transform: [{ scale: scaleAnim }] }]}>
                <MaterialIcons name="fingerprint" size={52} color={isCompletedToday ? '#7dffa2' : checkedIn ? '#ffb4ab' : '#00e5ff'} />
                <Text style={[styles.checkInLabel, (checkedIn || isCompletedToday) && styles.checkInLabelActive]}>
                  {isCompletedToday ? 'HOÀN THÀNH' : checkedIn ? 'CHECK-OUT' : 'CHECK-IN'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>
          <Text style={styles.attendanceStatus}>
            {isCompletedToday ? 'Đã hoàn thành tất cả các ca hôm nay' : checkedIn ? `Đã Check-in [${activeShiftName}]` : `Bấm để Check-in [${activeShiftName}]`}
          </Text>
          <View style={styles.statusPills}>
            <View style={styles.statusPill}><MaterialIcons name="location-on" size={13} color="#05e777" /><Text style={styles.statusPillText}>GPS: Nội bộ</Text></View>
            <View style={styles.statusPill}><MaterialIcons name="wifi" size={13} color="#00e5ff" /><Text style={styles.statusPillText}>Wifi: Office_5G</Text></View>
          </View>
          {myHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Lịch sử điểm danh</Text>
              {myHistory.map(item => (
                <View key={item.id} style={styles.historyRow}>
                  <MaterialIcons name={item.type === 'in' ? 'login' : 'logout'} size={14} color={item.type === 'in' ? '#05e777' : '#ffb4ab'} />
                  <Text style={styles.historyText}>
                    <Text style={{ color: item.type === 'in' ? '#05e777' : '#ffb4ab' }}>{item.type === 'in' ? 'Check-in' : 'Check-out'}</Text>
                    {' '}[{item.shiftName || 'Ca Sáng'}] lúc {item.time} ({item.date})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Hiệu suất */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hiệu suất làm việc</Text>
        <View style={styles.analyticsCard}>
          <View style={styles.gaugeCircle}>
            <View style={styles.gaugeRing} />
            <Text style={styles.gaugePercent}>
              {myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === 'Hoàn thành').length / myTasks.length) * 100) : 0}%
            </Text>
            <Text style={styles.gaugeLabel}>HOÀN THÀNH</Text>
          </View>
          <View style={styles.analyticsStats}>
            <View style={styles.statRow}><Text style={styles.statLabel}>Tổng công việc giao:</Text><Text style={styles.statValue}>{myTasks.length}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Đã hoàn thành:</Text><Text style={[styles.statValue, { color: '#7dffa2' }]}>{myTasks.filter(t => t.status === 'Hoàn thành').length}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Số lượt chấm công:</Text><Text style={[styles.statValue, { color: '#00daf3' }]}>{myHistory.length}</Text></View>
          </View>
        </View>
      </View>

      {/* Công việc */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Công việc của tôi</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setAllTasksVisible(true)}>
            <Text style={styles.seeAllLink}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* Ô Tìm kiếm TextInput */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#849396" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm công việc..."
            placeholderTextColor="#849396"
            value={searchTaskQuery}
            onChangeText={setSearchTaskQuery}
          />
          {searchTaskQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTaskQuery('')}>
              <MaterialIcons name="close" size={18} color="#849396" />
            </TouchableOpacity>
          )}
        </View>

        {/* ScrollView Thanh cuộn ngang chứa Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipScrollView}
          contentContainerStyle={styles.filterChipContainer}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          {['Tất cả', 'Đang làm', 'Chờ test/review', 'Hoàn thành', 'Trễ hạn'].map((filter) => {
            const isSelected = taskFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setTaskFilter(filter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.taskList}>
          {myTasks.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIcons name="task-alt" size={28} color="#00e5ff" style={{ opacity: 0.8 }} />
              </View>
              <Text style={styles.emptyStateTitle}>Bạn chưa có công việc nào</Text>
              <Text style={styles.emptyStateSubtitle}>
                Hiện tại bạn chưa được giao công việc nào trong hệ thống.
              </Text>
            </View>
          ) : filteredMyTasks.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialIcons name="task-alt" size={28} color="#00e5ff" style={{ opacity: 0.8 }} />
              </View>
              <Text style={styles.emptyStateTitle}>Không tìm thấy công việc nào</Text>
              <Text style={styles.emptyStateSubtitle}>
                Không tìm thấy công việc nào khớp với từ khóa hoặc bộ lọc của bạn.
              </Text>
            </View>
          ) : (
            filteredMyTasks.map(task => {
              const st = getTaskStatusStyle(task.statusType);
              const getStageBadge = (stage?: string) => {
                switch (stage) {
                  case 'design':
                    return { label: '🎨 Thiết kế', bg: 'rgba(255, 128, 171, 0.2)', text: '#ff80ab' };
                  case 'development':
                    return { label: '💻 Lập trình', bg: 'rgba(245, 205, 0, 0.2)', text: '#f5cd00' };
                  case 'testing':
                    return { label: '🧪 Kiểm thử QA', bg: 'rgba(0, 229, 255, 0.2)', text: '#00e5ff' };
                  case 'completed':
                    return { label: '✅ Hoàn thành', bg: 'rgba(5, 231, 119, 0.2)', text: '#05e777' };
                  default:
                    return { label: 'Công việc', bg: 'rgba(132, 147, 150, 0.2)', text: '#bac9cc' };
                }
              };

              return (
                <TouchableOpacity key={task.id} style={[styles.taskCard, { borderLeftColor: st.border }]} activeOpacity={0.75}
                  onPress={() => { setSelectedTask(task); setTaskDetailVisible(true); }}>
                  <View style={styles.taskCardTop}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                      {task.pipelineStage && (
                        <View style={{ backgroundColor: getStageBadge(task.pipelineStage).bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: getStageBadge(task.pipelineStage).text }}>
                            {getStageBadge(task.pipelineStage).label}
                          </Text>
                        </View>
                      )}
                      <View style={[styles.statusPill2, st.pill]}><Text style={[styles.statusPill2Text, st.text]}>{task.status}</Text></View>
                    </View>
                  </View>

                  {/* Progress Bar & Slow Progress Warning */}
                  <View style={{ marginTop: 8, gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#bac9cc', fontWeight: '600' }}>
                        {task.masterTaskId ? `Tiến độ Chặng (${getStageBadge(task.pipelineStage).label}):` : 'Tiến độ:'}
                      </Text>
                      <Text style={{ fontSize: 11, color: (task.progress || 0) < 50 && (task.dueType === 'overdue' || task.status === 'Trễ hạn') ? '#ff4d4d' : '#00e5ff', fontWeight: '700' }}>
                        {task.progress || 0}%
                      </Text>
                    </View>

                    <View style={{ height: 6, backgroundColor: 'rgba(59, 73, 76, 0.4)', borderRadius: 999, overflow: 'hidden' }}>
                      <View
                        style={{
                          height: '100%',
                          width: `${task.progress || 0}%`,
                          backgroundColor: (task.progress || 0) === 100 ? '#05e777' : (task.progress || 0) < 50 && (task.dueType === 'overdue' || task.status === 'Trễ hạn') ? '#ff4d4d' : '#00e5ff',
                        }}
                      />
                    </View>

                    {/* Master Project Overall Progress Banner if task belongs to a Master Project */}
                    {(task.masterTaskId || task.isMasterProject) && (() => {
                      const masterProj = tasks.find(t => t.id === (task.masterTaskId || task.id));
                      const masterProg = masterProj?.progress || 0;
                      return (
                        <View style={{ marginTop: 4, padding: 6, borderRadius: 8, backgroundColor: 'rgba(0, 229, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 218, 243, 0.2)' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <Text style={{ fontSize: 10, color: '#00daf3', fontWeight: '700' }}>
                              🚀 Tiến độ Tổng Dự án Lớn:
                            </Text>
                            <Text style={{ fontSize: 10, color: '#00daf3', fontWeight: '800' }}>
                              {masterProg}%
                            </Text>
                          </View>
                          <View style={{ height: 4, backgroundColor: 'rgba(59, 73, 76, 0.5)', borderRadius: 999, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${masterProg}%`, backgroundColor: masterProg === 100 ? '#05e777' : '#00daf3' }} />
                          </View>
                        </View>
                      );
                    })()}

                    {(task.progress || 0) < 50 && (task.dueType === 'overdue' || task.status === 'Trễ hạn') && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 77, 77, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 }}>
                        <MaterialIcons name="warning" size={12} color="#ff4d4d" />
                        <Text style={{ color: '#ff4d4d', fontSize: 10, fontWeight: '700' }}>
                          ⚠️ CẢNH BÁO: TIẾN ĐỘ CHẬM ({task.progress || 0}%)
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <View style={styles.taskMeta}>
                      <MaterialIcons name="event" size={13} color="#849396" />
                      <Text style={styles.taskMetaText}>Hạn chót: {task.deadline}</Text>
                    </View>
                    {task.budget && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 229, 255, 0.08)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' }}>
                        <MaterialIcons name="account-balance-wallet" size={12} color="#00e5ff" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#7dffa2' }}>{task.budget}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
      <View style={{ height: 20 }} />
    </>
  );

  // ─── Tab: Dự án ──────────────────────────────────────────────────────────────
  const renderProjectTab = () => {
    const masterProjects = tasks.filter((t) => t.isMasterProject);
    const projects = masterProjects.map((mp) => {
      const subTasks = tasks.filter((t) => t.masterTaskId === mp.id);
      const doneCount = subTasks.filter((t) => t.status === 'Hoàn thành').length;
      return {
        id: mp.id,
        name: mp.title,
        progress: mp.progress || 0,
        totalTasks: Math.max(subTasks.length, 1),
        doneTasks: doneCount,
        statusColor: (mp.progress || 0) === 100 ? '#05e777' : '#00e5ff',
        deadline: mp.deadline,
        budget: mp.budget,
        tasks: subTasks,
      };
    });

    const totalProjectCount = projects.length;
    const totalDoneTasks = projects.reduce((a, p) => a + p.doneTasks, 0);
    const totalPendingTasks = projects.reduce((a, p) => a + (p.totalTasks - p.doneTasks), 0);

    return (
      <>
        {/* Summary Row */}
        <View style={styles.projectSummaryRow}>
          <View style={styles.projectSummaryCard}>
            <MaterialIcons name="folder-open" size={22} color="#00e5ff" />
            <Text style={styles.projectSummaryNum}>{totalProjectCount}</Text>
            <Text style={styles.projectSummaryLabel}>Dự án</Text>
          </View>
          <View style={styles.projectSummaryCard}>
            <MaterialIcons name="assignment-turned-in" size={22} color="#7dffa2" />
            <Text style={[styles.projectSummaryNum, { color: '#7dffa2' }]}>
              {totalDoneTasks}
            </Text>
            <Text style={styles.projectSummaryLabel}>Task xong</Text>
          </View>
          <View style={styles.projectSummaryCard}>
            <MaterialIcons name="pending-actions" size={22} color="#f5cd00" />
            <Text style={[styles.projectSummaryNum, { color: '#f5cd00' }]}>
              {totalPendingTasks}
            </Text>
            <Text style={styles.projectSummaryLabel}>Đang làm</Text>
          </View>
        </View>

        {/* Danh sách Card Dự Án */}
        {projects.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <MaterialIcons name="folder-off" size={40} color="#3b494c" />
            <Text style={{ color: '#849396', fontSize: 13, marginTop: 8 }}>Chưa có dự án lớn nào</Text>
          </View>
        ) : (
          projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              {/* Header Card Dự Án */}
              <View style={styles.projectCardHeader}>
                <View style={[styles.projectIconWrap, { backgroundColor: `${project.statusColor}18` }]}>
                  <MaterialIcons name="folder" size={22} color={project.statusColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <View style={styles.projectMeta}>
                    <MaterialIcons name="event" size={12} color="#849396" />
                    <Text style={styles.projectMetaText}>Hạn: {project.deadline}</Text>
                    <View style={styles.projectMetaDot} />
                    <Text style={styles.projectMetaText}>
                      {project.doneTasks}/{project.totalTasks} tasks
                    </Text>
                  </View>
                  {project.budget && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MaterialIcons name="account-balance-wallet" size={12} color="#00e5ff" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#7dffa2' }}>Vốn: {project.budget}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.projectPercent, { color: project.statusColor }]}>
                  {project.progress}%
                </Text>
              </View>

              {/* Thanh Tiến Độ (Progress Bar) */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${project.progress}%` as `${number}%`, backgroundColor: project.statusColor },
                  ]}
                />
              </View>

              {/* Task Header */}
              {project.tasks.length > 0 && (
                <>
                  <View style={styles.projectTaskHeader}>
                    <MaterialIcons name="assignment" size={13} color="#849396" />
                    <Text style={styles.projectTaskLabel}>Task thuộc dự án</Text>
                  </View>

                  {/* Danh sách Task thuộc Dự án */}
                  <View style={{ gap: 8 }}>
                    {project.tasks.map((task) => {
                      const st = getTaskStatusStyle(task.statusType);
                      return (
                        <View key={task.id} style={[styles.projectTaskItem, { borderLeftColor: st.border }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.projectTaskTitle}>{task.title}</Text>
                            <View style={styles.taskMeta}>
                              <MaterialIcons name="event" size={11} color="#849396" />
                              <Text style={[styles.taskMetaText, { fontSize: 10 }]}>Hạn: {task.deadline}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusPill2, st.pill]}>
                            <Text style={[styles.statusPill2Text, st.text]}>{task.status}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </>
    );
  };

  // ─── Tab: Tài khoản & Profile ────────────────────────────────────────────────
  const renderProfileTab = () => (
    <>
      {/* Khối thông tin cá nhân (User Profile Card) */}
      <View style={styles.profileCardSection}>
        <View style={styles.profileAvatarSection}>
          <View style={styles.profileLargeAvatarGlow}>
            <View style={styles.profileLargeAvatar}>
              <MaterialIcons name="person" size={56} color="#00e5ff" />
            </View>
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
            <View style={styles.profileInfoIconWrap}>
              <MaterialIcons name="email" size={18} color="#00e5ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileInfoLabel}>Email liên hệ</Text>
              <Text style={styles.profileInfoValue}>{activeEmp?.email ?? `${user?.username ?? 'nhanvien'}@company.com`}</Text>
            </View>
          </View>
          <View style={styles.profileInfoDivider} />
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconWrap}>
              <MaterialIcons name="phone" size={18} color="#00e5ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileInfoLabel}>Số điện thoại</Text>
              <Text style={styles.profileInfoValue}>0987.654.321</Text>
            </View>
          </View>
          <View style={styles.profileInfoDivider} />
          <View style={styles.profileInfoRow}>
            <View style={styles.profileInfoIconWrap}>
              <MaterialIcons name="groups" size={18} color="#00e5ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileInfoLabel}>Phòng ban / Team</Text>
              <Text style={styles.profileInfoValue}>{activeEmp?.team ?? 'Phòng Kỹ Thuật'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Danh sách Lịch sử đơn từ (Request History) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử đơn từ ({myRequests.length})</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleOpenModal}>
            <Text style={styles.seeAllLink}>+ Tạo đơn mới</Text>
          </TouchableOpacity>
        </View>

        {myRequests.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconWrapper}>
              <MaterialIcons name="event-note" size={28} color="#00e5ff" style={{ opacity: 0.8 }} />
            </View>
            <Text style={styles.emptyStateTitle}>Chưa có đơn từ nào</Text>
            <Text style={styles.emptyStateSubtitle}>
              Các đơn xin nghỉ, làm thêm giờ (OT) hoặc chấm công bù bạn gửi sẽ xuất hiện ở đây.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {myRequests.map((req) => {
              let statusColor = '#f5cd00';
              let statusBg = 'rgba(245, 205, 0, 0.15)';
              let statusText = 'Đang chờ duyệt';

              if (req.status === 'approved') {
                statusColor = '#05e777';
                statusBg = 'rgba(5, 231, 119, 0.15)';
                statusText = 'Đã duyệt';
              } else if (req.status === 'rejected') {
                statusColor = '#ffb4ab';
                statusBg = 'rgba(255, 180, 171, 0.15)';
                statusText = 'Từ chối';
              }

              const iconName = req.type.includes('OT')
                ? 'more-time'
                : req.type.includes('Nghỉ')
                  ? 'event-busy'
                  : 'edit-calendar';

              return (
                <View key={req.id} style={styles.requestHistoryCard}>
                  <View style={styles.requestHistoryTop}>
                    <View style={styles.requestHistoryTypeRow}>
                      <View style={styles.requestHistoryIconWrap}>
                        <MaterialIcons name={iconName} size={18} color="#00e5ff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestHistoryType}>{req.type}</Text>
                        <Text style={styles.requestHistoryReason} numberOfLines={1}>
                          {req.reason}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill2, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusPill2Text, { color: statusColor }]}>{statusText}</Text>
                    </View>
                  </View>
                  <View style={styles.requestHistoryBottom}>
                    <MaterialIcons name="event" size={13} color="#849396" />
                    <Text style={styles.requestHistoryDate}>Ngày áp dụng: {req.date}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Các nút hành động */}
      <View style={styles.profileActionSection}>
        <TouchableOpacity
          style={styles.changePasswordBtn}
          activeOpacity={0.75}
          onPress={() => setShowEditProfileModal(true)}
        >
          <MaterialIcons name="edit" size={18} color="#00e5ff" />
          <Text style={styles.changePasswordText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.75}
          onPress={logout}
        >
          <MaterialIcons name="logout" size={18} color="#ff4d4f" />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}><MaterialIcons name="person" size={22} color="#00e5ff" /></View>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerName}>{user?.name ?? 'Nhân viên'}</Text>
            <Text style={styles.headerPosition}>{user?.role === 'employee' ? 'Nhân viên' : 'Trưởng nhóm'} - {user?.specialization}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnPrimary} activeOpacity={0.8} onPress={handleOpenModal}>
            <MaterialIcons name="post-add" size={22} color="#00daf3" />
          </TouchableOpacity>
          {/* Notification Bell → opens bottom-sheet modal */}
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => setNotiModalVisible(true)}>
            <View>
              <MaterialIcons name="notifications-none" size={22} color="#bac9cc" />
              {unreadNotiCount > 0 && (
                <View style={styles.notiBadge}>
                  <Text style={styles.notiBadgeText}>{unreadNotiCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {activeTab === 'personal'
          ? renderPersonalTab()
          : activeTab === 'project'
            ? renderProjectTab()
            : renderProfileTab()}
      </ScrollView>

      {/* ── Bottom Navigation (3 tabs) ── */}
      {!isAnyModalVisible && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {([
            { id: 'personal', icon: 'person', label: 'Cá nhân' },
            { id: 'project', icon: 'folder-open', label: 'Dự án' },
            { id: 'profile', icon: 'account-circle', label: 'Tài khoản' },
          ] as const).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={[styles.navTab, isActive && styles.navTabActive]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.75}>
                <MaterialIcons name={tab.icon} size={22} color={isActive ? '#00e5ff' : '#849396'} />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Modal: Thông báo ── */}
      <Modal visible={notiModalVisible} animationType="slide" transparent onRequestClose={() => setNotiModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setNotiModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => { }}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Thông báo</Text>
                <Text style={styles.modalSubtitle}>
                  {unreadNotiCount > 0 ? `${unreadNotiCount} chưa đọc / ${myNotifications.length} tổng cộng` : `${myNotifications.length} thông báo`}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {unreadNotiCount > 0 && (
                  <TouchableOpacity
                    onPress={() => activeEmp?.id && markAllNotificationsAsRead(activeEmp.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, color: '#00e5ff', fontWeight: '600' }}>Đọc tất cả</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setNotiModalVisible(false)} activeOpacity={0.7}>
                  <MaterialIcons name="close" size={20} color="#849396" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}>
              {myNotifications.length === 0 ? (
                <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                  <MaterialIcons name="notifications-none" size={40} color="#3b494c" />
                  <Text style={{ color: '#849396', fontSize: 14, marginTop: 10 }}>Chưa có thông báo nào</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {myNotifications.map(n => (
                    <TouchableOpacity
                      key={n.id}
                      style={[
                        styles.notiItem,
                        !n.read && { backgroundColor: 'rgba(0, 229, 255, 0.05)', borderColor: 'rgba(0, 229, 255, 0.25)', borderWidth: 1 }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => markNotificationAsRead(n.id)}
                    >
                      <View style={[styles.notiIconWrap, { backgroundColor: `${n.iconColor}18` }]}>
                        <MaterialIcons name={n.icon as keyof typeof MaterialIcons.glyphMap} size={20} color={n.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.notiTitle}>{n.title}</Text>
                          {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#00e5ff' }} />}
                        </View>
                        <Text style={styles.notiMessage}>{n.message}</Text>
                        <Text style={styles.notiTime}>{n.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal: Xem tất cả công việc ── */}
      <Modal visible={allTasksVisible} animationType="slide" transparent onRequestClose={() => setAllTasksVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAllTasksVisible(false)}>
          <Pressable style={[styles.modalSheet, { maxHeight: '88%', paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => { }}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tất cả công việc</Text>
                <Text style={styles.modalSubtitle}>{myTasks.length} công việc được giao cho bạn</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAllTasksVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}>
              {myTasks.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <MaterialIcons name="assignment-late" size={40} color="#3b494c" />
                  <Text style={{ color: '#849396', fontSize: 14, marginTop: 10 }}>Bạn chưa có công việc nào được giao</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {myTasks.map(task => {
                    const st = getTaskStatusStyle(task.statusType);
                    return (
                      <TouchableOpacity key={task.id} style={[styles.taskCard, { borderLeftColor: st.border }]} activeOpacity={0.75}
                        onPress={() => { setAllTasksVisible(false); setTimeout(() => { setSelectedTask(task); setTaskDetailVisible(true); }, 200); }}>
                        <View style={styles.taskCardTop}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <View style={[styles.statusPill2, st.pill]}><Text style={[styles.statusPill2Text, st.text]}>{task.status}</Text></View>
                        </View>
                        <View style={styles.taskMeta}><MaterialIcons name="event" size={13} color="#849396" /><Text style={styles.taskMetaText}>Hạn chót: {task.deadline}</Text></View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal: Tạo đơn từ ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
            pointerEvents="box-none"
          >
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Tạo đơn từ</Text>
                  <Text style={styles.modalSubtitle}>Điền thông tin và gửi đơn để quản lý duyệt</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                  <MaterialIcons name="close" size={20} color="#849396" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ gap: 14, paddingBottom: Math.max(insets.bottom + 40, 50) }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                decelerationRate="normal"
                bounces={true}
              >
                <Text style={styles.formLabel}>Loại đơn</Text>
                <View style={styles.typeRow}>
                  {REQUEST_TYPES.map(t => {
                    const isSel = selectedType.id === t.id;
                    return (
                      <TouchableOpacity key={t.id} style={[styles.typeChip, isSel && styles.typeChipSelected]} onPress={() => setSelectedType(t)} activeOpacity={0.75}>
                        <MaterialIcons name={t.icon} size={14} color={isSel ? '#0d1516' : '#849396'} />
                        <Text style={[styles.typeChipText, isSel && styles.typeChipTextSelected]}>{t.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.formLabel}>Ngày áp dụng</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="event" size={16} color="#849396" style={styles.inputIcon} />
                  <TextInput style={styles.textInput} placeholder="VD: 19/07/2026 hoặc 19-20/07/2026" placeholderTextColor="#3b494c" value={applyDate} onChangeText={setApplyDate} keyboardAppearance="dark" />
                </View>
                <Text style={styles.formLabel}>Lý do</Text>
                <TextInput style={styles.textArea} placeholder="Mô tả chi tiết lý do gửi đơn..." placeholderTextColor="#3b494c" value={reason} onChangeText={setReason} multiline numberOfLines={4} textAlignVertical="top" keyboardAppearance="dark" />
                <Text style={styles.formLabel}>Tệp đính kèm (tuỳ chọn)</Text>
                <TouchableOpacity style={[styles.uploadZone, attachedFile ? styles.uploadZoneAttached : null]} onPress={handleAttachFile} activeOpacity={0.75}>
                  {attachedFile ? (
                    <><MaterialIcons name="check-circle" size={22} color="#05e777" /><View style={{ flex: 1 }}><Text style={styles.uploadAttachedName}>{attachedFile}</Text><Text style={styles.uploadHint}>Nhấn để xoá tệp</Text></View></>
                  ) : (
                    <><MaterialIcons name="attach-file" size={22} color="#00daf3" /><View style={{ flex: 1 }}><Text style={styles.uploadTitle}>Tải tệp minh chứng lên</Text><Text style={styles.uploadHint}>PDF, PNG, JPG — tối đa 15MB</Text></View><MaterialIcons name="chevron-right" size={18} color="#3b494c" /></>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRequest} activeOpacity={0.85}>
                  <MaterialIcons name="send" size={16} color="#003918" />
                  <Text style={styles.submitBtnText}>XÁC NHẬN GỬI</Text>
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal: Chi tiết Task ── */}
      <Modal visible={taskDetailVisible} animationType="slide" transparent onRequestClose={() => setTaskDetailVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setTaskDetailVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => { }}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedTask?.title}</Text>
                <Text style={styles.modalSubtitle}>Cập nhật trạng thái công việc của bạn</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setTaskDetailVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
            <View style={{ paddingBottom: 24, gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="event" size={16} color="#849396" />
                  <Text style={{ color: '#bac9cc', fontSize: 13 }}>Hạn chót: {selectedTask?.deadline}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="info-outline" size={16} color="#849396" />
                  <Text style={{ color: '#00e5ff', fontSize: 13, fontWeight: '700' }}>{selectedTask?.status}</Text>
                </View>
              </View>

              {/* ── Progress Update Section (%) ── */}
              <View style={{ backgroundColor: '#192122', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(59, 73, 76, 0.3)', gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#dce4e5', fontWeight: '700', fontSize: 13 }}>Cập nhật tiến độ hoàn thành (%):</Text>
                  <Text style={{ color: '#00e5ff', fontWeight: '800', fontSize: 15 }}>{selectedTask?.progress || 0}%</Text>
                </View>

                {/* Visual Progress Bar */}
                <View style={{ height: 8, backgroundColor: 'rgba(59, 73, 76, 0.4)', borderRadius: 999, overflow: 'hidden', marginVertical: 4 }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${selectedTask?.progress || 0}%`,
                      backgroundColor: (selectedTask?.progress || 0) === 100 ? '#05e777' : (selectedTask?.progress || 0) < 50 && (selectedTask?.dueType === 'overdue' || selectedTask?.status === 'Trễ hạn') ? '#ff4d4d' : '#00e5ff',
                    }}
                  />
                </View>

                {/* Quick Step Buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[0, 25, 50, 75, 100].map((step) => {
                    const isSelected = (selectedTask?.progress || 0) === step;
                    return (
                      <TouchableOpacity
                        key={step}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.2)' : '#252525',
                          borderWidth: 1,
                          borderColor: isSelected ? '#00e5ff' : 'rgba(59, 73, 76, 0.3)',
                        }}
                        onPress={() => handleProgressStep(step)}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#00e5ff' : '#849396' }}>
                          {step}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Contextual Action Button ── */}
              {selectedTask?.status === 'Cần làm' && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#f5cd00',
                    borderRadius: 14,
                    height: 50,
                    marginTop: 6,
                  }}
                  activeOpacity={0.85}
                  onPress={() => handleUpdateStatus('Đang làm', 'warning')}
                >
                  <MaterialIcons name="play-arrow" size={22} color="#0d1516" />
                  <Text style={{ color: '#0d1516', fontWeight: '800', fontSize: 15 }}>▶ BẮT ĐẦU THỰC HIỆN</Text>
                </TouchableOpacity>
              )}

              {(selectedTask?.status === 'Đang làm' || selectedTask?.status === 'Trễ hạn') && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#00e5ff',
                    borderRadius: 14,
                    height: 50,
                    marginTop: 6,
                  }}
                  activeOpacity={0.85}
                  onPress={() => handleUpdateStatus('Chờ review', 'primary')}
                >
                  <MaterialIcons name="send" size={18} color="#00363d" />
                  <Text style={{ color: '#00363d', fontWeight: '800', fontSize: 15 }}>📤 GỬI DUYỆT / KIỂM THỬ</Text>
                </TouchableOpacity>
              )}

              {(selectedTask?.status === 'Chờ test' || selectedTask?.status === 'Chờ review') && (
                <View
                  style={{
                    backgroundColor: 'rgba(0, 229, 255, 0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(0, 229, 255, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <MaterialIcons name="hourglass-top" size={24} color="#00e5ff" />
                  <Text style={{ color: '#00e5ff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
                    Đã gửi kiểm thử / review
                  </Text>
                  <Text style={{ color: '#849396', fontSize: 12, textAlign: 'center' }}>
                    Công việc đang chờ Trưởng nhóm nghiệm thu và xác nhận hoàn thành.
                  </Text>
                </View>
              )}

              {selectedTask?.status === 'Hoàn thành' && (
                <View
                  style={{
                    backgroundColor: 'rgba(5, 231, 119, 0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(5, 231, 119, 0.3)',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
                  <MaterialIcons name="check-circle" size={24} color="#05e777" />
                  <Text style={{ color: '#05e777', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
                    Công việc đã hoàn thành 🎉
                  </Text>
                  <Text style={{ color: '#849396', fontSize: 12, textAlign: 'center' }}>
                    Công việc này đã được nghiệm thu và đánh giá thành công.
                  </Text>
                </View>
              )}

              {/* ── Option to show all manual status choices ── */}
              <TouchableOpacity
                onPress={() => setShowAllStatusOptions(!showAllStatusOptions)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginTop: 4 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#849396', fontSize: 12, fontWeight: '600' }}>
                  {showAllStatusOptions ? 'Ẩn tuỳ chọn thủ công' : 'Chuyển trạng thái khác...'}
                </Text>
                <MaterialIcons name={showAllStatusOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color="#849396" />
              </TouchableOpacity>

              {showAllStatusOptions && (
                <View style={{ gap: 8, marginTop: 4 }}>
                  {([
                    { status: 'Cần làm', statusType: 'neutral', icon: 'schedule', color: '#849396', desc: 'Chưa bắt đầu' },
                    { status: 'Đang làm', statusType: 'warning', icon: 'trending-flat', color: '#f5cd00', desc: 'Đang thực hiện' },
                    { status: 'Chờ review', statusType: 'primary', icon: 'rate-review', color: '#00e5ff', desc: 'Chờ Team Lead kiểm tra' },
                    { status: 'Hoàn thành', statusType: 'success', icon: 'check-circle', color: '#05e777', desc: 'Hoàn tất nghiệm thu' },
                  ] as const).map(opt => {
                    const isCur = selectedTask?.status === opt.status;
                    return (
                      <TouchableOpacity
                        key={opt.status}
                        onPress={() => handleUpdateStatus(opt.status, opt.statusType)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                          borderRadius: 10,
                          backgroundColor: isCur ? 'rgba(0,229,255,0.08)' : '#242b2d',
                          borderWidth: 1,
                          borderColor: isCur ? 'rgba(0,229,255,0.4)' : 'rgba(59,73,76,0.3)',
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <MaterialIcons name={opt.icon as keyof typeof MaterialIcons.glyphMap} size={18} color={opt.color} />
                          <Text style={{ color: isCur ? '#00e5ff' : '#dce4e5', fontWeight: '600', fontSize: 13 }}>{opt.status}</Text>
                        </View>
                        {isCur && <MaterialIcons name="check" size={18} color="#00e5ff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1516',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(13,21,22,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,73,76,0.25)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00daf3',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#00daf3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  newRequestBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d1516',
    letterSpacing: 0.3,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(0,229,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#05e777',
    borderWidth: 2,
    borderColor: '#0d1516',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dce4e5',
  },
  headerPosition: {
    fontSize: 11,
    color: '#849396',
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPrimary: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  notiBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 11,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  timeBanner: {
    backgroundColor: '#151d1e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.4)',
  },
  timeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#c3f5ff',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    color: '#849396',
    marginTop: 2,
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dce4e5',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 12,
    color: '#00e5ff',
    fontWeight: '600',
  },

  attendanceCard: {
    backgroundColor: '#192122',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.35)',
    overflow: 'visible',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
  },
  attendanceGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  attendanceGlowActive: {
    backgroundColor: 'rgba(5,231,119,0.05)',
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 176,
    height: 176,
    overflow: 'visible',
  },
  fingerprintGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 88,
    backgroundColor: 'rgba(0,229,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.20)',
  },
  fingerprintGlowActive: {
    backgroundColor: 'rgba(5,231,119,0.10)',
    borderColor: 'rgba(5,231,119,0.20)',
  },
  checkInButton: {
    zIndex: 10,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#242b2d',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkInButtonActive: {
    borderColor: 'rgba(5,231,119,0.40)',
  },
  checkInRipple: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(0,229,255,0.6)',
  },
  checkInRippleActive: {
    borderColor: 'rgba(5,231,119,0.6)',
  },
  checkInLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  checkInLabelActive: {
    color: '#7dffa2',
  },
  attendanceStatus: {
    fontSize: 13,
    color: '#bac9cc',
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#242b2d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.4)',
  },
  statusPillText: {
    fontSize: 11,
    color: '#bac9cc',
    fontWeight: '500',
  },

  historyContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.3)',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151d1e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.2)',
  },
  historyText: {
    fontSize: 12,
    color: '#bac9cc',
    marginLeft: 6,
  },

  analyticsCard: {
    backgroundColor: '#192122',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.3)',
    flexDirection: 'row',
    gap: 16,
  },
  gaugeCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#242b2d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#3b494c',
    position: 'relative',
  },
  gaugeRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#00e5ff',
    opacity: 0.8,
  },
  gaugePercent: {
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: '800',
  },
  gaugeLabel: {
    color: '#849396',
    fontSize: 8,
    marginTop: 2,
    fontWeight: '600',
  },
  analyticsStats: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#bac9cc',
    fontSize: 13,
  },
  statValue: {
    color: '#dce4e5',
    fontWeight: '700',
    fontSize: 14,
  },

  taskList: {
    gap: 10,
  },
  taskCard: {
    backgroundColor: '#192122',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.25)',
    borderRightColor: 'rgba(59,73,76,0.25)',
    borderBottomColor: 'rgba(59,73,76,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#dce4e5',
    lineHeight: 20,
  },
  statusPill2: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusPill2Text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaText: {
    fontSize: 11,
    color: '#849396',
  },

  projectSummaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  projectSummaryCard: {
    flex: 1,
    backgroundColor: '#151d1e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.3)',
  },
  projectSummaryNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#dce4e5',
  },
  projectSummaryLabel: {
    fontSize: 10,
    color: '#849396',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectCard: {
    backgroundColor: '#192122',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  projectCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  projectIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dce4e5',
    marginBottom: 4,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectMetaText: {
    fontSize: 11,
    color: '#849396',
  },
  projectMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3b494c',
  },
  projectPercent: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#252525',
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    opacity: 0.9,
  },
  projectTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,73,76,0.25)',
  },
  projectTaskLabel: {
    fontSize: 11,
    color: '#849396',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151d1e',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.2)',
    borderRightColor: 'rgba(59,73,76,0.2)',
    borderBottomColor: 'rgba(59,73,76,0.2)',
    gap: 10,
  },
  projectTaskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dce4e5',
    marginBottom: 4,
  },

  notiItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#192122',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.3)',
  },
  notiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dce4e5',
    marginBottom: 3,
  },
  notiMessage: {
    fontSize: 12,
    color: '#bac9cc',
    lineHeight: 18,
    marginBottom: 4,
  },
  notiTime: {
    fontSize: 10,
    color: '#849396',
    fontWeight: '500',
  },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(25,33,34,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.35)',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  navTabActive: {
    backgroundColor: 'rgba(0,229,255,0.10)',
  },
  navLabel: {
    fontSize: 10,
    color: '#849396',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#151d1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '92%',
    flexShrink: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2e3638',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dce4e5',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#849396',
    marginTop: 3,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#192122',
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
  },
  typeChipSelected: {
    backgroundColor: '#00daf3',
    borderColor: '#00daf3',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
  },
  typeChipTextSelected: {
    color: '#0d1516',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#192122',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    color: '#dce4e5',
  },
  textArea: {
    backgroundColor: '#192122',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
    padding: 12,
    fontSize: 13,
    color: '#dce4e5',
    minHeight: 90,
    marginBottom: 10,
    lineHeight: 20,
  },

  uploadZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#192122',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,218,243,0.3)',
    marginBottom: 12,
  },
  uploadZoneAttached: {
    borderColor: 'rgba(5,231,119,0.4)',
    backgroundColor: 'rgba(5,231,119,0.05)',
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00daf3',
  },
  uploadAttachedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#05e777',
  },
  uploadHint: {
    fontSize: 11,
    color: '#849396',
    marginTop: 2,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#05e777',
    shadowColor: '#05e777',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003918',
    letterSpacing: 1,
  },

  // ── Search & Filter Styles ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162224',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#e1f7f9',
    paddingVertical: 4,
  },
  filterChipScrollView: {
    marginBottom: 14,
  },
  filterChipContainer: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#162224',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipSelected: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00e5ff',
  },
  filterChipText: {
    fontSize: 12,
    color: '#849396',
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#00e5ff',
    fontWeight: '600',
  },

  // ── Empty State Styles ──
  emptyStateContainer: {
    backgroundColor: '#151d1e',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  emptyIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e1f7f9',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#849396',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Profile & Request History Styles ──
  profileCardSection: {
    backgroundColor: '#192122',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileLargeAvatarGlow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  profileLargeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#162224',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileUserName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e1f7f9',
    marginBottom: 6,
  },
  profileSpecializationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  profileSpecializationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00e5ff',
  },
  profileInfoCard: {
    backgroundColor: '#151d1e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  profileInfoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoLabel: {
    fontSize: 11,
    color: '#849396',
    fontWeight: '500',
  },
  profileInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dce4e5',
    marginTop: 2,
  },
  profileInfoDivider: {
    height: 1,
    backgroundColor: 'rgba(59, 73, 76, 0.25)',
    marginVertical: 4,
  },
  requestHistoryCard: {
    backgroundColor: '#192122',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.35)',
  },
  requestHistoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestHistoryTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  requestHistoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestHistoryType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e1f7f9',
  },
  requestHistoryReason: {
    fontSize: 12,
    color: '#849396',
    marginTop: 2,
  },
  requestHistoryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.2)',
  },
  requestHistoryDate: {
    fontSize: 11,
    color: '#849396',
  },
  profileActionSection: {
    gap: 12,
    marginTop: 8,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  changePasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00e5ff',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.3)',
    backgroundColor: 'rgba(255, 77, 79, 0.12)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff4d4f',
  },
});
