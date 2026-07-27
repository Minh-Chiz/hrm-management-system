import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiResponse, CreateTaskPayload, Employee, Task } from '@/types';
import { simulateDelay, fetchWithAuth } from './apiUtils';

const STORAGE_KEY_TASKS = '@hrm_tasks';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'master_sample_01',
    title: '[Dự án] Nâng cấp Hệ thống Đăng nhập Sinh trắc học & AI Security',
    status: 'Đang làm',
    statusType: 'warning',
    progress: 50, // 33.3% Design (100% completed) + 16.7% Dev (50% done) = 50%
    pipelineStage: 'development',
    isMasterProject: true,
    creatorId: '3',
    creatorName: 'Lê Hoàng Dương',
    assigneeId: '3',
    assigneeName: 'Lê Hoàng Dương',
    assigneeInitials: 'HD',
    supporters: [],
    deadline: '01/09/2026',
    dueType: 'normal',
    budget: '150.000.000 VNĐ',
    handoverHistory: [
      {
        id: 'h_1',
        fromStage: 'design',
        toStage: 'development',
        approvedBy: 'Trần Thiết Kế (Lead Design)',
        approvedAt: '18/07/2026',
        note: 'Đã hoàn thiện UI/UX biometric login.',
      },
    ],
  },
  {
    id: 'sub_design_sample_01',
    title: 'Thiết kế UI/UX Đăng nhập Vân tay & FaceID',
    status: 'Hoàn thành',
    statusType: 'success',
    progress: 100,
    pipelineStage: 'design',
    masterTaskId: 'master_sample_01',
    masterTaskTitle: 'Nâng cấp Hệ thống Đăng nhập Sinh trắc học & AI Security',
    assigneeId: '3',
    assigneeName: 'Lê Hoàng Dương',
    assigneeInitials: 'HD',
    supporters: [],
    deadline: '18/07/2026',
    dueType: 'normal',
  },
  {
    id: 'sub_dev_sample_01',
    title: 'Lập trình tích hợp Biometric SDK & API Authentication',
    status: 'Đang làm',
    statusType: 'warning',
    progress: 50,
    pipelineStage: 'development',
    masterTaskId: 'master_sample_01',
    masterTaskTitle: 'Nâng cấp Hệ thống Đăng nhập Sinh trắc học & AI Security',
    assigneeId: '1',
    assigneeName: 'Trần Văn A',
    assigneeInitials: 'TA',
    supporters: ['2'],
    deadline: '01/09/2026',
    dueType: 'normal',
  },
  {
    id: '1',
    title: 'Code giao diện Login',
    status: 'Đang làm',
    statusType: 'warning',
    progress: 40,
    pipelineStage: 'development',
    assigneeId: '1',
    assigneeName: 'Trần Văn A',
    assigneeInitials: 'TA',
    supporters: ['2', '4'],
    deadline: '18/07/2026',
    dueType: 'normal',
    budget: '15.000.000 VNĐ',
  },
  {
    id: '2',
    title: 'Fix bug màn Dashboard',
    status: 'Chờ test',
    statusType: 'primary',
    progress: 80,
    pipelineStage: 'testing',
    assigneeId: '1',
    assigneeName: 'Trần Văn A',
    assigneeInitials: 'TA',
    supporters: [],
    deadline: '19/07/2026',
    dueType: 'normal',
    budget: '10.000.000 VNĐ',
  },
  {
    id: '3',
    title: 'Tạo data giả lập',
    status: 'Chờ review',
    statusType: 'primary',
    progress: 75,
    pipelineStage: 'development',
    assigneeId: '1',
    assigneeName: 'Trần Văn A',
    assigneeInitials: 'TA',
    supporters: [],
    deadline: '20/07/2026',
    dueType: 'normal',
    budget: '8.500.000 VNĐ',
  },
  {
    id: '4',
    title: 'Viết unit test cho API module',
    status: 'Hoàn thành',
    statusType: 'success',
    progress: 100,
    pipelineStage: 'completed',
    assigneeId: '1',
    assigneeName: 'Trần Văn A',
    assigneeInitials: 'TA',
    supporters: [],
    deadline: '14/07/2026',
    dueType: 'normal',
    budget: '12.000.000 VNĐ',
  },
  {
    id: '5',
    title: 'Tối ưu API Dashboard',
    status: 'Trễ hạn',
    statusType: 'danger',
    progress: 25,
    pipelineStage: 'development',
    assigneeId: '2',
    assigneeName: 'Nguyễn Thị B',
    assigneeInitials: 'NB',
    supporters: [],
    deadline: '15/07/2026',
    dueType: 'overdue',
    budget: '20.000.000 VNĐ',
  },
];

