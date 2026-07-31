import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/context/AuthContext';
import { useTasksQuery, useUpdateTaskStatusMutation } from '@/hooks/queries/useTaskQueries';
import { useRequestsQuery, useCreateRequestMutation } from '@/hooks/queries/useRequestQueries';
import { useCheckInLogsQuery, useCheckInMutation } from '@/hooks/queries/useCheckInQueries';
import { useUsersQuery } from '@/hooks/queries/useUserQueries';
import { useNotificationStore } from '@/store';
import { Task, PendingRequest, CheckInRecord, AppNotification } from '@/types';
import { REQUEST_TYPES } from '@/constants/requestTypes';
import { formatMinutesToText } from '@/constants/shifts';
import { useWifiCheck } from '@/hooks/useWifiCheck';
import { useShiftTimer } from './useShiftTimer';


import { DashboardTab, TaskFilterType, TaskSummaryStats, RecentActivityItem } from '../types/dashboard';

export function useEmployeeDashboard() {
  const { user, logout } = useAuth();
  const wifiCheck = useWifiCheck();

  const { data: tasks = [] } = useTasksQuery();
  const { data: requests = [] } = useRequestsQuery();
  const { data: checkIns = [], refetch: refetchCheckIns } = useCheckInLogsQuery();
  const { data: employees = [] } = useUsersQuery();

  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const createRequestMutation = useCreateRequestMutation();
  const checkInMutation = useCheckInMutation();

  const { notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead } = useNotificationStore();

  const updateTaskStatus = async (id: string, status: Task['status'], statusType: Task['statusType']) => {
    return updateTaskStatusMutation.mutateAsync({ id, status, statusType });
  };

  const updateTaskProgress = async (id: string, progress: number) => {
    // handled locally or status update
  };

  const addCheckIn = async (
    userId: string,
    userName: string,
    type: 'in' | 'out',
    time: string,
    date: string,
    shiftName?: string,
    status?: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'NORMAL',
    lateMinutes?: number,
    earlyMinutes?: number,
    wifiSSID?: string,
    isCompanyWifi?: boolean,
    note?: string
  ) => {
    return checkInMutation.mutateAsync({ userId, userName, type, time, date, shiftName, status, lateMinutes, earlyMinutes, wifiSSID, isCompanyWifi, note });
  };




  const addRequest = async (
    senderId: string,
    senderName: string,
    role: string,
    type: PendingRequest['type'],
    description: string,
    reason: string,
    date: string,
    hasAttachment?: boolean,
    attachmentName?: string
  ) => {
    return createRequestMutation.mutateAsync({ senderId, senderName, role, type, description, reason, date, hasAttachment, attachmentName });
  };

  const refreshData = async () => {
    await refetchCheckIns();
  };


  // ── Tab State ──
  const [activeTab, setActiveTab] = useState<DashboardTab>('personal');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // ── Task Filtering & Search State ──
  const [searchTaskQuery, setSearchTaskQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('Tất cả');

  // ── Modal States ──
  const [earlyCheckOutModalVisible, setEarlyCheckOutModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedType, setSelectedType] = useState(REQUEST_TYPES[0]);
  const [applyDate, setApplyDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [fileObj, setFileObj] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [notiModalVisible, setNotiModalVisible] = useState(false);
  const [allTasksVisible, setAllTasksVisible] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [showAllStatusOptions, setShowAllStatusOptions] = useState(false);

  // ── User & Data Resolution ──
  const activeEmp = useMemo(
    () => employees.find((e) => e.name === user?.name || (user?.email && e.email === user.email)),
    [employees, user]
  );
  const currentUserId = user?.id || activeEmp?.id;

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.assigneeId === activeEmp?.id ||
          (currentUserId && String(t.assigneeId) === String(currentUserId))
      ),
    [tasks, activeEmp?.id, currentUserId]
  );

  const myHistory = useMemo(
    () =>
      checkIns.filter(
        (c) =>
          (currentUserId && String(c.userId) === String(currentUserId)) ||
          (user?.name && c.userName === user.name)
      ),
    [checkIns, currentUserId, user?.name]
  );

  const shiftInfo = useShiftTimer(myHistory);

  const myRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          (currentUserId && String(r.senderId) === String(currentUserId)) ||
          r.senderName === user?.name
      ),
    [requests, currentUserId, user?.name]
  );

  const myNotifications = useMemo(
    () =>
      notifications.filter(
        (n) =>
          (currentUserId && String(n.userId) === String(currentUserId)) ||
          n.userId === '1' ||
          n.userId === 'all'
      ),
    [notifications, currentUserId]
  );

  const unreadNotiCount = useMemo(
    () => myNotifications.filter((n) => !n.read).length,
    [myNotifications]
  );

  // ── Filtered Tasks ──
  const filteredMyTasks = useMemo(() => {
    return myTasks.filter((task) => {
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
  }, [myTasks, searchTaskQuery, taskFilter]);

  // ── Task Summary Metrics ──
  const taskStats = useMemo<TaskSummaryStats>(() => {
    const totalTasks = myTasks.length;
    const completedTasks = myTasks.filter((t) => t.status === 'Hoàn thành').length;
    const pendingTasks = myTasks.filter((t) => t.status === 'Cần làm').length;
    const inProgressTasks = myTasks.filter(
      (t) => t.status === 'Đang làm' || t.status === 'Chờ review' || t.status === 'Chờ test'
    ).length;
    const overdueTasks = myTasks.filter((t) => t.status === 'Trễ hạn').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      completionPercentage,
      totalCheckInsCount: myHistory.length,
    };
  }, [myTasks, myHistory]);

  // ── Recent Activity Stream ──
  const recentActivities = useMemo<RecentActivityItem[]>(() => {
    const list: RecentActivityItem[] = [];

    // Recent check-ins
    myHistory.slice(0, 3).forEach((item) => {
      let annotation = '';
      if (item.status === 'LATE') {
        annotation = ` • ⚠️ Điểm danh muộn ${formatMinutesToText(item.lateMinutes || 0)}`;
      } else if (item.status === 'EARLY_LEAVE') {
        annotation = ` • ⚠️ Rời ca sớm ${formatMinutesToText(item.earlyMinutes || 0)}`;
      } else if (item.type === 'in') {
        annotation = ` • 🟢 Đúng giờ`;
      }

      list.push({
        id: `checkin-${item.id}`,
        title: item.type === 'in' ? 'Check-in ca làm việc' : 'Check-out ca làm việc',
        description: `Ca [${item.shiftName || 'Ca Sáng'}] lúc ${item.time}${annotation}`,
        timestamp: item.date,
        type: 'checkin',
        statusColor: item.status === 'LATE' ? '#ff4d4f' : item.status === 'EARLY_LEAVE' ? '#ff9800' : item.type === 'in' ? '#05e777' : '#ffb4ab',
        iconName: item.type === 'in' ? 'login' : 'logout',
      });
    });


    // Recent requests
    myRequests.slice(0, 3).forEach((req) => {
      list.push({
        id: `req-${req.id}`,
        title: `Đơn: ${req.type}`,
        description: `${req.reason} (${req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'})`,
        timestamp: req.date,
        type: 'request',
        statusColor: req.status === 'approved' ? '#05e777' : req.status === 'rejected' ? '#ff4d4f' : '#f5cd00',
        iconName: 'event-note',
      });
    });

    // Recent notifications
    myNotifications.slice(0, 3).forEach((noti) => {
      list.push({
        id: `noti-${noti.id}`,
        title: noti.title,
        description: noti.message,
        timestamp: noti.time,
        type: 'notification',
        statusColor: noti.iconColor || '#00e5ff',
        iconName: noti.icon || 'notifications',
      });
    });

    return list;
  }, [myHistory, myRequests, myNotifications]);

  // ── Handlers ──
  // ── Handlers ──
  const executeCheckInOrOut = useCallback(
    async (isConfirmedEarly: boolean = false) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const date = now.toISOString().split('T')[0];

      const type = shiftInfo.checkedIn ? 'out' : 'in';

      let status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'NORMAL' = 'NORMAL';
      let lateMins: number | undefined;
      let earlyMins: number | undefined;

      if (type === 'in') {
        if (shiftInfo.isLateCheckIn) {
          status = 'LATE';
          lateMins = shiftInfo.lateMinutes;
        } else {
          status = 'ON_TIME';
        }
      } else if (type === 'out') {
        if (isConfirmedEarly || shiftInfo.isEarlyCheckOut) {
          status = 'EARLY_LEAVE';
          earlyMins = shiftInfo.remainingMinutes;
        }
      }

      let autoNote = '';
      if (type === 'in') {
        if (status === 'LATE') {
          autoNote = `Điểm danh muộn ${formatMinutesToText(lateMins || 0)} (bắt đầu ca lúc ${shiftInfo.shiftStartTime})`;
        } else {
          autoNote = `Điểm danh đúng giờ (${shiftInfo.activeShiftName})`;
        }
      } else if (type === 'out') {
        if (status === 'EARLY_LEAVE') {
          autoNote = `Check-out sớm ${formatMinutesToText(earlyMins || 0)} (kết thúc ca lúc ${shiftInfo.shiftEndTime})`;
        } else {
          autoNote = `Check-out hoàn thành ca làm việc (${shiftInfo.activeShiftName})`;
        }
      }

      await addCheckIn(
        String(currentUserId || 'guest'),
        user?.name || activeEmp?.name || 'Guest',
        type,
        time,
        date,
        shiftInfo.activeShiftName,
        status,
        lateMins,
        earlyMins,
        wifiCheck.wifiSSID,
        wifiCheck.isCompanyWifi,
        autoNote
      );


      if (type === 'in' && status === 'LATE') {
        Alert.alert(
          '⚠️ Điểm danh muộn',
          `Bạn đã Check-in lúc ${time} - Trễ ${formatMinutesToText(lateMins || 0)} cho ca [${shiftInfo.activeShiftName}].`,
          [{ text: 'Đã rõ' }]
        );
      } else if (type === 'out' && status === 'EARLY_LEAVE') {
        Alert.alert(
          '⚠️ Ghi nhận Về sớm',
          `Bạn đã Check-out lúc ${time} - Sớm ${formatMinutesToText(earlyMins || 0)} so với giờ kết thúc ca [${shiftInfo.activeShiftName}].`,
          [{ text: 'Đã rõ' }]
        );
      }

    },
    [shiftInfo, addCheckIn, currentUserId, user?.name, activeEmp?.name, wifiCheck]
  );

  const handleCheckInPress = useCallback(async () => {
    // Strict Company Wifi Check Enforcement
    if (!wifiCheck.isCompanyWifi) {
      Alert.alert(
        '🚫 Điểm danh bị khóa',
        `Thiết bị đang kết nối mạng "${wifiCheck.wifiSSID}". Yêu cầu kết nối đúng Wifi công ty (${wifiCheck.allowedWifis.join(', ')}) để được phép điểm danh!`,
        [{ text: 'Đã rõ' }]
      );
      return;
    }

    if (shiftInfo.isCompletedToday) {
      Alert.alert('Đã hoàn thành', 'Bạn đã hoàn thành điểm danh tất cả các ca hôm nay rồi!', [{ text: 'Đã rõ' }]);
      return;
    }

    // If currently checkedIn and attempting Check-Out early
    if (shiftInfo.checkedIn && shiftInfo.isEarlyCheckOut) {
      setEarlyCheckOutModalVisible(true);
      return;
    }

    await executeCheckInOrOut(false);
  }, [wifiCheck, shiftInfo, executeCheckInOrOut]);

  const confirmEarlyCheckOut = useCallback(async () => {
    setEarlyCheckOutModalVisible(false);
    await executeCheckInOrOut(true);
  }, [executeCheckInOrOut]);



  const handleUpdateStatus = useCallback(
    async (status: Task['status'], statusType: Task['statusType']) => {
      if (selectedTask) {
        await updateTaskStatus(selectedTask.id, status, statusType);
        setTaskDetailVisible(false);
        setSelectedTask(null);
        Alert.alert('Thành công', `Đã cập nhật trạng thái thành "${status}"`);
      }
    },
    [selectedTask, updateTaskStatus]
  );

  const handleProgressStep = useCallback(
    async (newProgress: number) => {
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
                setSelectedTask((prev) =>
                  prev ? { ...prev, progress: 100, status: 'Chờ review', statusType: 'primary' } : null
                );
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
    },
    [selectedTask, updateTaskProgress, updateTaskStatus, addNotification]
  );

  const handleOpenModal = useCallback(() => {
    setSelectedType(REQUEST_TYPES[0]);
    setApplyDate('');
    setReason('');
    setAttachedFile(null);
    setFileObj(null);
    setModalVisible(true);
  }, []);

  const handleAttachFile = useCallback(async () => {
    if (attachedFile) {
      setAttachedFile(null);
      setFileObj(null);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/png', 'image/jpeg'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const MAX_SIZE = 15 * 1024 * 1024;
        if (file.size && file.size > MAX_SIZE) {
          Alert.alert('Lỗi', 'Dung lượng tệp vượt quá 15MB. Vui lòng chọn tệp nhỏ hơn.');
          return;
        }

        setAttachedFile(file.name);
        setFileObj(file);
      }
    } catch (error) {
      console.error('Lỗi khi chọn tệp:', error);
      Alert.alert('Lỗi', 'Không thể mở trình chọn tệp. Vui lòng thử lại.');
    }
  }, [attachedFile]);

  const handleSubmitRequest = useCallback(async () => {
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền lý do trước khi gửi.');
      return;
    }
    const formattedDate = applyDate.trim() || new Date().toLocaleDateString('vi-VN');
    await addRequest(
      activeEmp?.id || 'guest',
      activeEmp?.name || 'Nhân viên',
      activeEmp?.role === 'teamlead' ? 'Trưởng nhóm' : 'Nhân viên',
      selectedType.label as PendingRequest['type'],
      `${selectedType.label} ngày ${formattedDate}`,
      reason,
      formattedDate,
      !!attachedFile,
      attachedFile || undefined
    );
    setModalVisible(false);
    setTimeout(() => Alert.alert('✅ Gửi đơn thành công', 'Đơn của bạn đã được gửi và đang chờ duyệt.', [{ text: 'Đã rõ' }]), 300);
  }, [reason, applyDate, addRequest, activeEmp, selectedType, attachedFile]);

  const isAnyModalVisible =
    earlyCheckOutModalVisible || modalVisible || notiModalVisible || allTasksVisible || taskDetailVisible || showEditProfileModal;

  return {
    user,
    logout,
    tasks,
    activeEmp,
    currentUserId,
    activeTab,
    setActiveTab,
    showEditProfileModal,
    setShowEditProfileModal,
    searchTaskQuery,
    setSearchTaskQuery,
    taskFilter,
    setTaskFilter,
    myTasks,
    filteredMyTasks,
    myHistory,
    myRequests,
    myNotifications,
    unreadNotiCount,
    shiftInfo,
    taskStats,
    recentActivities,
    // Wifi Check
    wifiSSID: wifiCheck.wifiSSID,
    isCompanyWifi: wifiCheck.isCompanyWifi,
    onToggleWifi: wifiCheck.toggleWifiSimulation,
    // Modal controls

    earlyCheckOutModalVisible,
    setEarlyCheckOutModalVisible,
    confirmEarlyCheckOut,
    modalVisible,
    setModalVisible,
    selectedType,
    setSelectedType,
    applyDate,
    setApplyDate,
    reason,
    setReason,
    attachedFile,
    notiModalVisible,
    setNotiModalVisible,
    allTasksVisible,
    setAllTasksVisible,
    selectedTask,
    setSelectedTask,
    taskDetailVisible,
    setTaskDetailVisible,
    showAllStatusOptions,
    setShowAllStatusOptions,
    isAnyModalVisible,
    // Handlers
    handleCheckInPress,
    handleUpdateStatus,
    handleProgressStep,
    handleOpenModal,
    handleAttachFile,
    handleSubmitRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead: () => activeEmp?.id && markAllNotificationsAsRead(activeEmp.id),
    refreshData,
  };
}

