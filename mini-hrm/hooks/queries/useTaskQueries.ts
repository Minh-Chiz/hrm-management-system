import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { Task, CreateTaskPayload, Employee } from '@/types';

export const TASK_QUERY_KEY = ['tasks'] as const;

export function useTasksQuery() {
  return useQuery({
    queryKey: TASK_QUERY_KEY,
    queryFn: async () => {
      const res = await taskService.getTasks();
      if (!res.success) {
        throw new Error(res.message || 'Lỗi khi tải danh sách công việc');
      }
      return res.data || [];
    },
  });
}

export function useAssignTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      employees,
    }: {
      payload: CreateTaskPayload;
      employees: Employee[];
    }) => {
      const res = await taskService.createTask(payload, employees);
      if (!res.success) {
        throw new Error(res.message || 'Không thể tạo công việc');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      statusType,
    }: {
      id: string;
      status: Task['status'];
      statusType: Task['statusType'];
    }) => {
      const res = await taskService.updateTaskStatus(id, status, statusType);
      if (!res.success) {
        throw new Error(res.message || 'Không thể cập nhật trạng thái');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useCreateMasterProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      deadline,
      employees,
      budget,
      creatorId,
      creatorName,
    }: {
      title: string;
      deadline: string;
      employees?: Employee[];
      budget?: string;
      creatorId?: string;
      creatorName?: string;
    }) => {
      const res = await taskService.createMasterProject(title, deadline, employees, budget, creatorId, creatorName);
      if (!res.success) {
        throw new Error(res.message || 'Không thể tạo dự án tổng');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useAdvanceMasterPipelineStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      masterTaskId,
      currentStage,
      approvedBy,
      employees,
      customTitle,
    }: {
      masterTaskId: string;
      currentStage: Task['pipelineStage'];
      approvedBy: string;
      employees: Employee[];
      customTitle?: string;
    }) => {
      const res = await taskService.advanceMasterPipelineStage(masterTaskId, currentStage, approvedBy, customTitle, employees);
      if (!res.success) {
        throw new Error(res.message || 'Không thể chuyển giai đoạn dự án');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useHandoverTaskStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      toStage,
      approvedBy,
      employees,
      nextAssigneeId,
    }: {
      id: string;
      toStage: Task['pipelineStage'];
      approvedBy: string;
      employees: Employee[];
      nextAssigneeId?: string;
    }) => {
      const res = await taskService.handoverTaskStage(id, toStage, approvedBy, nextAssigneeId, employees);
      if (!res.success) {
        throw new Error(res.message || 'Không thể bàn giao giai đoạn công việc');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useUpdateTaskProgressMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const res = await taskService.updateTaskProgress(id, progress);
      if (!res.success) {
        throw new Error(res.message || 'Không thể cập nhật tiến độ');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await taskService.deleteTask(id);
      if (!res.success) {
        throw new Error(res.message || 'Không thể xóa công việc');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updatedFields,
      employees,
    }: {
      id: string;
      updatedFields: Partial<Task>;
      employees: Employee[];
    }) => {
      const res = await taskService.updateTask(id, updatedFields, employees);
      if (!res.success) {
        throw new Error(res.message || 'Không thể cập nhật công việc');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEY });
    },
  });
}