const mapBackendTaskToFrontendTask = (task: any): Task => {
  const assigneeName = task.assignee?.name || task.assigneeName || 'N/A';
  const initials = assigneeName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  return {
    id: String(task.id),
    title: task.title,
    assigneeId: String(task.assigneeId),
    assigneeName: assigneeName,
    assigneeInitials: initials || '??',
    supporters: Array.isArray(task.supporters)
      ? task.supporters
      : (typeof task.supporters === 'string' ? JSON.parse(task.supporters || '[]') : []),
    deadline: task.deadline,
    status: task.status,
    statusType: task.statusType || 'default',
    dueType: task.dueType || 'normal',
    description: task.description || '',
    isMasterProject: Boolean(task.isMasterProject),
    masterTaskId: task.masterTaskId ? String(task.masterTaskId) : undefined,
    masterTaskTitle: task.masterTaskTitle || undefined,
    creatorId: task.creatorId ? String(task.creatorId) : undefined,
    creatorName: task.creatorName || undefined,
    progress: task.progress !== null && task.progress !== undefined ? task.progress : 0,
    pipelineStage: task.pipelineStage || undefined,
    handoverHistory: Array.isArray(task.handoverHistory)
      ? task.handoverHistory
      : (typeof task.handoverHistory === 'string' ? JSON.parse(task.handoverHistory || '[]') : []),
    budget: task.budget || undefined,
  };
};

