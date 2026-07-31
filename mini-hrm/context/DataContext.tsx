import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import {
  useEmployeeStore,
  useTaskStore,
  useRequestStore,
  useCheckInStore,
  useNotificationStore,
} from '@/store';
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

  const employees = useEmployeeStore((s) => s.employees);
  const fetchEmployees = useEmployeeStore((s) => s.fetchEmployees);
  const addEmp = useEmployeeStore((s) => s.addEmployee);
  const updateEmp = useEmployeeStore((s) => s.updateEmployee);
  const deleteEmp = useEmployeeStore((s) => s.deleteEmployee);

  const tasks = useTaskStore((s) => s.tasks);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const addTaskStore = useTaskStore((s) => s.addTask);
  const addMasterProjStore = useTaskStore((s) => s.addMasterProject);
  const advanceMasterStore = useTaskStore((s) => s.advanceMasterPipelineStage);
  const handoverTaskStore = useTaskStore((s) => s.handoverTaskStage);
  const updateTaskStatusStore = useTaskStore((s) => s.updateTaskStatus);
  const updateTaskProgressStore = useTaskStore((s) => s.updateTaskProgress);
  const deleteTaskStore = useTaskStore((s) => s.deleteTask);
  const updateTaskStore = useTaskStore((s) => s.updateTask);

  const requests = useRequestStore((s) => s.requests);
  const fetchRequests = useRequestStore((s) => s.fetchRequests);
  const addRequestStore = useRequestStore((s) => s.addRequest);
  const updateRequestStatusStore = useRequestStore((s) => s.updateRequestStatus);

  const checkIns = useCheckInStore((s) => s.checkIns);
  const fetchCheckIns = useCheckInStore((s) => s.fetchCheckIns);
  const addCheckInStore = useCheckInStore((s) => s.addCheckIn);

  const notifications = useNotificationStore((s) => s.notifications);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const addNotiStore = useNotificationStore((s) => s.addNotification);
  const markNotiReadStore = useNotificationStore((s) => s.markNotificationAsRead);
  const markAllNotiReadStore = useNotificationStore((s) => s.markAllNotificationsAsRead);

  const isEmpLoading = useEmployeeStore((s) => s.isLoading);
  const isTaskLoading = useTaskStore((s) => s.isLoading);
  const isReqLoading = useRequestStore((s) => s.isLoading);
  const isCheckInLoading = useCheckInStore((s) => s.isLoading);
  const isNotiLoading = useNotificationStore((s) => s.isLoading);

  const isLoading = isEmpLoading || isTaskLoading || isReqLoading || isCheckInLoading || isNotiLoading;

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchEmployees(),
      fetchTasks(),
      fetchRequests(),
      fetchCheckIns(),
      fetchNotifications(),
    ]);
  }, [fetchEmployees, fetchTasks, fetchRequests, fetchCheckIns, fetchNotifications]);

  useEffect(() => {
    refreshData();
  }, [user?.email, user?.role, refreshData]);

  const addTask = async (title: string, assigneeId: string, supporters: string[], deadline: string, pipelineStage?: Task['pipelineStage'], budget?: string) => {
    await addTaskStore(title, assigneeId, supporters, deadline, employees, pipelineStage, budget);
  };

  const addMasterProject = async (title: string, deadline: string, budget?: string, creatorId?: string, creatorName?: string) => {
    await addMasterProjStore(title, deadline, employees, budget, creatorId, creatorName);
  };

  const advanceMasterPipelineStage = async (masterTaskId: string, currentStage: Task['pipelineStage'], approvedBy: string, customTitle?: string) => {
    await advanceMasterStore(masterTaskId, currentStage, approvedBy, employees, customTitle);
  };

  const handoverTaskStage = async (id: string, toStage: Task['pipelineStage'], approvedBy: string, nextAssigneeId?: string) => {
    await handoverTaskStore(id, toStage, approvedBy, employees, nextAssigneeId);
  };

  const updateTask = async (id: string, updatedFields: Partial<Task>) => {
    await updateTaskStore(id, updatedFields, employees);
  };

  const updateRequestStatus = async (id: string, status: PendingRequest['status']) => {
    await updateRequestStatusStore(id, status, addNotiStore);
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
        refreshData,
        addEmployee: addEmp,
        updateEmployee: updateEmp,
        deleteEmployee: deleteEmp,
        addTask,
        addMasterProject,
        advanceMasterPipelineStage,
        handoverTaskStage,
        updateTaskStatus: updateTaskStatusStore,
        updateTaskProgress: updateTaskProgressStore,
        deleteTask: deleteTaskStore,
        updateTask,
        addRequest: addRequestStore,
        updateRequestStatus,
        addCheckIn: addCheckInStore,
        addNotification: addNotiStore,
        markNotificationAsRead: markNotiReadStore,
        markAllNotificationsAsRead: markAllNotiReadStore,
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
