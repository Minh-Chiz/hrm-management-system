import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  userService,
  taskService,
  requestService,
  checkInService,
  notificationService,
} from '@/services';
import { Employee, Task, PendingRequest, CheckInRecord, AppNotification, CreateNotificationPayload } from '@/types';
import { useAuth } from './AuthContext';

export type { Employee, Task, PendingRequest, CheckInRecord, AppNotification };

interface DataContextType {
  employees: Employee[];
  tasks: Task[];
  requests: PendingRequest[];
  checkIns: CheckInRecord[];
  notifications: AppNotification[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addEmployee: (name: string, email: string, password: string, role: 'employee' | 'teamlead', specialization: string) => Promise<void>;
  updateEmployee: (id: string, updatedFields: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addTask: (title: string, assigneeId: string, supporters: string[], deadline: string, pipelineStage?: Task['pipelineStage'], budget?: string) => Promise<void>;
  addMasterProject: (title: string, deadline: string, budget?: string, creatorId?: string, creatorName?: string) => Promise<void>;
  advanceMasterPipelineStage: (masterTaskId: string, currentStage: Task['pipelineStage'], approvedBy: string, customTitle?: string) => Promise<void>;
  handoverTaskStage: (id: string, toStage: Task['pipelineStage'], approvedBy: string, nextAssigneeId?: string) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status'], statusType: Task['statusType']) => Promise<void>;
  updateTaskProgress: (id: string, progress: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updatedFields: Partial<Task>) => Promise<void>;
  addRequest: (senderId: string, senderName: string, role: string, type: PendingRequest['type'], description: string, reason: string, date: string, hasAttachment?: boolean, attachmentName?: string) => Promise<void>;
  updateRequestStatus: (id: string, status: PendingRequest['status']) => Promise<void>;
  addCheckIn: (userId: string, userName: string, type: 'in' | 'out', time: string, date: string, shiftName?: string) => Promise<void>;
  addNotification: (payload: CreateNotificationPayload) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial & Dynamic Data Fetch via Service Layer
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, taskRes, reqRes, checkInRes, notiRes] = await Promise.all([
        userService.getEmployees(),
        taskService.getTasks(),
        requestService.getRequests(),
        checkInService.getCheckIns(),
        notificationService.getNotifications(),
      ]);

      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (taskRes.success && taskRes.data) setTasks(taskRes.data);
      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (checkInRes.success && checkInRes.data) setCheckIns(checkInRes.data);
      if (notiRes.success && notiRes.data) setNotifications(notiRes.data);
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu từ Service API Layer:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [user?.email, user?.role, loadAllData]);

  // ─── Service Handlers ─────────────────────────────────────────────────────────

  const addEmployee = async (
    name: string,
    email: string,
    password: string,
    role: 'employee' | 'teamlead',
    specialization: string
  ) => {
    const res = await userService.addEmployee({ name, email, password, role, specialization });
    if (res.success && res.data) setEmployees(res.data);
  };