export const taskService = {
  /**
   * Fetch all tasks
   */
  async getTasks(): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_TASKS);
        let data: Task[] = stored ? (JSON.parse(stored) as Task[]) : INITIAL_TASKS;

        // Auto-inject and migrate sample Master Project if needed
        let needsSave = false;
        if (!data.some((t) => t.id === 'master_sample_01')) {
          data = [...INITIAL_TASKS.slice(0, 3), ...data];
          needsSave = true;
        } else {
          data = data.map((t) => {
            if (t.id === 'master_sample_01' && (t.assigneeName === 'Trần Văn A' || !t.creatorId)) {
              needsSave = true;
              return {
                ...t,
                creatorId: '3',
                creatorName: 'Lê Hoàng Dương',
                assigneeId: '3',
                assigneeName: 'Lê Hoàng Dương',
                assigneeInitials: 'HD',
              };
            }
            return t;
          });
        }

        if (needsSave) {
          await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(data));
        }

        return { success: true, data };
      } catch (e) {
        return { success: true, data: INITIAL_TASKS };
      }
    } else {
      const res = await fetchWithAuth<any[]>('/tasks');
      if (res.success && Array.isArray(res.data)) {
        const tasks = res.data.map(mapBackendTaskToFrontendTask);
        return { success: true, data: tasks };
      }
      return { success: false, data: [], message: res.message };
    }
  },

  /**
   * Fetch task by ID
   */
  async getTaskById(id: string): Promise<ApiResponse<Task | null>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(200);
      const res = await this.getTasks();
      const task = res.data?.find((t) => t.id === id) || null;
      return { success: !!task, data: task, message: task ? undefined : 'Không tìm thấy công việc' };
    } else {
      const res = await fetchWithAuth<any>(`/tasks/${id}`);
      if (res.success && res.data) {
        return { success: true, data: mapBackendTaskToFrontendTask(res.data) };
      }
      return { success: false, data: null, message: res.message };
    }
  },

  /**
   * Create a new task
   */
  async createTask(
    payload: CreateTaskPayload,
    employees: Employee[]
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      const emp = employees.find((e) => e.id === payload.assigneeId);
      const initials = emp
        ? emp.name
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(-2)
            .map((w) => w[0].toUpperCase())
            .join('')
        : '?';

      const newTask: Task = {
        id: String(Date.now()),
        title: payload.title,
        status: 'Cần làm',
        statusType: 'neutral',
        pipelineStage: payload.pipelineStage,
        assigneeId: payload.assigneeId,
        assigneeName: emp ? emp.name : 'Chưa phân công',
        assigneeInitials: initials,
        supporters: payload.supporters,
        deadline: payload.deadline,
        dueType: 'normal',
        budget: payload.budget,
      };

      const updated = [newTask, ...tasks];
      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Phân công công việc thành công' };
    } else {
      const createRes = await fetchWithAuth<any>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: payload.title,
          assigneeId: parseInt(payload.assigneeId, 10) || 1,
          supporters: payload.supporters,
          deadline: payload.deadline,
          pipelineStage: payload.pipelineStage,
          budget: payload.budget,
        }),
      });

      if (createRes.success) {
        return await this.getTasks();
      }
      return { success: false, message: createRes.message };
    }
  },

  /**
   * Update status of a task
   */
  async updateTaskStatus(
    id: string,
    status: Task['status'],
    statusType: Task['statusType']
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      const updated = tasks.map((task) =>
        task.id === id ? { ...task, status, statusType } : task
      );

      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Cập nhật trạng thái thành công' };
    } else {
      const updateRes = await fetchWithAuth<any>(`/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, statusType }),
      });

      if (updateRes.success) {
        return await this.getTasks();
      }
      return { success: false, message: updateRes.message };
    }
  },

  /**
   * Delete task by ID
   */
  async deleteTask(id: string): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;
      const updated = tasks.filter((task) => task.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Đã xóa công việc' };
    } else {
      const delRes = await fetchWithAuth<any>(`/tasks/${id}`, { method: 'DELETE' });
      if (delRes.success) {
        return await this.getTasks();
      }
      return { success: false, message: delRes.message };
    }
  },

  /**
   * Update fields of a task
   */
  async updateTask(
    id: string,
    updatedFields: Partial<Task>,
    employees: Employee[]
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      let fields = { ...updatedFields };
      if (fields.assigneeId) {
        const emp = employees.find((e) => e.id === fields.assigneeId);
        if (emp) {
          fields.assigneeName = emp.name;
          fields.assigneeInitials = emp.name
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(-2)
            .map((w) => w[0].toUpperCase())
            .join('');
        }
      }

      const updated = tasks.map((task) =>
        task.id === id ? { ...task, ...fields } : task
      );

      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Lưu thay đổi thành công' };
    } else {
      const payload: any = { ...updatedFields };
      if (payload.assigneeId) {
        payload.assigneeId = parseInt(String(payload.assigneeId), 10);
      }

      const updateRes = await fetchWithAuth<any>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (updateRes.success) {
        return await this.getTasks();
      }
      return { success: false, message: updateRes.message };
    }
  },

  /**
   * Handover / advance pipeline stage of a task
   */
  async handoverTaskStage(
    id: string,
    toStage: Task['pipelineStage'],
    approvedBy: string,
    nextAssigneeId?: string,
    employees: Employee[] = []
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      const updated = tasks.map((task) => {
        if (task.id !== id) return task;

        const fromStage = task.pipelineStage || 'design';
        const newHistory = [
          ...(task.handoverHistory || []),
          {
            id: String(Date.now()),
            fromStage,
            toStage: toStage!,
            approvedBy,
            approvedAt: new Date().toLocaleDateString('vi-VN'),
          },
        ];

        let newStatus: Task['status'] = task.status;
        let newStatusType: Task['statusType'] = task.statusType;

        if (toStage === 'development') {
          newStatus = 'Cần làm';
          newStatusType = 'neutral';
        } else if (toStage === 'testing') {
          newStatus = 'Chờ test';
          newStatusType = 'primary';
        } else if (toStage === 'completed') {
          newStatus = 'Hoàn thành';
          newStatusType = 'success';
        }

        let assigneeId = task.assigneeId;
        let assigneeName = task.assigneeName;
        let assigneeInitials = task.assigneeInitials;

        if (nextAssigneeId) {
          const emp = employees.find((e) => e.id === nextAssigneeId);
          if (emp) {
            assigneeId = emp.id;
            assigneeName = emp.name;
            assigneeInitials = emp.name
              .trim()
              .split(' ')
              .filter(Boolean)
              .slice(-2)
              .map((w) => w[0].toUpperCase())
              .join('');
          }
        }

        return {
          ...task,
          pipelineStage: toStage,
          status: newStatus,
          statusType: newStatusType,
          assigneeId,
          assigneeName,
          assigneeInitials,
          handoverHistory: newHistory,
        };
      });

      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return { success: true, data: updated, message: `Đã bàn giao sang giai đoạn ${toStage}` };
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/${id}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStage, approvedBy, nextAssigneeId }),
      });
      return await response.json();
    }
  },

  /**
   * Create a Master Project with automatic Stage 1 (Design) Sub-Task
   */
  async createMasterProject(
    title: string,
    deadline: string,
    employees: Employee[] = [],
    budget?: string,
    creatorId?: string,
    creatorName?: string
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      const masterId = `master_${Date.now()}`;

      // Find Design Lead or any Design employee
      const designLead =
        employees.find(
          (e) =>
            e.role === 'teamlead' &&
            (e.specialization?.toLowerCase().includes('design') ||
              e.specialization?.toLowerCase().includes('ui/ux'))
        ) ||
        employees.find((e) =>
          e.specialization?.toLowerCase().includes('design')
        ) ||
        employees[0];

      const getInitials = (name?: string) =>
        name
          ? name
              .trim()
              .split(' ')
              .filter(Boolean)
              .slice(-2)
              .map((w) => w[0].toUpperCase())
              .join('')
          : '??';

      const masterTask: Task = {
        id: masterId,
        title: `[Dự án] ${title}`,
        status: 'Đang làm',
        statusType: 'warning',
        pipelineStage: 'design',
        isMasterProject: true,
        creatorId,
        creatorName,
        assigneeId: designLead ? designLead.id : '1',
        assigneeName: designLead ? designLead.name : 'Chưa phân công',
        assigneeInitials: getInitials(designLead?.name),
        supporters: [],
        deadline,
        dueType: 'normal',
        budget,
      };

      const stage1SubTask: Task = {
        id: `sub_design_${Date.now()}`,
        title: `Vẽ thiết kế giao diện cho: ${title}`,
        status: 'Cần làm',
        statusType: 'neutral',
        pipelineStage: 'design',
        masterTaskId: masterId,
        masterTaskTitle: title,
        creatorId,
        creatorName,
        assigneeId: designLead ? designLead.id : '1',
        assigneeName: designLead ? designLead.name : 'Chưa phân công',
        assigneeInitials: getInitials(designLead?.name),
        supporters: [],
        deadline,
        dueType: 'normal',
      };

      const updated = [masterTask, stage1SubTask, ...tasks];
      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return {
        success: true,
        data: updated,
        message: 'Tạo Dự án Lớn & Chặng Thiết kế thành công!',
      };
    } else {
      const response = await fetch(`${API_CONFIG.BASE_URL}/tasks/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, deadline }),
      });
      return await response.json();
    }
  },

  /**
   * Advance Master Project to next stage and auto-generate sub-task for next Team Lead
   */
  async advanceMasterPipelineStage(
    masterTaskId: string,
    currentStage: Task['pipelineStage'],
    approvedBy: string,
    customTitle?: string,
    employees: Employee[] = []
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      const getInitials = (name?: string) =>
        name
          ? name
              .trim()
              .split(' ')
              .filter(Boolean)
              .slice(-2)
              .map((w) => w[0].toUpperCase())
              .join('')
          : '??';

      let nextStage: Task['pipelineStage'] = 'completed';
      let targetSpecializationKeywords: string[] = [];

      if (currentStage === 'design') {
        nextStage = 'development';
        targetSpecializationKeywords = ['frontend', 'backend', 'mobile', 'dev'];
      } else if (currentStage === 'development') {
        nextStage = 'testing';
        targetSpecializationKeywords = ['tester', 'qa'];
      }

      // Find receiving Lead
      const nextLead =
        employees.find(
          (e) =>
            e.role === 'teamlead' &&
            targetSpecializationKeywords.some((kw) =>
              e.specialization?.toLowerCase().includes(kw)
            )
        ) ||
        employees.find((e) =>
          targetSpecializationKeywords.some((kw) =>
            e.specialization?.toLowerCase().includes(kw)
          )
        ) ||
        employees[0];

      let newSubTask: Task | null = null;

      const masterProject = tasks.find((t) => t.id === masterTaskId);
      const cleanTitle = masterProject
        ? masterProject.title.replace('[Dự án] ', '')
        : 'Dự án';

      if (nextStage !== 'completed') {
        const subTitle =
          customTitle && customTitle.trim()
            ? customTitle
            : nextStage === 'development'
            ? `Lập trình & Tích hợp: ${cleanTitle}`
            : `Kiểm thử QA cho: ${cleanTitle}`;

        newSubTask = {
          id: `sub_${nextStage}_${Date.now()}`,
          title: subTitle,
          status: 'Cần làm',
          statusType: 'neutral',
          pipelineStage: nextStage,
          masterTaskId,
          masterTaskTitle: cleanTitle,
          assigneeId: nextLead ? nextLead.id : '1',
          assigneeName: nextLead ? nextLead.name : 'Chưa phân công',
          assigneeInitials: getInitials(nextLead?.name),
          supporters: [],
          deadline: masterProject ? masterProject.deadline : '18/07/2026',
          dueType: 'normal',
        };
      }

      // Set previous subtask to 100% completed
      const updated = tasks.map((t) => {
        if (t.masterTaskId === masterTaskId && t.pipelineStage === currentStage) {
          return { ...t, progress: 100, status: 'Hoàn thành' as const, statusType: 'success' as const };
        }
        if (t.id === masterTaskId) {
          return {
            ...t,
            pipelineStage: nextStage,
            status:
              nextStage === 'completed'
                ? ('Hoàn thành' as const)
                : ('Đang làm' as const),
            statusType:
              nextStage === 'completed'
                ? ('success' as const)
                : ('warning' as const),
            handoverHistory: [
              ...(t.handoverHistory || []),
              {
                id: String(Date.now()),
                fromStage: currentStage!,
                toStage: nextStage!,
                approvedBy,
                approvedAt: new Date().toLocaleDateString('vi-VN'),
                note: customTitle,
              },
            ],
          };
        }
        return t;
      });

      let finalTasks = newSubTask ? [newSubTask, ...updated] : updated;

      // Calculate overall Master Project progress based on 3 stages (33.3% / 33.3% / 33.4%)
      const masterIdx = finalTasks.findIndex(t => t.id === masterTaskId);
      if (masterIdx !== -1) {
        const subTasks = finalTasks.filter(t => t.masterTaskId === masterTaskId);
        const designSub = subTasks.find(t => t.pipelineStage === 'design');
        const devSub = subTasks.find(t => t.pipelineStage === 'development');
        const qaSub = subTasks.find(t => t.pipelineStage === 'testing');

        const designProg = designSub ? (designSub.progress || 0) : (['development', 'testing', 'completed'].includes(nextStage || '') ? 100 : 0);
        const devProg = devSub ? (devSub.progress || 0) : (['testing', 'completed'].includes(nextStage || '') ? 100 : 0);
        const qaProg = qaSub ? (qaSub.progress || 0) : (nextStage === 'completed' ? 100 : 0);

        const weightedProgress = Math.min(100, Math.round((designProg * 33.3 + devProg * 33.3 + qaProg * 33.4) / 100));
        finalTasks[masterIdx] = {
          ...finalTasks[masterIdx],
          progress: weightedProgress,
        };
      }

      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(finalTasks));
      return {
        success: true,
        data: finalTasks,
        message:
          nextStage === 'completed'
            ? 'Đã nghiệm thu hoàn thành toàn bộ Dự án Lớn!'
            : `Đã tự động bàn giao Dự án sang giai đoạn ${nextStage}!`,
      };
    } else {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/tasks/master/${masterTaskId}/advance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentStage, approvedBy, customTitle }),
        }
      );
      return await response.json();
    }
  },

  /**
   * Update task progress percentage (0 - 100%)
   */
  async updateTaskProgress(
    id: string,
    progress: number
  ): Promise<ApiResponse<Task[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getTasks();
      const tasks = res.data || INITIAL_TASKS;

      let targetMasterTaskId: string | undefined;

      let updated = tasks.map((task) => {
        if (task.id !== id) return task;

        if (task.masterTaskId) {
          targetMasterTaskId = task.masterTaskId;
        }

        let newStatus = task.status;
        let newStatusType = task.statusType;

        if (progress === 100) {
          newStatus = 'Hoàn thành';
          newStatusType = 'success';
        } else if (progress > 0 && task.status === 'Cần làm') {
          newStatus = 'Đang làm';
          newStatusType = 'warning';
        }

        return {
          ...task,
          progress,
          status: newStatus,
          statusType: newStatusType,
        };
      });

      // If updating a sub-task belonging to a Master Project, recalculate Master Project overall progress
      if (targetMasterTaskId) {
        const masterIdx = updated.findIndex((t) => t.id === targetMasterTaskId);
        if (masterIdx !== -1) {
          const masterTask = updated[masterIdx];
          const subTasks = updated.filter((t) => t.masterTaskId === targetMasterTaskId);
          const designSub = subTasks.find((t) => t.pipelineStage === 'design');
          const devSub = subTasks.find((t) => t.pipelineStage === 'development');
          const qaSub = subTasks.find((t) => t.pipelineStage === 'testing');

          const designProg = designSub ? (designSub.progress || 0) : (['development', 'testing', 'completed'].includes(masterTask.pipelineStage || '') ? 100 : 0);
          const devProg = devSub ? (devSub.progress || 0) : (['testing', 'completed'].includes(masterTask.pipelineStage || '') ? 100 : 0);
          const qaProg = qaSub ? (qaSub.progress || 0) : (masterTask.pipelineStage === 'completed' ? 100 : 0);

          const weightedProgress = Math.min(100, Math.round((designProg * 33.3 + devProg * 33.3 + qaProg * 33.4) / 100));

          updated[masterIdx] = {
            ...masterTask,
            progress: weightedProgress,
            status: weightedProgress === 100 ? 'Hoàn thành' : 'Đang làm',
            statusType: weightedProgress === 100 ? 'success' : 'warning',
          };
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(updated));
      return {
        success: true,
        data: updated,
        message: `Đã cập nhật tiến độ ${progress}%`,
      };
    } else {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/tasks/${id}/progress`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress }),
        }
      );
      return await response.json();
    }
  },
};
