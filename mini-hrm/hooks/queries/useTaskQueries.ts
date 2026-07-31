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
