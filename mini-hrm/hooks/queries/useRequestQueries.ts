import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '@/services/requestService';
import { notificationService } from '@/services/notificationService';
import { CreateRequestPayload, CreateNotificationPayload, PendingRequest } from '@/types';

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
    mutationFn: async ({
      id,
      status,
      onNotificationCreated,
    }: {
      id: string;
      status: PendingRequest['status'];
      onNotificationCreated?: (payload: CreateNotificationPayload) => Promise<void>;
    }) => {
      const requestsRes = await requestService.getRequests();
      const targetReq = requestsRes.data?.find((r) => r.id === id);

      const res = await requestService.updateRequestStatus(id, status);
      if (!res.success) {
        throw new Error(res.message || 'Cập nhật trạng thái thất bại');
      }

      if (targetReq && (status === 'approved' || status === 'rejected')) {
        const isApproved = status === 'approved';
        const notiPayload: CreateNotificationPayload = {
          userId: targetReq.senderId,
          title: isApproved ? 'Đơn được duyệt 🎉' : 'Đơn bị từ chối ❌',
          message: isApproved
            ? `Đơn xin ${targetReq.type} ngày ${targetReq.date} của bạn đã được duyệt.`
            : `Đơn xin ${targetReq.type} ngày ${targetReq.date} của bạn đã bị từ chối.`,
          type: isApproved ? 'request_approved' : 'request_rejected',
          icon: isApproved ? 'check-circle' : 'cancel',
          iconColor: isApproved ? '#05e777' : '#ffb4ab',
          requestId: id,
        };

        if (onNotificationCreated) {
          await onNotificationCreated(notiPayload);
        } else {
          await notificationService.addNotification(notiPayload);
        }
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUEST_QUERY_KEY });
    },
  });
}


