import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInService } from '@/services/checkInService';
import { CreateCheckInPayload } from '@/types';

export const CHECKIN_QUERY_KEY = ['checkIns'] as const;

export function useCheckInLogsQuery() {
  return useQuery({
    queryKey: CHECKIN_QUERY_KEY,
    queryFn: async () => {
      const res = await checkInService.getCheckIns();
      if (!res.success) {
        throw new Error(res.message || 'Lỗi khi tải lịch sử điểm danh');
      }
      return res.data || [];
    },
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCheckInPayload) => {
      const res = await checkInService.addCheckIn(payload);
      if (!res.success) {
        throw new Error(res.message || 'Điểm danh thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHECKIN_QUERY_KEY });
    },
  });
}
