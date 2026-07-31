import { create } from 'zustand';
import { taskService } from '@/services';
import { Task, Employee } from '@/types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;

  fetchTasks: () => Promise<void>;
  addTask: (
    title: string,
    assigneeId: string,
    supporters: string[],
    deadline: string,
    employees: Employee[],
    pipelineStage?: Task['pipelineStage'],
    budget?: string
  ) => Promise<void>;
  addMasterProject: (
    title: string,
    deadline: string,
    employees: Employee[],
    budget?: string,
    creatorId?: string,
    creatorName?: string
  ) => Promise<void>;
  advanceMasterPipelineStage: (
    masterTaskId: string,
    currentStage: Task['pipelineStage'],
    approvedBy: string,
    employees: Employee[],
    customTitle?: string
  ) => Promise<void>;
  handoverTaskStage: (
    id: string,
    toStage: Task['pipelineStage'],
    approvedBy: string,
    employees: Employee[],
    nextAssigneeId?: string
  ) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status'], statusType: Task['statusType']) => Promise<void>;
  updateTaskProgress: (id: string, progress: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updatedFields: Partial<Task>, employees: Employee[]) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const res = await taskService.getTasks();
      if (res.success && res.data) {
        set({ tasks: res.data });
      }
    } catch (e) {
      console.error('[useTaskStore] Error fetching tasks:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (title, assigneeId, supporters, deadline, employees, pipelineStage, budget) => {
    const res = await taskService.createTask({ title, assigneeId, supporters, deadline, pipelineStage, budget }, employees);
    if (res.success && res.data) set({ tasks: res.data });
  },

  addMasterProject: async (title, deadline, employees, budget, creatorId, creatorName) => {
    const res = await taskService.createMasterProject(title, deadline, employees, budget, creatorId, creatorName);
    if (res.success && res.data) set({ tasks: res.data });
  },

  advanceMasterPipelineStage: async (masterTaskId, currentStage, approvedBy, employees, customTitle) => {
    const res = await taskService.advanceMasterPipelineStage(masterTaskId, currentStage, approvedBy, customTitle, employees);
    if (res.success && res.data) set({ tasks: res.data });
  },

  handoverTaskStage: async (id, toStage, approvedBy, employees, nextAssigneeId) => {
    const res = await taskService.handoverTaskStage(id, toStage, approvedBy, nextAssigneeId, employees);
    if (res.success && res.data) set({ tasks: res.data });
  },

  updateTaskStatus: async (id, status, statusType) => {
    const res = await taskService.updateTaskStatus(id, status, statusType);
    if (res.success && res.data) set({ tasks: res.data });
  },

  updateTaskProgress: async (id, progress) => {
    const res = await taskService.updateTaskProgress(id, progress);
    if (res.success && res.data) set({ tasks: res.data });
  },

  deleteTask: async (id) => {
    const res = await taskService.deleteTask(id);
    if (res.success && res.data) set({ tasks: res.data });
  },

  updateTask: async (id, updatedFields, employees) => {
    const res = await taskService.updateTask(id, updatedFields, employees);
    if (res.success && res.data) set({ tasks: res.data });
  },

  setTasks: (tasks) => set({ tasks }),
}));
