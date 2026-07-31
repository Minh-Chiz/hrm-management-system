import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '@/services/requestService';
import { CreateRequestPayload } from '@/types';

export const REQUEST_QUERY_KEY = ['requests'] as const;

export function useRequestsQuery() {
  return useQuery({
    queryKey: REQUEST_QUERY_KEY,
    queryFn: async () => {
      const res = await requestService.getRequests();
      if (!res.success) {
        throw new Error(res.message || 'Lỗi khi tải danh sách đơn');
      }
      return res.data || [];
    },
  });
}

export function useCreateRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRequestPayload) => {
      const res = await requestService.createRequest(payload);
      if (!res.success) {
        throw new Error(res.message || 'Gửi đơn thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEY });
    },
  });
}

export function useApproveRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await requestService.approveRequest(id);
      if (!res.success) {
        throw new Error(res.message || 'Phê duyệt thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEY });
    },
  });
}

export function useUpdateRequestStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'pending' }) => {
      const res = await requestService.updateRequestStatus(id, status);
      if (!res.success) {
        throw new Error(res.message || 'Cập nhật trạng thái thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEY });
    },
  });
}

