import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '@/services/employeeService';
import { AddEmployeePayload, Employee } from '@/types';

export const EMPLOYEE_QUERY_KEY = ['employees'] as const;

export function useEmployeesQuery() {
  return useQuery({
    queryKey: EMPLOYEE_QUERY_KEY,
    queryFn: async () => {
      const res = await employeeService.getEmployees();
      if (!res.success) {
        throw new Error(res.message || 'Lỗi khi tải danh sách nhân viên');
      }
      return res.data || [];
    },
  });
}

export function useAddEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddEmployeePayload) => {
      const res = await employeeService.addEmployee(payload);
      if (!res.success) {
        throw new Error(res.message || 'Thêm nhân viên thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEY });
    },
  });
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Partial<Employee> }) => {
      const res = await employeeService.updateEmployee(id, fields);
      if (!res.success) {
        throw new Error(res.message || 'Cập nhật nhân viên thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEY });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await employeeService.deleteEmployee(id);
      if (!res.success) {
        throw new Error(res.message || 'Xóa nhân viên thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEY });
    },
  });
}
