import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTasksQuery, useUpdateTaskStatusMutation } from '@/hooks/queries/useTaskQueries';
import { useUsersQuery } from '@/hooks/queries/useUserQueries';
import { useRequestsQuery, useApproveRequestMutation } from '@/hooks/queries/useRequestQueries';
import { useCheckInLogsQuery, useCheckInMutation } from '@/hooks/queries/useCheckInQueries';
import { useShiftTimer } from '@/features/employee/hooks/useShiftTimer';
import { useNotificationStore } from '@/store';
import { Task, Employee, PendingRequest, AppNotification } from '@/types';

export function useTeamleadDashboard() {
  const { user, logout } = useAuth();
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasksQuery();
  const { data: employees = [], isLoading: usersLoading, refetch: refetchUsers } = useUsersQuery();
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useRequestsQuery();
  const { data: checkIns = [], isLoading: checkInsLoading, refetch: refetchCheckIns } = useCheckInLogsQuery();

  const updateTaskStatusMutation = useUpdateTaskStatusMutation();
  const approveRequestMutation = useApproveRequestMutation();
  const checkInMutation = useCheckInMutation();

  const { notifications, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useNotificationStore();
  const [notiModalVisible, setNotiModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'tasks' | 'team' | 'profile'>('dashboard');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const todayStr = useMemo(() => new Date().toLocaleDateString('vi-VN'), []);

  const activeEmp = useMemo(
    () => employees.find((e) => e.name === user?.name || (user?.email && e.email === user.email)),
    [employees, user]
  );
  const currentUserId = user?.id || activeEmp?.id;

  const myNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        !n.userId ||
        (currentUserId && String(n.userId) === String(currentUserId)) ||
        n.userId === '1' ||
        n.userId === 'all'
    );
  }, [notifications, currentUserId]);

  const unreadNotiCount = useMemo(() => {
    return myNotifications.filter((n) => !n.read).length;
  }, [myNotifications]);

  const handleMarkNotificationAsRead = useCallback(
    async (id: string) => {
      await markNotificationAsRead(id);
    },
    [markNotificationAsRead]
  );

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    if (currentUserId) {
      await markAllNotificationsAsRead(String(currentUserId));
    }
  }, [markAllNotificationsAsRead, currentUserId]);

  const myCheckInHistory = useMemo(
    () =>
      checkIns.filter(
        (c) =>
          (currentUserId && String(c.userId) === String(currentUserId)) ||
          (user?.name && c.userName === user.name)
      ),
    [checkIns, currentUserId, user?.name]
  );

  const shiftInfo = useShiftTimer(myCheckInHistory);

  const handleCheckInPress = useCallback(async () => {
    if (shiftInfo.isCompletedToday) {
      Alert.alert('Đã hoàn thành', 'Bạn đã hoàn thành điểm danh tất cả các ca hôm nay rồi!', [{ text: 'Đã rõ' }]);
      return;
    }
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = new Date().toISOString().split('T')[0];
    const type = shiftInfo.checkedIn ? 'out' : 'in';
    let status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'NORMAL' = 'NORMAL';
    let lateMinutes: number | undefined;
    let earlyMinutes: number | undefined;

    if (type === 'in') {
      if (shiftInfo.isLateCheckIn) {
        status = 'LATE';
        lateMinutes = shiftInfo.lateMinutes;
      } else {
        status = 'ON_TIME';
      }
    } else {
      if (shiftInfo.isEarlyCheckOut) {
        status = 'EARLY_LEAVE';
        earlyMinutes = shiftInfo.remainingMinutes;
      }
    }

    await checkInMutation.mutateAsync({
      userId: String(currentUserId || 'guest'),
      userName: user?.name || activeEmp?.name || 'Guest',
      type,
      time,
      date,
      shiftName: shiftInfo.activeShiftName,
      status,
      lateMinutes,
      earlyMinutes,
    });
  }, [shiftInfo, checkInMutation, currentUserId, user?.name, activeEmp?.name]);

  const onlineMembers = useMemo(() => {
    return employees.filter((e) => e.status === 'Active');
  }, [employees]);

  const teamStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Hoàn thành').length;
    const inProgress = tasks.filter((t) => t.status === 'Đang làm' || t.status === 'Cần làm').length;
    const inReview = tasks.filter((t) => t.status === 'Chờ review' || t.status === 'Chờ test').length;
    const overdue = tasks.filter((t) => t.status === 'Trễ hạn').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      inReview,
      overdue,
      completionRate,
      onlineCount: onlineMembers.length,
      totalCount: employees.length,
    };
  }, [tasks, onlineMembers, employees]);

  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'pending');
  }, [requests]);

  const handleUpdateTaskStatus = (id: string, status: Task['status'], statusType: Task['statusType']) => {
    updateTaskStatusMutation.mutate({ id, status, statusType });
  };

  const handleApproveRequest = (id: string) => {
    approveRequestMutation.mutate(id);
  };

  const refetchAll = async () => {
    await Promise.all([refetchTasks(), refetchUsers(), refetchRequests(), refetchCheckIns()]);
  };

  const isLoading = tasksLoading || usersLoading || requestsLoading || checkInsLoading;

  return {
    tasks,
    employees,
    requests,
    checkIns,
    onlineMembers,
    teamStats,
    pendingRequests,
    isLoading,
    shiftInfo,
    myCheckInHistory,
    user,
    logout,
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
    handleUpdateTaskStatus,
    handleApproveRequest,
    refetchAll,
  };
}
