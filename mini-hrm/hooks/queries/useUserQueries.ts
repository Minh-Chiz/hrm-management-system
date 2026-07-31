import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';
import { AuthUser, AddEmployeePayload } from '@/types';

export const USER_QUERY_KEY = ['users'] as const;

export function useUsersQuery() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const res = await userService.getEmployees();
      if (!res.success) {
        throw new Error(res.message || 'Lỗi khi tải danh sách nhân viên');
      }
      return res.data || [];
    },
  });
}

export function useAddUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddEmployeePayload) => {
      const res = await userService.addEmployee(payload);
      if (!res.success) {
        throw new Error(res.message || 'Thêm nhân viên thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedFields: Partial<AuthUser>) => {
      const res = await authService.updateUserSession(updatedFields);
      if (!res.success) {
        throw new Error(res.message || 'Cập nhật tài khoản thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<any> }) => {
      const res = await userService.updateEmployee(id, fields);
      if (!res.success) {
        throw new Error(res.message || 'Cập nhật nhân viên thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await userService.deleteEmployee(id);
      if (!res.success) {
        throw new Error(res.message || 'Xóa nhân viên thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