  const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
    const res = await userService.updateEmployee(id, updatedFields);
    if (res.success && res.data) setEmployees(res.data);
  };

  const deleteEmployee = async (id: string) => {
    const res = await userService.deleteEmployee(id);
    if (res.success && res.data) setEmployees(res.data);
  };

  const addTask = async (
    title: string,
    assigneeId: string,
    supporters: string[],
    deadline: string,
    pipelineStage?: Task['pipelineStage'],
    budget?: string
  ) => {
    const res = await taskService.createTask({ title, assigneeId, supporters, deadline, pipelineStage, budget }, employees);
    if (res.success && res.data) setTasks(res.data);
  };

  const addMasterProject = async (title: string, deadline: string, budget?: string, creatorId?: string, creatorName?: string) => {
    const res = await taskService.createMasterProject(title, deadline, employees, budget, creatorId, creatorName);
    if (res.success && res.data) setTasks(res.data);
  };

  const advanceMasterPipelineStage = async (
    masterTaskId: string,
    currentStage: Task['pipelineStage'],
    approvedBy: string,
    customTitle?: string
  ) => {
    const res = await taskService.advanceMasterPipelineStage(
      masterTaskId,
      currentStage,
      approvedBy,
      customTitle,
      employees
    );
    if (res.success && res.data) setTasks(res.data);
  };

  const handoverTaskStage = async (
    id: string,
    toStage: Task['pipelineStage'],
    approvedBy: string,
    nextAssigneeId?: string
  ) => {
    const res = await taskService.handoverTaskStage(id, toStage, approvedBy, nextAssigneeId, employees);
    if (res.success && res.data) setTasks(res.data);
  };

  const updateTaskStatus = async (
    id: string,
    status: Task['status'],
    statusType: Task['statusType']
  ) => {
    const res = await taskService.updateTaskStatus(id, status, statusType);
    if (res.success && res.data) setTasks(res.data);
  };

  const updateTaskProgress = async (id: string, progress: number) => {
    const res = await taskService.updateTaskProgress(id, progress);
    if (res.success && res.data) setTasks(res.data);
  };

  const deleteTask = async (id: string) => {
    const res = await taskService.deleteTask(id);
    if (res.success && res.data) setTasks(res.data);
  };

  const updateTask = async (id: string, updatedFields: Partial<Task>) => {
    const res = await taskService.updateTask(id, updatedFields, employees);
    if (res.success && res.data) setTasks(res.data);
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
    const res = await requestService.createRequest({
      senderId,
      senderName,
      role,
      type,
      description,
      reason,
      date,
      hasAttachment,
      attachmentName,
    });
    if (res.success && res.data) setRequests(res.data);
  };

  const addNotification = async (payload: CreateNotificationPayload) => {
    const res = await notificationService.addNotification(payload);
    if (res.success && res.data) setNotifications(res.data);
  };

  const markNotificationAsRead = async (id: string) => {
    const res = await notificationService.markAsRead(id);
    if (res.success && res.data) setNotifications(res.data);
  };

  const markAllNotificationsAsRead = async (userId: string) => {
    const res = await notificationService.markAllAsRead(userId);
    if (res.success && res.data) setNotifications(res.data);
  };

  const updateRequestStatus = async (id: string, status: PendingRequest['status']) => {
    // Find target request before updating to get sender info
    const targetReq = requests.find(r => r.id === id);

    const res = await requestService.updateRequestStatus(id, status);
    if (res.success && res.data) {
      setRequests(res.data);

      // Auto dispatch notification to sender if status is approved or rejected
      if (targetReq && (status === 'approved' || status === 'rejected')) {
        const isApproved = status === 'approved';
        await addNotification({
          userId: targetReq.senderId,
          title: isApproved ? 'Đơn được duyệt 🎉' : 'Đơn bị từ chối ❌',
          message: isApproved
            ? `Đơn xin ${targetReq.type} ngày ${targetReq.date} của bạn đã được duyệt.`
            : `Đơn xin ${targetReq.type} ngày ${targetReq.date} của bạn đã bị từ chối.`,
          type: isApproved ? 'request_approved' : 'request_rejected',
          icon: isApproved ? 'check-circle' : 'cancel',
          iconColor: isApproved ? '#05e777' : '#ffb4ab',
          requestId: id,
        });
      }
    }
  };

  const addCheckIn = async (
    userId: string,
    userName: string,
    type: 'in' | 'out',
    time: string,
    date: string,
    shiftName?: string
  ) => {
    const res = await checkInService.addCheckIn({ userId, userName, type, time, date, shiftName });
    if (res.success && res.data) {
      setCheckIns(res.data);
      Alert.alert(
        type === 'in' ? `Check-in ${shiftName ? `[${shiftName}] ` : ''}thành công! ✅` : `Check-out ${shiftName ? `[${shiftName}] ` : ''}thành công! ✅`,
        `Ghi nhận lúc: ${time}`,
        [{ text: 'Đã rõ' }]
      );
    } else {
      Alert.alert('Điểm danh không thành công', res.message || 'Không thể thực hiện điểm danh.', [{ text: 'Đã rõ' }]);
    }
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        tasks,
        requests,
        checkIns,
        notifications,
        isLoading,
        refreshData: loadAllData,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addTask,
        addMasterProject,
        advanceMasterPipelineStage,
        handoverTaskStage,
        updateTaskStatus,
        updateTaskProgress,
        deleteTask,
        updateTask,
        addRequest,
        updateRequestStatus,
        addCheckIn,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
