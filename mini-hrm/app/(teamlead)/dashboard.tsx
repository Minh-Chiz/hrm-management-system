import * as DocumentPicker from 'expo-document-picker';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useData, Task, PendingRequest } from '@/context/DataContext';
import { EditProfileModal } from '@/components/EditProfileModal';
import { useRealTimeClock } from '@/hooks/useRealTimeClock';
import { REQUEST_TYPES } from '@/constants/requestTypes';

function getTaskStatusStyle(statusType: string) {
  switch (statusType) {
    case 'warning':
      return {
        pill: { backgroundColor: 'rgba(245, 205, 0, 0.15)' },
        text: { color: '#ffecac' },
        border: '#f5cd00',
      };
    case 'primary':
      return {
        pill: { backgroundColor: 'rgba(0, 229, 255, 0.12)' },
        text: { color: '#00e5ff' },
        border: '#00e5ff',
      };
    case 'success':
      return {
        pill: { backgroundColor: 'rgba(5, 231, 119, 0.12)' },
        text: { color: '#7dffa2' },
        border: '#05e777',
      };
    default:
      return {
        pill: { backgroundColor: 'rgba(186, 201, 204, 0.10)' },
        text: { color: '#bac9cc' },
        border: '#849396',
      };
  }
}

function getStageBadge(stage?: string) {
  switch (stage) {
    case 'design':
      return { label: '🎨 Thiết kế', bg: 'rgba(255,128,171,0.12)', text: '#ff80ab' };
    case 'development':
      return { label: '💻 Lập trình', bg: 'rgba(245,205,0,0.12)', text: '#f5cd00' };
    case 'testing':
      return { label: '🧪 Kiểm thử', bg: 'rgba(0,229,255,0.12)', text: '#00e5ff' };
    case 'completed':
    default:
      return { label: '🚀 Hoàn thành', bg: 'rgba(5,231,119,0.12)', text: '#05e777' };
  }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ONLINE_MEMBERS = [
  { id: '1', initials: 'LT', name: 'Lê Thị B', color: '#05e777' },
  { id: '2', initials: 'TT', name: 'Thanh Tùng', color: '#00e5ff' },
  { id: '3', initials: 'MP', name: 'Mai Phương', color: '#ffecac' },
];
const EXTRA_MEMBERS = 3;

const TEAM_TASKS = [
  {
    id: '1',
    title: 'Fix bug giao diện mobile',
    status: 'Đang kiểm thử',
    statusType: 'warning',
    assignee: 'Thanh Tùng',
    assigneeInitials: 'TT',
    due: 'Hôm nay',
    dueType: 'normal',
  },
  {
    id: '2',
    title: 'Tối ưu API Dashboard',
    status: 'Trễ hạn',
    statusType: 'danger',
    assignee: 'Mai Phương',
    assigneeInitials: 'MP',
    due: '-2 ngày',
    dueType: 'overdue',
  },
  {
    id: '3',
    title: 'Review Code Component Nav',
    status: 'Đang xử lý',
    statusType: 'primary',
    assignee: 'Lê Hoàng Dương',
    assigneeInitials: 'LHD',
    due: 'Ngày mai',
    dueType: 'normal',
  },
  {
    id: '4',
    title: 'Viết tài liệu API v2.0',
    status: 'Cần làm',
    statusType: 'neutral',
    assignee: 'Lê Thị B',
    assigneeInitials: 'LT',
    due: '20/07/2026',
    dueType: 'normal',
  },
];

// ─── Team Requests ──────────────────────────────────────────────────────────

type ReqStatus = 'pending' | 'approved' | 'rejected';

interface TeamRequest {
  id: string;
  memberName: string;
  memberInitials: string;
  memberColor: string;
  type: string;
  typeIcon: 'more-time' | 'event-busy' | 'edit-calendar';
  reason: string;
  date: string;
  timeAgo: string;
  status: ReqStatus;
  hasAttachment?: boolean;
  attachmentName?: string;
}

const INITIAL_TEAM_REQUESTS: TeamRequest[] = [
  {
    id: 'r1',
    memberName: 'Thanh Tùng',
    memberInitials: 'TT',
    memberColor: '#00e5ff',
    type: 'Làm thêm giờ (OT)',
    typeIcon: 'more-time',
    reason: 'OT fix bug release',
    date: '19-20/07/2026',
    timeAgo: '2 giờ trước',
    status: 'pending',
    hasAttachment: true,
    attachmentName: 'log_loi_he_thong.png',
  },
  {
    id: 'r2',
    memberName: 'Lê Thị B',
    memberInitials: 'LT',
    memberColor: '#05e777',
    type: 'Nghỉ phép',
    typeIcon: 'event-busy',
    reason: 'Đi khám bệnh theo lịch định kỳ',
    date: '21/07/2026',
    timeAgo: '5 giờ trước',
    status: 'pending',
  },
  {
    id: 'r3',
    memberName: 'Mai Phương',
    memberInitials: 'MP',
    memberColor: '#ffecac',
    type: 'Chấm công bù',
    typeIcon: 'edit-calendar',
    reason: 'Quên check-in sáng do vào từ cửa phụ',
    date: '16/07/2026',
    timeAgo: 'Hôm qua',
    status: 'pending',
    hasAttachment: true,
    attachmentName: 'anh_camera_cua_phu.jpg',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTaskStyle(type: string) {
  switch (type) {
    case 'warning':
      return { border: '#f5cd00', pill: 'rgba(245,205,0,0.13)', text: '#ffecac' };
    case 'danger':
      return { border: '#ffb4ab', pill: 'rgba(255,180,171,0.13)', text: '#ffb4ab' };
    case 'primary':
      return { border: '#00e5ff', pill: 'rgba(0,229,255,0.10)', text: '#c3f5ff' };
    case 'success':
      return { border: '#05e777', pill: 'rgba(5,231,119,0.13)', text: '#7dffa2' };
    default:
      return { border: '#849396', pill: 'rgba(132,147,150,0.12)', text: '#bac9cc' };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamLeadDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { tasks, requests, updateRequestStatus, employees, checkIns, addCheckIn, addRequest, updateTaskStatus, updateTaskProgress, addNotification, advanceMasterPipelineStage, deleteTask, updateTask, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'me' | 'team' | 'requests'>('team');
  const [customSubTaskTitle, setCustomSubTaskTitle] = useState('');
  const [showRejectProgressPicker, setShowRejectProgressPicker] = useState(false);
  const [adjustProgressVal, setAdjustProgressVal] = useState(70);
  const [notiModalVisible, setNotiModalVisible] = useState(false);
  const initialBottomTab = params.tab && ['team', 'projects', 'requests', 'personal'].includes(params.tab)
    ? (params.tab as 'team' | 'projects' | 'requests' | 'personal')
    : 'team';
  const [bottomTab, setBottomTab] = useState<'team' | 'projects' | 'requests' | 'personal'>(initialBottomTab);

  useEffect(() => {
    if (params.tab && ['team', 'projects', 'requests', 'personal'].includes(params.tab)) {
      setBottomTab(params.tab as 'team' | 'projects' | 'requests' | 'personal');
    }
  }, [params.tab]);

  // Find active employee record and team details
  const activeEmp = employees.find(e => e.name === user?.name);
  const teamMembers = employees.filter(e => activeEmp?.specialization ? e.specialization === activeEmp.specialization : true);
  const teamMemberIds = teamMembers.map(e => e.id);

  // Filter tasks based on selected tab and team specialization
  const teamTasks = tasks.filter((t) => teamMemberIds.includes(t.assigneeId));
  const displayTasks = activeTab === 'me'
    ? tasks.filter((t) => t.assigneeId === activeEmp?.id)
    : teamTasks;

  // Calculate stats dynamically based on team specialization
  const completedTasks = teamTasks.filter(t => t.status === 'Hoàn thành').length;
  const totalTasks = teamTasks.length;
  const teamProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter requests based on team specialization
  const teamRequests = requests.filter((r) => {
    const sender = employees.find(e => e.id === r.senderId);
    return sender && (activeEmp?.specialization ? sender.specialization === activeEmp.specialization : true);
  });
  const pendingCount = teamRequests.filter((r) => r.status === 'pending').length;

  const handleApprove = (id: string) => updateRequestStatus(id, 'approved');
  const handleReject = (id: string) => updateRequestStatus(id, 'rejected');

  // Dynamic online members from the team (excluding the lead themselves and only active status)
  const activeTeamMembers = teamMembers.filter(e => e.id !== activeEmp?.id && e.status === 'Active');
  const onlineMembers = activeTeamMembers.slice(0, 3).map(m => {
    const initials = m.name.trim().split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join('');
    return {
      id: m.id,
      initials: initials || '?',
      name: m.name,
      color: m.accentColor || '#00e5ff',
    };
  });
  const extraMembersCount = Math.max(0, activeTeamMembers.length - 3);

  const myNotifications = notifications.filter(n => n.userId === activeEmp?.id || n.userId === '3' || n.userId === 'all');
  const unreadNotiCount = myNotifications.filter(n => !n.read).length;


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

  // Check-in animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handleCheckInPress = async () => {
    if (isCompletedToday) {
      Alert.alert('Đã hoàn thành', 'Bạn đã hoàn thành điểm danh tất cả các ca hôm nay rồi!', [{ text: 'Đã rõ' }]);
      return;
    }
    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toISOString().split('T')[0];

    await addCheckIn(
      String(currentUserId || 'guest'),
      user?.name || activeEmp?.name || 'Guest',
      checkedIn ? 'out' : 'in',
      currentTime,
      currentDate,
      activeShiftName
    );

    pulseAnim.setValue(0);
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 550,
      useNativeDriver: true,
    }).start();
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  // ── Modal: Tạo đơn từ ──
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0]);
  const [applyDate, setApplyDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const handleOpenModal = () => {
    setSelectedType(REQUEST_TYPES[0]);
    setApplyDate('');
    setReason('');
    setAttachedFile(null);
    setModalVisible(true);
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
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền lý do trước khi gửi.');
      return;
    }

    const formattedDate = applyDate.trim() || new Date().toLocaleDateString('vi-VN');
    addRequest(
      activeEmp?.id || 'guest',
      activeEmp?.name || 'Nhân viên',
      'Trưởng nhóm',
      selectedType.label as PendingRequest['type'],
      `${selectedType.label} ngày ${formattedDate}`,
      reason,
      formattedDate,
      !!attachedFile,
      attachedFile || undefined
    );

    setModalVisible(false);
    setTimeout(() => {
      Alert.alert(
        '✅ Gửi đơn thành công',
        'Đơn của bạn đã được gửi và đang chờ duyệt.',
        [{ text: 'Đã rõ', style: 'default' }]
      );
    }, 300);
  };

  // ── Modal: Chi tiết & Cập nhật trạng thái Task ──
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);

  const handleUpdateStatus = (status: Task['status'], statusType: Task['statusType']) => {
    if (selectedTask) {
      updateTaskStatus(selectedTask.id, status, statusType);
      setTaskDetailVisible(false);
      setSelectedTask(null);
      Alert.alert('Thành công', `Đã cập nhật trạng thái thành "${status}"`);
    }
  };

  // ── State Chỉnh sửa công việc (Edit Task) ──
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editSupporters, setEditSupporters] = useState<string[]>([]);
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState<Task['status']>('Cần làm');

  // Kiểm tra quyền chỉnh sửa / xóa Dự án Lớn
  const canManageProject = (task: Task) => {
    // Quản trị viên (Admin) có toàn quyền sửa/xóa
    if (user?.role === 'admin') return true;

    // Nếu là Dự án Lớn hoặc subtask thuộc Dự án Lớn:
    if (task.isMasterProject || task.masterTaskId) {
      const masterTask = task.isMasterProject
        ? task
        : tasks.find((t) => t.id === task.masterTaskId);

      if (!masterTask) return true;

      const ownerId = masterTask.creatorId || masterTask.assigneeId;
      const ownerName = masterTask.creatorName || masterTask.assigneeName;

      if (!ownerId && !ownerName) return true;

      // Chỉ Trưởng nhóm đã tạo Dự án Lớn này mới được phép sửa/xóa
      const isOwner =
        (ownerId && activeEmp?.id && ownerId === activeEmp.id) ||
        (ownerName && activeEmp?.name && ownerName === activeEmp.name) ||
        (ownerName && user?.name && ownerName === user.name);

      return isOwner;
    }

    return true;
  };

  const handleDeleteTask = (id: string, title: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (targetTask && !canManageProject(targetTask)) {
      const masterTask = targetTask.isMasterProject
        ? targetTask
        : tasks.find((t) => t.id === targetTask.masterTaskId);
      const ownerName = masterTask?.creatorName || masterTask?.assigneeName || 'bên khác';
      Alert.alert(
        'Hạn chế quyền 🔒',
        `Dự án Lớn này do ${ownerName} khởi tạo. Bên khác có thể XEM tiến độ nhưng không có quyền XÓA.`
      );
      return;
    }

    Alert.alert(
      'Xác nhận xóa 🗑️',
      `Bạn có chắc chắn muốn xóa công việc "${title}" không? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deleteTask(id) }
      ]
    );
  };

  const handleEditTask = (task: Task) => {
    if (!canManageProject(task)) {
      const masterTask = task.isMasterProject
        ? task
        : tasks.find((t) => t.id === task.masterTaskId);
      const ownerName = masterTask?.creatorName || masterTask?.assigneeName || 'bên khác';
      Alert.alert(
        'Hạn chế quyền 🔒',
        `Dự án Lớn này do ${ownerName} khởi tạo. Bên khác có thể XEM tiến độ nhưng không có quyền CHỈNH SỬA.`
      );
      return;
    }

    setEditingTask(task);
    setEditTitle(task.title);
    setEditAssigneeId(task.assigneeId);
    setEditSupporters(task.supporters || []);
    setEditDeadline(task.deadline);
    setEditStatus(task.status);
    setEditModalVisible(true);
  };

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showTeamMembersModal, setShowTeamMembersModal] = useState(false);
  const [showAllStatusOptions, setShowAllStatusOptions] = useState(false);

  const isAnyModalVisible = modalVisible || taskDetailVisible || editModalVisible || showEditProfileModal || showTeamMembersModal;

  const getStatusType = (status: Task['status']): Task['statusType'] => {
    switch (status) {
      case 'Cần làm': return 'neutral';
      case 'Đang làm': return 'warning';
      case 'Chờ test':
      case 'Chờ review': return 'primary';
      case 'Hoàn thành': return 'success';
      case 'Trễ hạn': return 'danger';
      default: return 'neutral';
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    if (!editTitle.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên công việc.');
      return;
    }
    if (!editAssigneeId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn người phụ trách.');
      return;
    }

    const updatedFields: Partial<Task> = {
      title: editTitle,
      assigneeId: editAssigneeId,
      supporters: editSupporters,
      deadline: editDeadline,
      status: editStatus,
      statusType: getStatusType(editStatus),
      dueType: editStatus === 'Trễ hạn' ? 'overdue' : 'normal',
    };

    await updateTask(editingTask.id, updatedFields);
    setEditModalVisible(false);
    setEditingTask(null);
    Alert.alert('Thành công', 'Đã lưu thay đổi công việc thành công.');
  };

  const { timeStr, dateStr } = useRealTimeClock();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top App Bar ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialIcons name="supervisor-account" size={20} color="#c3f5ff" />
          </View>
          <Text style={styles.headerTitle}>TEAM LEAD</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtnPrimary} activeOpacity={0.8} onPress={handleOpenModal}>
            <MaterialIcons name="post-add" size={22} color="#00daf3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => setNotiModalVisible(true)}
          >
            <View>
              <MaterialIcons name="notifications-none" size={20} color="#bac9cc" />
              {unreadNotiCount > 0 && (
                <View style={styles.notiBadge}>
                  <Text style={styles.notiBadgeText}>{unreadNotiCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => setShowEditProfileModal(true)}>
            <MaterialIcons name="edit" size={20} color="#00e5ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {bottomTab === 'team' ? (
          <>
            {/* ── Profile Row ── */}
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <MaterialIcons name="person" size={28} color="#c3f5ff" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name ?? 'Trưởng nhóm'}</Text>
                <View style={styles.profileBadge}>
                  <MaterialIcons name="star" size={12} color="#ffecac" />
                  <Text style={styles.profileBadgeText}>
                    Team Lead - {user?.specialization}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Bento: Bảng điều khiển Nhóm ── */}
            <View style={styles.bentoCard}>
              {/* Decorative blur blob */}
              <View style={styles.bentoBlob} />

              <View style={styles.bentoHeader}>
                <View>
                  <Text style={styles.bentoTitle}>Bảng điều khiển Nhóm</Text>
                  <Text style={styles.bentoSubtitle}>
                    Tiến độ Team:{' '}
                    <Text style={styles.bentoProgress}>{teamProgress}%</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.assignButton}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/assign-task')}
                >
                  <MaterialIcons name="add" size={16} color="#00363d" />
                  <Text style={styles.assignButtonText}>Giao việc</Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${teamProgress}%` }]} />
              </View>

              {/* ── Visual Stacked Chart (Biểu đồ tiến độ) ── */}
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <View style={{ flex: teamTasks.filter(t => t.status === 'Hoàn thành').length || 0.001, backgroundColor: '#05e777' }} />
                  <View style={{ flex: teamTasks.filter(t => t.status === 'Đang làm').length || 0.001, backgroundColor: '#f5cd00' }} />
                  <View style={{ flex: teamTasks.filter(t => t.status === 'Chờ test' || t.status === 'Chờ review').length || 0.001, backgroundColor: '#00e5ff' }} />
                  <View style={{ flex: teamTasks.filter(t => t.status === 'Cần làm').length || 0.001, backgroundColor: '#849396' }} />
                  <View style={{ flex: teamTasks.filter(t => t.status === 'Trễ hạn').length || 0.001, backgroundColor: '#ffb4ab' }} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#05e777' }} />
                    <Text style={{ fontSize: 10, color: '#849396' }}>Xong ({teamTasks.filter(t => t.status === 'Hoàn thành').length})</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f5cd00' }} />
                    <Text style={{ fontSize: 10, color: '#849396' }}>Đang làm ({teamTasks.filter(t => t.status === 'Đang làm').length})</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00e5ff' }} />
                    <Text style={{ fontSize: 10, color: '#849396' }}>Review ({teamTasks.filter(t => t.status === 'Chờ test' || t.status === 'Chờ review').length})</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#849396' }} />
                    <Text style={{ fontSize: 10, color: '#849396' }}>Cần làm ({teamTasks.filter(t => t.status === 'Cần làm').length})</Text>
                  </View>
                </View>
              </View>

              {/* Team Budget Summary Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 229, 255, 0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="account-balance-wallet" size={16} color="#00e5ff" />
                  <Text style={{ fontSize: 11, color: '#bac9cc', fontWeight: '600' }}>Ngân sách Team được giao:</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#7dffa2' }}>150.000.000 VNĐ</Text>
              </View>

              {/* Online members & View all team members button */}
              <TouchableOpacity
                style={styles.membersRow}
                activeOpacity={0.75}
                onPress={() => setShowTeamMembersModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.membersLabel}>Đang online ({activeTeamMembers.length}):</Text>
                  <MaterialIcons name="people" size={16} color="#00e5ff" />
                </View>
                <View style={[styles.avatarStack, { marginLeft: 'auto' }]}>
                  {onlineMembers.map((m) => (
                    <View
                      key={m.id}
                      style={[styles.memberAvatar, { backgroundColor: `${m.color}20`, borderColor: m.color }]}
                    >
                      <Text style={[styles.memberInitials, { color: m.color }]}>
                        {m.initials}
                      </Text>
                      <View style={styles.memberOnline} />
                    </View>
                  ))}
                  {extraMembersCount > 0 && (
                    <View style={styles.memberAvatarExtra}>
                      <Text style={styles.memberExtraText}>+{extraMembersCount}</Text>
                    </View>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={16} color="#00e5ff" />
              </TouchableOpacity>
            </View>

            {/* ── Task Tabs ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabRow}
              contentContainerStyle={styles.tabRowContent}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              {[
                { id: 'me', label: 'Công việc của tôi', badge: 0 },
                { id: 'team', label: 'Công việc Nhóm', badge: 0 },
                { id: 'requests', label: 'Đơn chờ duyệt', badge: pendingCount },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id as 'me' | 'team' | 'requests')}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.id && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.badge > 0 && (
                    <View style={[
                      styles.tabBadge,
                      activeTab === tab.id && styles.tabBadgeActive,
                    ]}>
                      <Text style={[
                        styles.tabBadgeText,
                        activeTab === tab.id && styles.tabBadgeTextActive,
                      ]}>{tab.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Task List ── */}
            {activeTab !== 'requests' ? (
              <View style={styles.taskList}>
                {/* Active Master Projects Banner */}
                {(() => {
                  const activeMasterProjects = tasks.filter(t => t.isMasterProject && t.status !== 'Hoàn thành');
                  if (activeMasterProjects.length === 0) return null;
                  return (
                    <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.08)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(0, 218, 243, 0.3)', marginBottom: 12, gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialIcons name="rocket-launch" size={20} color="#00daf3" />
                          <Text style={{ color: '#00daf3', fontWeight: '800', fontSize: 13 }}>
                            DỰ ÁN LỚN ĐANG HOẠT ĐỘNG ({activeMasterProjects.length})
                          </Text>
                        </View>
                        <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                          <Text style={{ color: '#00e5ff', fontSize: 10, fontWeight: '700' }}>3 CHẶNG PIPELINE</Text>
                        </View>
                      </View>

                      {activeMasterProjects.map(mp => {
                        const isOwner = canManageProject(mp);
                        const ownerName = mp.creatorName || mp.assigneeName || 'Trưởng nhóm';
                        return (
                          <TouchableOpacity
                            key={mp.id}
                            activeOpacity={0.75}
                            onPress={() => {
                              setSelectedTask(mp);
                              setTaskDetailVisible(true);
                            }}
                            style={{ backgroundColor: '#192122', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(132, 147, 150, 0.2)' }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>
                                {mp.title}
                              </Text>
                              <View style={[styles.statusPill, { backgroundColor: getStageBadge(mp.pipelineStage).bg }]}>
                                <Text style={[styles.statusText, { color: getStageBadge(mp.pipelineStage).text }]}>
                                  {getStageBadge(mp.pipelineStage).label}
                                </Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="person" size={12} color="#849396" />
                                <Text style={{ fontSize: 11, color: '#bac9cc' }}>Tạo bởi: <Text style={{ color: '#00e5ff', fontWeight: '600' }}>{ownerName}</Text></Text>
                              </View>
                              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: isOwner ? 'rgba(5, 231, 119, 0.15)' : 'rgba(255, 236, 172, 0.15)' }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: isOwner ? '#05e777' : '#ffecac' }}>
                                  {isOwner ? '🚀 Bạn quản lý' : '🔒 Chỉ xem (Bên khác)'}
                                </Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ fontSize: 11, color: '#bac9cc' }}>Tiến độ tổng dự án (cộng dồn 3 chặng):</Text>
                              <Text style={{ fontSize: 11, color: '#00e5ff', fontWeight: '800' }}>{mp.progress || 0}%</Text>
                            </View>

                            <View style={{ height: 6, backgroundColor: 'rgba(59, 73, 76, 0.5)', borderRadius: 999, overflow: 'hidden' }}>
                              <View style={{ height: '100%', width: `${mp.progress || 0}%`, backgroundColor: mp.progress === 100 ? '#05e777' : '#00e5ff' }} />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}

                {displayTasks.map((task) => {
                  const s = getTaskStyle(task.statusType);
                  const isOwner = canManageProject(task);
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskCard, { borderLeftColor: s.border }]}
                    >
                      {task.statusType === 'danger' && (
                        <View style={styles.overdueOverlay} />
                      )}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedTask(task);
                          setTaskDetailVisible(true);
                        }}
                      >
                        <View style={styles.taskCardTop}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            {task.pipelineStage && (
                              <View style={[styles.statusPill, { backgroundColor: getStageBadge(task.pipelineStage).bg }]}>
                                <Text style={[styles.statusText, { color: getStageBadge(task.pipelineStage).text }]}>
                                  {getStageBadge(task.pipelineStage).label}
                                </Text>
                              </View>
                            )}
                            <View style={[styles.statusPill, { backgroundColor: s.pill }]}>
                              {task.statusType === 'danger' && (
                                <MaterialIcons name="warning" size={10} color={s.text} />
                              )}
                              <Text style={[styles.statusText, { color: s.text }]}>
                                {task.status}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Progress Bar & Slow Progress Warning */}
                        <View style={{ marginVertical: 8, gap: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, color: '#bac9cc', fontWeight: '600' }}>
                              {task.masterTaskId ? `Tiến độ riêng Chặng (${getStageBadge(task.pipelineStage).label}):` : 'Tiến độ thành viên:'}
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

                          {/* If Master Project Subtask: show overall Master Project Progress bar as well */}
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
                                ⚠️ CẢNH BÁO TIẾN ĐỘ CHẬM ({task.progress || 0}%)
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.taskCardBottom}>
                          <View style={styles.assigneeRow}>
                            <View style={styles.assigneeAvatar}>
                              <Text style={styles.assigneeInitials}>
                                {task.assigneeInitials}
                              </Text>
                            </View>
                            <Text style={styles.assigneeName}>{task.assigneeName}</Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {task.budget && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 229, 255, 0.08)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' }}>
                                <MaterialIcons name="account-balance-wallet" size={12} color="#00e5ff" />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#7dffa2' }}>{task.budget}</Text>
                              </View>
                            )}
                            <View style={styles.dueRow}>
                              <MaterialIcons
                                name={task.dueType === 'overdue' ? 'schedule' : 'calendar-today'}
                                size={13}
                                color={task.dueType === 'overdue' ? '#ffb4ab' : '#849396'}
                              />
                              <Text
                                style={[
                                  styles.dueText,
                                  task.dueType === 'overdue' && { color: '#ffb4ab' },
                                ]}
                              >
                                {task.deadline}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* Actions Row: Sửa & Xóa */}
                      <View style={styles.taskActionsRow}>
                        <TouchableOpacity
                          style={styles.taskActionBtn}
                          activeOpacity={0.7}
                          onPress={() => handleEditTask(task)}
                        >
                          <MaterialIcons name={isOwner ? "edit" : "lock"} size={15} color={isOwner ? "#00e5ff" : "#849396"} />
                          <Text style={[styles.taskActionTextEdit, !isOwner && { color: "#849396" }]}>
                            {isOwner ? "Sửa" : "Sửa (🔒)"}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.taskActionDivider} />

                        <TouchableOpacity
                          style={styles.taskActionBtn}
                          activeOpacity={0.7}
                          onPress={() => handleDeleteTask(task.id, task.title)}
                        >
                          <MaterialIcons name={isOwner ? "delete-outline" : "lock"} size={15} color={isOwner ? "#ffb4ab" : "#849396"} />
                          <Text style={[styles.taskActionTextDelete, !isOwner && { color: "#849396" }]}>
                            {isOwner ? "Xóa" : "Xóa (🔒)"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              /* ── Request Cards ── */
              <View style={styles.taskList}>
                {teamRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const statusCfg = {
                    pending: { label: 'Chờ duyệt', bg: 'rgba(233,196,0,0.13)', text: '#e9c400' },
                    approved: { label: 'Đã duyệt', bg: 'rgba(5,231,119,0.13)', text: '#05e777' },
                    rejected: { label: 'Đã từ chối', bg: 'rgba(255,180,171,0.13)', text: '#ffb4ab' },
                  }[req.status];

                  const reqColor = req.accentColor || '#00e5ff';
                  const initials = req.senderName
                    .split(' ')
                    .filter(Boolean)
                    .slice(-2)
                    .map((w) => w[0].toUpperCase())
                    .join('');

                  return (
                    <View key={req.id} style={styles.reqCard}>
                      {/* Header: Avatar + Name + Badge */}
                      <View style={styles.reqHeader}>
                        <View style={[styles.reqAvatar, {
                          backgroundColor: `${reqColor}1A`,
                          borderColor: reqColor,
                        }]}>
                          <Text style={[styles.reqAvatarText, { color: reqColor }]}>
                            {initials}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reqMemberName}>{req.senderName}</Text>
                          <Text style={styles.reqTimeAgo}>{req.timeAgo}</Text>
                        </View>
                        <View style={[styles.reqStatusBadge, { backgroundColor: statusCfg.bg }]}>
                          <Text style={[styles.reqStatusText, { color: statusCfg.text }]}>
                            {statusCfg.label}
                          </Text>
                        </View>
                      </View>

                      {/* Type chip + date */}
                      <View style={styles.reqChipRow}>
                        <View style={styles.reqTypeChip}>
                          <MaterialIcons name={req.typeIcon} size={12} color="#bac9cc" />
                          <Text style={styles.reqTypeText}>{req.type}</Text>
                        </View>
                        <Text style={styles.reqDateText}>{req.date}</Text>
                      </View>

                      {/* Reason */}
                      <View style={styles.reqReasonBox}>
                        <Text style={styles.reqReasonLabel}>
                          Lý do:{' '}
                          <Text style={styles.reqReasonValue}>{req.reason}</Text>
                        </Text>
                      </View>

                      {/* Attachment */}
                      {req.hasAttachment && (
                        <TouchableOpacity style={styles.reqAttachment} activeOpacity={0.75} onPress={() => { }}>
                          <MaterialIcons name="attach-file" size={15} color="#00daf3" />
                          <Text style={styles.reqAttachmentName} numberOfLines={1}>
                            {req.attachmentName}
                          </Text>
                          <MaterialIcons name="file-download" size={14} color="#00daf3" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                      )}

                      {/* Actions */}
                      {isPending ? (
                        <View style={styles.reqActionRow}>
                          <TouchableOpacity
                            style={styles.reqRejectBtn}
                            onPress={() => handleReject(req.id)}
                            activeOpacity={0.75}
                          >
                            <MaterialIcons name="close" size={15} color="#ffb4ab" />
                            <Text style={styles.reqRejectText}>TỪ chối</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.reqApproveBtn}
                            onPress={() => handleApprove(req.id)}
                            activeOpacity={0.75}
                          >
                            <MaterialIcons name="check" size={15} color="#003918" />
                            <Text style={styles.reqApproveText}>Duyệt</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={[
                          styles.reqResultBanner,
                          req.status === 'approved' ? styles.reqResultApproved : styles.reqResultRejected,
                        ]}>
                          <MaterialIcons
                            name={req.status === 'approved' ? 'check-circle' : 'cancel'}
                            size={14}
                            color={req.status === 'approved' ? '#05e777' : '#ffb4ab'}
                          />
                          <Text style={[styles.reqResultText, {
                            color: req.status === 'approved' ? '#05e777' : '#ffb4ab',
                          }]}>
                            {req.status === 'approved' ? 'Bạn đã duyệt đơn này' : 'Bạn đã từ chối đơn này'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

          </>
        ) : bottomTab === 'projects' ? (
          <>
            {/* ── Dự án & Task ── */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>Dự án Lớn & Tiến độ Chặng</Text>
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(0, 229, 255, 0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)' }}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(tabs)/assign-task')}
                >
                  <MaterialIcons name="add" size={14} color="#00e5ff" />
                  <Text style={{ color: '#00e5ff', fontSize: 11, fontWeight: '700' }}>Tạo Dự án Lớn</Text>
                </TouchableOpacity>
              </View>

              {(() => {
                const masterProjects = tasks.filter(t => t.isMasterProject);
                if (masterProjects.length === 0) {
                  return (
                    <View style={{ paddingVertical: 32, alignItems: 'center', backgroundColor: '#192122', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(59, 73, 76, 0.3)' }}>
                      <MaterialIcons name="folder-off" size={40} color="#3b494c" />
                      <Text style={{ color: '#849396', fontSize: 14, marginTop: 10 }}>Chưa có Dự án Lớn nào được khởi tạo</Text>
                    </View>
                  );
                }

                const avgProgress = masterProjects.length > 0
                  ? Math.round(masterProjects.reduce((acc, curr) => acc + (curr.progress || 0), 0) / masterProjects.length)
                  : 0;

                return (
                  <>
                    {/* Summary stats */}
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <View style={{ flex: 1, backgroundColor: '#192122', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59, 73, 76, 0.3)' }}>
                        <Text style={{ color: '#849396', fontSize: 11, fontWeight: '600' }}>TỔNG DỰ ÁN LỚN</Text>
                        <Text style={{ color: '#00e5ff', fontSize: 22, fontWeight: '800', marginTop: 4 }}>{masterProjects.length}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#192122', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59, 73, 76, 0.3)' }}>
                        <Text style={{ color: '#849396', fontSize: 11, fontWeight: '600' }}>TIẾN ĐỘ CHUNG</Text>
                        <Text style={{ color: '#05e777', fontSize: 22, fontWeight: '800', marginTop: 4 }}>
                          {avgProgress}%
                        </Text>
                      </View>
                    </View>

                    {/* Master Project Cards */}
                    {masterProjects.map((mp) => {
                      const isOwner = canManageProject(mp);
                      const ownerName = mp.creatorName || mp.assigneeName || 'Trưởng nhóm';
                      const subTasks = tasks.filter(t => t.masterTaskId === mp.id);
                      const completedSubTasks = subTasks.filter(t => t.status === 'Hoàn thành').length;

                      return (
                        <TouchableOpacity
                          key={mp.id}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedTask(mp);
                            setTaskDetailVisible(true);
                          }}
                          style={{ backgroundColor: '#192122', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(59, 73, 76, 0.3)', gap: 10 }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0, 229, 255, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialIcons name="folder" size={20} color="#00e5ff" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#dce4e5', fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{mp.title}</Text>
                                <Text style={{ color: '#849396', fontSize: 11, marginTop: 2 }}>
                                  Khởi tạo: <Text style={{ color: '#00e5ff', fontWeight: '600' }}>{ownerName}</Text> — Hạn: {mp.deadline}
                                </Text>
                              </View>
                            </View>
                            <Text style={{ color: mp.progress === 100 ? '#05e777' : '#00e5ff', fontSize: 18, fontWeight: '800' }}>{mp.progress || 0}%</Text>
                          </View>

                          {/* Owner / Permission status badge */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={[styles.statusPill, { backgroundColor: getStageBadge(mp.pipelineStage).bg }]}>
                              <Text style={[styles.statusText, { color: getStageBadge(mp.pipelineStage).text }]}>
                                Chặng hiện tại: {getStageBadge(mp.pipelineStage).label}
                              </Text>
                            </View>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: isOwner ? 'rgba(5, 231, 119, 0.15)' : 'rgba(255, 236, 172, 0.15)' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: isOwner ? '#05e777' : '#ffecac' }}>
                                {isOwner ? '🚀 Bạn quản lý' : '🔒 Chỉ xem (Bên khác)'}
                              </Text>
                            </View>
                          </View>

                          {/* Progress Bar */}
                          <View style={{ height: 6, backgroundColor: '#252525', borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${mp.progress || 0}%`, backgroundColor: mp.progress === 100 ? '#05e777' : '#00e5ff', borderRadius: 3 }} />
                          </View>

                          {/* Subtasks summary inside project */}
                          {subTasks.length > 0 && (
                            <View style={{ gap: 6, marginTop: 4 }}>
                              <Text style={{ fontSize: 11, color: '#849396', fontWeight: '600' }}>Các công việc con trong pipeline ({completedSubTasks}/{subTasks.length}):</Text>
                              {subTasks.map((pt) => {
                                const ptStyle = getTaskStyle(pt.statusType);
                                return (
                                  <View key={pt.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#151d1e', padding: 10, borderRadius: 8 }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                      <Text style={{ color: '#bac9cc', fontSize: 12 }} numberOfLines={1}>{pt.title}</Text>
                                      <Text style={{ color: '#849396', fontSize: 10 }}>Phụ trách: {pt.assigneeName}</Text>
                                    </View>
                                    <View style={{ backgroundColor: ptStyle.pill, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                      <Text style={{ color: ptStyle.text, fontSize: 10, fontWeight: '600' }}>{pt.status}</Text>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                );
              })()}
            </View>
          </>
        ) : bottomTab === 'requests' ? (
          <>
            {/* ── Duyệt đơn ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Đơn chờ duyệt ({pendingCount})</Text>
              </View>

              {teamRequests.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <MaterialIcons name="assignment-turned-in" size={40} color="#3b494c" />
                  <Text style={{ color: '#849396', fontSize: 14, marginTop: 10 }}>Không có đơn từ nào cần xử lý</Text>
                </View>
              ) : (
                teamRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  return (
                    <View key={req.id} style={[styles.reqCard, { borderLeftColor: req.accentColor || '#00e5ff' }]}>
                      {/* Card Header & Sender info */}
                      <View style={styles.reqHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reqMemberName}>{req.senderName}</Text>
                          <Text style={{ fontSize: 11, color: '#849396', marginTop: 1 }}>{req.role}</Text>
                        </View>
                        <Text style={styles.reqTimeAgo}>{req.timeAgo}</Text>
                      </View>

                      {/* Request Type Pill & Description */}
                      <View style={{ marginBottom: 8 }}>
                        <View style={[styles.reqTypeChip, { backgroundColor: `${req.accentColor}20`, alignSelf: 'flex-start', marginBottom: 6 }]}>
                          <MaterialIcons name={(req.typeIcon || 'event-busy') as keyof typeof MaterialIcons.glyphMap} size={13} color={req.accentColor} />
                          <Text style={[styles.reqTypeText, { color: req.accentColor }]}>{req.type}</Text>
                        </View>
                        <Text style={{ color: '#dce4e5', fontSize: 13, marginBottom: 4 }}>{req.description}</Text>
                        <Text style={styles.reqReasonLabel}>Lý do: <Text style={styles.reqReasonValue}>{req.reason}</Text></Text>
                      </View>

                      {/* Attachment */}
                      {req.hasAttachment && (
                        <TouchableOpacity style={styles.reqAttachment} activeOpacity={0.75} onPress={() => { }}>
                          <MaterialIcons name="attach-file" size={15} color="#00daf3" />
                          <Text style={styles.reqAttachmentName} numberOfLines={1}>{req.attachmentName}</Text>
                        </TouchableOpacity>
                      )}

                      {/* Actions */}
                      {isPending ? (
                        <View style={styles.reqActionRow}>
                          <TouchableOpacity style={styles.reqRejectBtn} onPress={() => handleReject(req.id)} activeOpacity={0.75}>
                            <MaterialIcons name="close" size={15} color="#ffb4ab" />
                            <Text style={styles.reqRejectText}>Từ chối</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.reqApproveBtn} onPress={() => handleApprove(req.id)} activeOpacity={0.75}>
                            <MaterialIcons name="check" size={15} color="#003918" />
                            <Text style={styles.reqApproveText}>Duyệt</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={[styles.reqResultBanner, req.status === 'approved' ? styles.reqResultApproved : styles.reqResultRejected]}>
                          <MaterialIcons name={req.status === 'approved' ? 'check-circle' : 'cancel'} size={14} color={req.status === 'approved' ? '#05e777' : '#ffb4ab'} />
                          <Text style={[styles.reqResultText, { color: req.status === 'approved' ? '#05e777' : '#ffb4ab' }]}>
                            {req.status === 'approved' ? 'Bạn đã duyệt đơn này' : 'Bạn đã từ chối đơn này'}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <>
            {/* ── Trang cá nhân ── */}
            {/* Date & Time Banner */}
            <View style={styles.timeBanner}>
              <Text style={styles.timeText}>{timeStr}</Text>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>

            {/* Section: Attendance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chấm công hôm nay</Text>

              <View style={styles.attendanceCard}>
                <View style={styles.buttonContainer}>
                  <View style={[styles.attendanceGlow, (checkedIn || isCompletedToday) && styles.attendanceGlowActive]} />
                  <View style={[styles.fingerprintGlow, (checkedIn || isCompletedToday) && styles.fingerprintGlowActive]} />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.checkInRipple,
                      (checkedIn || isCompletedToday) && styles.checkInRippleActive,
                      { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
                    ]}
                  />

                  <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handleCheckInPress}
                  >
                    <Animated.View
                      style={[
                        styles.checkInButton,
                        (checkedIn || isCompletedToday) && styles.checkInButtonActive,
                        { transform: [{ scale: scaleAnim }] },
                      ]}
                    >
                      <MaterialIcons
                        name="fingerprint"
                        size={52}
                        color={isCompletedToday ? '#7dffa2' : checkedIn ? '#ffb4ab' : '#00e5ff'}
                      />
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
                  <View style={styles.attendanceStatusPill}>
                    <MaterialIcons name="location-on" size={13} color="#05e777" />
                    <Text style={styles.attendanceStatusPillText}>GPS: Nội bộ</Text>
                  </View>
                  <View style={styles.attendanceStatusPill}>
                    <MaterialIcons name="wifi" size={13} color="#00e5ff" />
                    <Text style={styles.attendanceStatusPillText}>Wifi: Office_5G</Text>
                  </View>
                </View>

                {/* History List */}
                {myHistory.length > 0 && (
                  <View style={styles.historyContainer}>
                    <Text style={styles.historyTitle}>Lịch sử điểm danh</Text>
                    {myHistory.map((item) => (
                      <View key={item.id} style={styles.historyRow}>
                        <MaterialIcons
                          name={item.type === 'in' ? 'login' : 'logout'}
                          size={14}
                          color={item.type === 'in' ? '#05e777' : '#ffb4ab'}
                        />
                        <Text style={styles.historyText}>
                          <Text style={{ color: item.type === 'in' ? '#05e777' : '#ffb4ab' }}>
                            {item.type === 'in' ? 'Check-in' : 'Check-out'}
                          </Text>{' '}
                          [{item.shiftName || 'Ca Sáng'}] lúc {item.time} ({item.date})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Performance Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hiệu suất làm việc</Text>
              <View style={{ backgroundColor: '#192122', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(59, 73, 76, 0.3)', flexDirection: 'row', gap: 16 }}>
                <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#3b494c', position: 'relative' }}>
                  <View style={{ position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#00e5ff', opacity: myTasks.length > 0 ? 0.8 : 0.2 }} />
                  <Text style={{ color: '#00e5ff', fontSize: 16, fontWeight: '800' }}>
                    {myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === 'Hoàn thành').length / myTasks.length) * 100) : 0}%
                  </Text>
                  <Text style={{ color: '#849396', fontSize: 8, marginTop: 2, fontWeight: '600' }}>HOÀN THÀNH</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#bac9cc', fontSize: 13 }}>Tổng công việc giao:</Text>
                    <Text style={{ color: '#dce4e5', fontWeight: '700', fontSize: 14 }}>{myTasks.length}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#bac9cc', fontSize: 13 }}>Đã hoàn thành:</Text>
                    <Text style={{ color: '#7dffa2', fontWeight: '700', fontSize: 14 }}>{myTasks.filter(t => t.status === 'Hoàn thành').length}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#bac9cc', fontSize: 13 }}>Số lượt chấm công:</Text>
                    <Text style={{ color: '#00daf3', fontWeight: '700', fontSize: 14 }}>{myHistory.length}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* My Tasks */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Công việc của tôi</Text>
              </View>

              <View style={styles.taskList}>
                {myTasks.length === 0 ? (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <MaterialIcons name="assignment-late" size={32} color="#3b494c" />
                    <Text style={{ color: '#849396', fontSize: 13, marginTop: 8 }}>Bạn chưa có công việc nào được giao</Text>
                  </View>
                ) : (
                  myTasks.map((task) => {
                    const statusStyle = getTaskStatusStyle(task.statusType);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={[styles.taskCard, { borderLeftColor: statusStyle.border }]}
                        activeOpacity={0.75}
                        onPress={() => {
                          setSelectedTask(task);
                          setTaskDetailVisible(true);
                        }}
                      >
                        <View style={styles.taskCardTop}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <View style={[styles.statusPill2, statusStyle.pill]}>
                            <Text style={[styles.statusPill2Text, statusStyle.text]}>
                              {task.status}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.taskMeta}>
                          <MaterialIcons name="event" size={13} color="#849396" />
                          <Text style={styles.taskMetaText}>Hạn chót: {task.deadline}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* ── Fixed Bottom Navigation (4 Tabs) ── */}
      {!isAnyModalVisible && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {[
            { id: 'team', icon: 'groups', label: 'Nhóm' },
            { id: 'projects', icon: 'folder-open', label: 'Dự án & Task' },
            { id: 'requests', icon: 'fact-check', label: 'Duyệt đơn', badge: pendingCount },
            { id: 'personal', icon: 'person', label: 'Cá nhân' },
          ].map((tab) => {
            const isActive = bottomTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.navTab, isActive && styles.navTabActive]}
                onPress={() => setBottomTab(tab.id as 'team' | 'projects' | 'requests' | 'personal')}
                activeOpacity={0.75}
              >
                <View style={{ position: 'relative' }}>
                  <MaterialIcons
                    name={tab.icon as keyof typeof MaterialIcons.glyphMap}
                    size={22}
                    color={isActive ? '#00e5ff' : '#849396'}
                  />
                  {tab.badge && tab.badge > 0 ? (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{tab.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Modal: Danh sách thành viên nhóm ── */}
      <Modal
        visible={showTeamMembersModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTeamMembersModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTeamMembersModal(false)}>
          <Pressable
            style={[styles.modalSheet, { maxHeight: '85%', paddingBottom: Math.max(insets.bottom, 24) }]}
            onPress={() => { }}
          >
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Thành viên nhóm ({teamMembers.length})</Text>
                <Text style={styles.modalSubtitle}>Chuyên ngành {activeEmp?.specialization ?? 'Frontend'} — Giám sát & Quản lý</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTeamMembersModal(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ gap: 10, paddingBottom: 20 }}>
                {teamMembers.map((emp) => {
                  const empTasks = tasks.filter(t => t.assigneeId === emp.id);
                  const empDone = empTasks.filter(t => t.status === 'Hoàn thành').length;
                  const isLead = emp.role === 'teamlead';
                  const initials = emp.name.trim().split(' ').filter(Boolean).slice(-2).map(w => w[0].toUpperCase()).join('');
                  const color = emp.accentColor || (isLead ? '#00daf3' : '#00e475');

                  return (
                    <View
                      key={emp.id}
                      style={{
                        backgroundColor: '#192122',
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: 'rgba(59, 73, 76, 0.4)',
                        borderLeftWidth: 4,
                        borderLeftColor: color,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: `${color}1A`,
                          borderWidth: 1.5,
                          borderColor: color,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color, fontWeight: '700', fontSize: 14 }}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: '#dce4e5', fontWeight: '700', fontSize: 14 }}>{emp.name}</Text>
                            {isLead && (
                              <View style={{ backgroundColor: 'rgba(233, 196, 0, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ color: '#e9c400', fontSize: 9, fontWeight: '800' }}>LEAD</Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <MaterialIcons name="work-outline" size={12} color="#849396" />
                            <Text style={{ color: '#849396', fontSize: 11 }}>
                              {emp.role === 'teamlead' ? 'Trưởng nhóm' : 'Nhân viên'} • {emp.specialization}
                            </Text>
                          </View>
                          <Text style={{ color: '#5b6b6e', fontSize: 11, marginTop: 2 }}>{emp.email}</Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: emp.status === 'Active' ? 'rgba(5, 231, 119, 0.12)' : 'rgba(132, 147, 150, 0.12)',
                        }}>
                          <Text style={{ color: emp.status === 'Active' ? '#05e777' : '#849396', fontSize: 10, fontWeight: '700' }}>
                            {emp.status === 'Active' ? 'Online' : 'Offline'}
                          </Text>
                        </View>
                        <Text style={{ color: '#849396', fontSize: 10 }}>
                          Task: <Text style={{ color: '#00e5ff', fontWeight: '700' }}>{empDone}/{empTasks.length}</Text>
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
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
                    const isSelected = selectedType.id === t.id;
                    return (
                      <TouchableOpacity key={t.id} style={[styles.typeChip, isSelected && styles.typeChipSelected]} onPress={() => setSelectedType(t)} activeOpacity={0.75}>
                        <MaterialIcons name={t.icon} size={14} color={isSelected ? '#0d1516' : '#849396'} />
                        <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>{t.label}</Text>
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

      {/* ── Modal: Chi tiết & Cập nhật trạng thái Task ── */}
      <Modal
        visible={taskDetailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskDetailVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTaskDetailVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => { }}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedTask?.title}</Text>
                <Text style={styles.modalSubtitle}>Cập nhật trạng thái công việc của bạn</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setTaskDetailVisible(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingBottom: 24, gap: 14 }}>
              {selectedTask && (() => {
                const isOwner = canManageProject(selectedTask);
                const ownerName = selectedTask.creatorName || selectedTask.assigneeName || 'Trưởng nhóm';
                return (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: isOwner ? 'rgba(5, 231, 119, 0.12)' : 'rgba(255, 236, 172, 0.12)',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isOwner ? 'rgba(5, 231, 119, 0.3)' : 'rgba(255, 236, 172, 0.3)',
                  }}>
                    <MaterialIcons name={isOwner ? "verified-user" : "lock"} size={16} color={isOwner ? "#05e777" : "#ffecac"} />
                    <Text style={{ color: isOwner ? "#05e777" : "#ffecac", fontSize: 12, fontWeight: '700', flex: 1 }}>
                      {isOwner
                        ? `🚀 Bạn có quyền quản lý công việc/dự án này.`
                        : `🔒 Chế độ Chỉ Xem: Khởi tạo bởi ${ownerName}. Bên khác không có quyền sửa/xóa.`}
                    </Text>
                  </View>
                );
              })()}

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

              {/* If Task is part of a Master Project Pipeline */}
              {selectedTask?.masterTaskId && (
                <View style={{ backgroundColor: 'rgba(0, 229, 255, 0.08)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(0, 218, 243, 0.3)', gap: 8 }}>
                  <Text style={{ color: '#00daf3', fontWeight: '700', fontSize: 13 }}>
                    🚀 Thuộc Dự án Lớn: {selectedTask.masterTaskTitle || 'Dự án Pipeline'}
                  </Text>

                  <Text style={{ color: '#bac9cc', fontSize: 11 }}>
                    Tên công việc con của Chặng ({getStageBadge(selectedTask.pipelineStage).label}):
                  </Text>
                  <TextInput
                    style={{ backgroundColor: '#192122', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 13, borderWidth: 1, borderColor: 'rgba(132, 147, 150, 0.3)' }}
                    value={customSubTaskTitle}
                    onChangeText={setCustomSubTaskTitle}
                    placeholder="Nhập tên công việc con cho chặng này..."
                    placeholderTextColor="#849396"
                  />

                  {/* Master Pipeline Handover Action Buttons */}
                  {selectedTask.pipelineStage === 'design' && (
                    <TouchableOpacity
                      style={{ backgroundColor: '#00e5ff', borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 4 }}
                      onPress={async () => {
                        await advanceMasterPipelineStage(selectedTask.masterTaskId!, 'design', user?.name || 'Lead Design', customSubTaskTitle);
                        setTaskDetailVisible(false);
                        Alert.alert('Chuyển chặng thành công! 🚀', 'Đã duyệt chặng Thiết kế và tự động tạo Task Lập trình cho Trưởng nhóm Dev.');
                      }}
                    >
                      <MaterialIcons name="send" size={18} color="#00363d" />
                      <Text style={{ color: '#00363d', fontWeight: '800', fontSize: 13 }}>✅ DUYỆT & BÀN GIAO SANG LẬP TRÌNH (DEV)</Text>
                    </TouchableOpacity>
                  )}

                  {selectedTask.pipelineStage === 'development' && (
                    <TouchableOpacity
                      style={{ backgroundColor: '#00e5ff', borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 4 }}
                      onPress={async () => {
                        await advanceMasterPipelineStage(selectedTask.masterTaskId!, 'development', user?.name || 'Lead Dev', customSubTaskTitle);
                        setTaskDetailVisible(false);
                        Alert.alert('Chuyển chặng thành công! 🚀', 'Đã duyệt chặng Code và tự động tạo Task Kiểm thử cho QA Lead.');
                      }}
                    >
                      <MaterialIcons name="send" size={18} color="#00363d" />
                      <Text style={{ color: '#00363d', fontWeight: '800', fontSize: 13 }}>✅ DUYỆT & BÀN GIAO SANG KIỂM THỬ (QA)</Text>
                    </TouchableOpacity>
                  )}

                  {selectedTask.pipelineStage === 'testing' && (
                    <TouchableOpacity
                      style={{ backgroundColor: '#05e777', borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 4 }}
                      onPress={async () => {
                        await advanceMasterPipelineStage(selectedTask.masterTaskId!, 'testing', user?.name || 'Lead QA', customSubTaskTitle);
                        setTaskDetailVisible(false);
                        Alert.alert('Nghiệm thu dự án thành công! 🎉', 'Toàn bộ Dự án Lớn đã hoàn thành nghiệm thu.');
                      }}
                    >
                      <MaterialIcons name="check-circle" size={18} color="#003918" />
                      <Text style={{ color: '#003918', fontWeight: '800', fontSize: 13 }}>🚀 NGHIỆM THU HOÀN THÀNH DỰ ÁN LỚN</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ── Contextual Action Buttons for Team Lead ── */}
              {(selectedTask?.status === 'Chờ test' || selectedTask?.status === 'Chờ review') && (
                <View style={{ gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: '#05e777',
                      borderRadius: 14,
                      height: 48,
                    }}
                    activeOpacity={0.85}
                    onPress={async () => {
                      if (selectedTask) {
                        await updateTaskProgress(selectedTask.id, 100);
                        handleUpdateStatus('Hoàn thành', 'success');
                      }
                    }}
                  >
                    <MaterialIcons name="check-circle" size={20} color="#003918" />
                    <Text style={{ color: '#003918', fontWeight: '800', fontSize: 14 }}>✅ DUYỆT - HOÀN THÀNH NGHIỆM THU</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: 'rgba(255, 180, 171, 0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 180, 171, 0.3)',
                      borderRadius: 14,
                      height: 44,
                    }}
                    activeOpacity={0.85}
                    onPress={() => setShowRejectProgressPicker(!showRejectProgressPicker)}
                  >
                    <MaterialIcons name="replay" size={18} color="#ffb4ab" />
                    <Text style={{ color: '#ffb4ab', fontWeight: '700', fontSize: 13 }}>🔄 CHƯA ĐẠT - YÊU CẦU LÀM TIẾP</Text>
                  </TouchableOpacity>

                  {/* Expandable Progress Adjustment Picker for Team Lead */}
                  {showRejectProgressPicker && (
                    <View style={{ backgroundColor: '#192122', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 180, 171, 0.4)', gap: 8 }}>
                      <Text style={{ color: '#ffb4ab', fontSize: 12, fontWeight: '700' }}>
                        Chọn % tiến độ thực tế trả về cho Nhân viên:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {[25, 50, 70, 80].map((val) => (
                          <TouchableOpacity
                            key={val}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: 'center',
                              backgroundColor: adjustProgressVal === val ? 'rgba(255, 180, 171, 0.25)' : '#252525',
                              borderWidth: 1,
                              borderColor: adjustProgressVal === val ? '#ffb4ab' : 'rgba(59, 73, 76, 0.3)',
                            }}
                            onPress={() => setAdjustProgressVal(val)}
                          >
                            <Text style={{ color: adjustProgressVal === val ? '#ffb4ab' : '#849396', fontSize: 11, fontWeight: '700' }}>
                              {val}%
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={{ backgroundColor: '#ffb4ab', height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
                        onPress={async () => {
                          if (!selectedTask) return;
                          await updateTaskProgress(selectedTask.id, adjustProgressVal);
                          await updateTaskStatus(selectedTask.id, 'Đang làm', 'warning');
                          await addNotification({
                            userId: selectedTask.assigneeId,
                            title: '🔄 YÊU CẦU LÀM TIẾP CÔNG VIỆC',
                            message: `Trưởng nhóm yêu cầu làm tiếp công việc "${selectedTask.title}". Tiến độ thực tế được điều chỉnh về ${adjustProgressVal}%.`,
                            type: 'task_assigned',
                            icon: 'warning',
                            iconColor: '#ffb4ab',
                          });
                          setShowRejectProgressPicker(false);
                          setTaskDetailVisible(false);
                          setSelectedTask(null);
                          Alert.alert('Đã trả về làm tiếp', `Đã trả task về mức tiến độ ${adjustProgressVal}% cho nhân viên tiếp tục làm.`);
                        }}
                      >
                        <Text style={{ color: '#561d18', fontWeight: '800', fontSize: 13 }}>
                          XÁC NHẬN YÊU CẦU LÀM TIẾP ({adjustProgressVal}%)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

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
                  onPress={() => handleUpdateStatus('Hoàn thành', 'success')}
                >
                  <MaterialIcons name="check-circle" size={20} color="#00363d" />
                  <Text style={{ color: '#00363d', fontWeight: '800', fontSize: 15 }}>✅ NGHỆM THU HOÀN THÀNH</Text>
                </TouchableOpacity>
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
                    Công việc đã nghiệm thu hoàn tất 🎉
                  </Text>
                </View>
              )}

              {/* ── Toggle manual status options ── */}
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
                    { status: 'Chờ review', statusType: 'primary', icon: 'rate-review', color: '#00e5ff', desc: 'Chờ kiểm tra code' },
                    { status: 'Hoàn thành', statusType: 'success', icon: 'check-circle', color: '#05e777', desc: 'Hoàn tất nghiệm thu' }
                  ] as const).map((opt) => {
                    const isCurrent = selectedTask?.status === opt.status;
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
                          backgroundColor: isCurrent ? 'rgba(0, 229, 255, 0.08)' : '#242b2d',
                          borderWidth: 1,
                          borderColor: isCurrent ? 'rgba(0, 229, 255, 0.4)' : 'rgba(59, 73, 76, 0.3)',
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <MaterialIcons name={opt.icon as keyof typeof MaterialIcons.glyphMap} size={18} color={opt.color} />
                          <Text style={{ color: isCurrent ? '#00e5ff' : '#dce4e5', fontWeight: '600', fontSize: 13 }}>{opt.status}</Text>
                        </View>
                        {isCurrent && <MaterialIcons name="check" size={18} color="#00e5ff" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal: Chỉnh sửa Task ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <View style={{ width: '100%', maxHeight: '85%' }}>
            <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => { }}>
              <View style={styles.dragHandle} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Chỉnh sửa công việc</Text>
                  <Text style={styles.modalSubtitle}>Cập nhật thông tin chi tiết công việc</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={20} color="#849396" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 500 }}
                contentContainerStyle={{ paddingBottom: 30, gap: 14 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                decelerationRate="normal"
              >
                {/* 1. Tên công việc */}
                <View>
                  <Text style={styles.formLabel}>Tên công việc</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="Nhập tên công việc"
                      placeholderTextColor="#849396"
                    />
                  </View>
                </View>

                {/* 2. Người phụ trách chính */}
                <View>
                  <Text style={styles.formLabel}>Người phụ trách chính</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }} nestedScrollEnabled={true} scrollEventThrottle={16}>
                    {teamMembers.map(emp => {
                      const isSelected = emp.id === editAssigneeId;
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          onPress={() => setEditAssigneeId(emp.id)}
                          style={{
                            alignItems: 'center',
                            padding: 10,
                            borderRadius: 12,
                            backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.12)' : '#242b2d',
                            borderWidth: 1,
                            borderColor: isSelected ? '#00e5ff' : 'rgba(59, 73, 76, 0.4)',
                            marginRight: 10,
                            width: 85,
                          }}
                        >
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'rgba(186, 201, 204, 0.1)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 4,
                          }}>
                            <Text style={{ color: isSelected ? '#00e5ff' : '#bac9cc', fontSize: 12, fontWeight: '700' }}>
                              {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={{ color: '#dce4e5', fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
                            {emp.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 3. Thành viên hỗ trợ */}
                <View>
                  <Text style={styles.formLabel}>Thành viên hỗ trợ (Có thể chọn nhiều)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }} nestedScrollEnabled={true} scrollEventThrottle={16}>
                    {teamMembers.filter(emp => emp.id !== editAssigneeId).map(emp => {
                      const isSelected = editSupporters.includes(emp.id);
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          onPress={() => {
                            if (isSelected) {
                              setEditSupporters(editSupporters.filter(id => id !== emp.id));
                            } else {
                              setEditSupporters([...editSupporters, emp.id]);
                            }
                          }}
                          style={{
                            alignItems: 'center',
                            padding: 10,
                            borderRadius: 12,
                            backgroundColor: isSelected ? 'rgba(5, 231, 119, 0.12)' : '#242b2d',
                            borderWidth: 1,
                            borderColor: isSelected ? '#05e777' : 'rgba(59, 73, 76, 0.4)',
                            marginRight: 10,
                            width: 85,
                          }}
                        >
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: isSelected ? 'rgba(5, 231, 119, 0.2)' : 'rgba(186, 201, 204, 0.1)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 4,
                          }}>
                            <Text style={{ color: isSelected ? '#7dffa2' : '#bac9cc', fontSize: 12, fontWeight: '700' }}>
                              {emp.avatar || emp.name.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={{ color: '#dce4e5', fontSize: 10, textAlign: 'center' }} numberOfLines={1}>
                            {emp.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 4. Hạn chót */}
                <View>
                  <Text style={styles.formLabel}>Hạn chót (Deadline)</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="event" size={16} color="#849396" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={editDeadline}
                      onChangeText={setEditDeadline}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#849396"
                    />
                  </View>
                </View>

                {/* 5. Trạng thái */}
                <View>
                  <Text style={styles.formLabel}>Trạng thái công việc</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {([
                      { status: 'Cần làm', color: '#849396' },
                      { status: 'Đang làm', color: '#f5cd00' },
                      { status: 'Chờ test', color: '#00e5ff' },
                      { status: 'Chờ review', color: '#00e5ff' },
                      { status: 'Hoàn thành', color: '#05e777' },
                      { status: 'Trễ hạn', color: '#ffb4ab' },
                    ] as const).map((opt) => {
                      const isSelected = editStatus === opt.status;
                      return (
                        <TouchableOpacity
                          key={opt.status}
                          onPress={() => setEditStatus(opt.status)}
                          style={{
                            backgroundColor: isSelected ? `${opt.color}20` : '#242b2d',
                            borderWidth: 1,
                            borderColor: isSelected ? opt.color : 'rgba(59, 73, 76, 0.4)',
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                          }}
                        >
                          <Text style={{ color: isSelected ? opt.color : '#bac9cc', fontSize: 12, fontWeight: '700' }}>
                            {opt.status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#00e5ff',
                    padding: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginTop: 10,
                  }}
                  onPress={handleSaveEdit}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#00363d', fontWeight: 'bold', fontSize: 15 }}>LƯU THAY ĐỔI</Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      {/* ── Notification Modal ── */}
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
  safeArea: { flex: 1, backgroundColor: '#0d1516' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#192122',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.4)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(195, 245, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(195, 245, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#c3f5ff', letterSpacing: 1.5 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242b2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 218, 243, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 218, 243, 0.45)',
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 140 },

  /* Profile Row */
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(195, 245, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#dce4e5' },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(46, 54, 56, 0.7)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#3b494c',
    alignSelf: 'flex-start',
  },
  profileBadgeText: { fontSize: 10, color: '#ffecac', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Bento card */
  bentoCard: {
    backgroundColor: 'rgba(36, 43, 45, 0.5)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(132, 147, 150, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  bentoBlob: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bentoTitle: { fontSize: 17, fontWeight: '700', color: '#dce4e5' },
  bentoSubtitle: { fontSize: 13, color: '#bac9cc', marginTop: 3 },
  bentoProgress: { color: '#c3f5ff', fontWeight: '700' },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00e5ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  assignButtonText: { fontSize: 11, fontWeight: '700', color: '#00363d', textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Progress bar */
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#2e3638',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#00e5ff',
  },

  /* Online members */
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  membersLabel: { fontSize: 11, color: '#849396', fontWeight: '500' },
  avatarStack: { flexDirection: 'row', marginLeft: -4 },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    position: 'relative',
  },
  memberInitials: { fontSize: 10, fontWeight: '700' },
  memberOnline: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#05e777',
    borderWidth: 1.5,
    borderColor: '#192122',
  },
  memberAvatarExtra: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2e3638',
    borderWidth: 2,
    borderColor: '#3b494c',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  memberExtraText: { fontSize: 9, color: '#bac9cc', fontWeight: '700' },

  /* Tabs */
  tabRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.35)',
  },
  tabRowContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 0,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexShrink: 0,
  },
  tabActive: { borderBottomColor: '#c3f5ff' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#849396', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: '#c3f5ff' },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(132,147,150,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: 'rgba(195,245,255,0.18)' },
  tabBadgeText: { fontSize: 9, fontWeight: '700', color: '#849396' },
  tabBadgeTextActive: { color: '#c3f5ff' },

  /* Task list */
  taskList: { gap: 10 },
  taskCard: {
    backgroundColor: '#151d1e',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.2)',
    borderRightColor: 'rgba(59,73,76,0.2)',
    borderBottomColor: 'rgba(59,73,76,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  overdueOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 180, 171, 0.04)',
  },
  taskCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#dce4e5', lineHeight: 20 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  taskCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#242b2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneeInitials: { fontSize: 8, color: '#bac9cc', fontWeight: '700' },
  assigneeName: { fontSize: 12, color: '#bac9cc' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueText: { fontSize: 11, color: '#849396', fontWeight: '500' },

  /* Bottom nav */
  bottomNav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(25, 33, 34, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.35)',
  },
  navTab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, gap: 2 },
  navTabActive: { backgroundColor: 'rgba(0, 229, 255, 0.10)' },
  navLabel: { fontSize: 10, color: '#849396', fontWeight: '500' },
  navLabelActive: { color: '#00e5ff', fontWeight: '700' },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#ff4d4f',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  /* ── Request Card ── */
  reqCard: {
    backgroundColor: '#151d1e',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#b388ff',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  reqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  reqAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reqAvatarText: { fontSize: 12, fontWeight: '800' },
  reqMemberName: { fontSize: 14, fontWeight: '700', color: '#dce4e5' },
  reqTimeAgo: { fontSize: 11, color: '#849396', marginTop: 2 },
  reqStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  reqStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  reqChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reqTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#242b2d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
  },
  reqTypeText: {
    fontSize: 10,
    color: '#bac9cc',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reqDateText: { fontSize: 11, color: '#849396' },
  reqReasonBox: {
    backgroundColor: '#0d1516',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2e3638',
    marginBottom: 10,
  },
  reqReasonLabel: { fontSize: 12, color: '#849396', lineHeight: 18 },
  reqReasonValue: { color: '#dce4e5', fontWeight: '500' },
  reqAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0d1516',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 218, 243, 0.25)',
    marginBottom: 12,
  },
  reqAttachmentName: { fontSize: 11, fontWeight: '600', color: '#00daf3', flex: 1 },
  reqActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reqRejectBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,180,171,0.55)',
    backgroundColor: 'rgba(255,180,171,0.06)',
  },
  reqRejectText: { fontSize: 12, fontWeight: '700', color: '#ffb4ab' },
  reqApproveBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 9,
    backgroundColor: '#05e777',
    shadowColor: '#05e777',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  reqApproveText: { fontSize: 12, fontWeight: '700', color: '#003918' },
  reqResultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    padding: 9,
    borderWidth: 1,
  },
  reqResultApproved: {
    backgroundColor: 'rgba(5,231,119,0.07)',
    borderColor: 'rgba(5,231,119,0.22)',
  },
  reqResultRejected: {
    backgroundColor: 'rgba(255,180,171,0.07)',
    borderColor: 'rgba(255,180,171,0.22)',
  },
  reqResultText: { fontSize: 12, fontWeight: '600', flex: 1 },

  /* ── Personal Screen Styles ── */
  timeBanner: {
    backgroundColor: '#151d1e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.4)',
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
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dce4e5',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attendanceCard: {
    backgroundColor: '#192122',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.35)',
    overflow: 'visible',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
    position: 'relative',
  },
  attendanceGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  attendanceGlowActive: {
    backgroundColor: 'rgba(5, 231, 119, 0.05)',
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
    backgroundColor: 'rgba(0, 229, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.20)',
  },
  fingerprintGlowActive: {
    backgroundColor: 'rgba(5, 231, 119, 0.10)',
    borderColor: 'rgba(5, 231, 119, 0.20)',
  },
  checkInButton: {
    zIndex: 10,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#242b2d',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkInButtonActive: {
    borderColor: 'rgba(5, 231, 119, 0.40)',
  },
  checkInRipple: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.6)',
  },
  checkInRippleActive: {
    borderColor: 'rgba(5, 231, 119, 0.6)',
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
  attendanceStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#242b2d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.4)',
  },
  attendanceStatusPillText: {
    fontSize: 11,
    color: '#bac9cc',
    fontWeight: '500',
  },
  historyContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.3)',
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
    borderColor: 'rgba(59, 73, 76, 0.2)',
  },
  historyText: {
    fontSize: 12,
    color: '#bac9cc',
    marginLeft: 6,
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
    marginTop: 8,
  },
  taskMetaText: {
    fontSize: 11,
    color: '#849396',
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
    marginRight: 4,
  },
  newRequestBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d1516',
    letterSpacing: 0.3,
  },

  /* Modals */
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
    paddingBottom: 24,
    maxHeight: '92%',
    flexShrink: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.5)',
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
    borderColor: 'rgba(59, 73, 76, 0.5)',
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
    borderColor: 'rgba(59, 73, 76, 0.5)',
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
    borderColor: 'rgba(59, 73, 76, 0.5)',
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
    borderColor: 'rgba(0, 218, 243, 0.3)',
    marginBottom: 12,
  },
  uploadZoneAttached: {
    borderColor: 'rgba(5, 231, 119, 0.4)',
    backgroundColor: 'rgba(5, 231, 119, 0.05)',
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
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003918',
    letterSpacing: 1,
  },
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.25)',
    marginTop: 12,
    paddingTop: 10,
  },
  taskActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  taskActionDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(59, 73, 76, 0.4)',
  },
  taskActionTextEdit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00e5ff',
  },
  taskActionTextDelete: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffb4ab',
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
  notiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff4d4f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
});


