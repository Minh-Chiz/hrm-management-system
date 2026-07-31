import { create } from 'zustand';
import { requestService, notificationService } from '@/services';
import { PendingRequest, CreateNotificationPayload } from '@/types';

interface RequestState {
  requests: PendingRequest[];
  isLoading: boolean;

  fetchRequests: () => Promise<void>;
  addRequest: (
    senderId: string,
    senderName: string,
    role: string,
    type: PendingRequest['type'],
    description: string,
    reason: string,
    date: string,
    hasAttachment?: boolean,
    attachmentName?: string
  ) => Promise<void>;
  updateRequestStatus: (
    id: string,
    status: PendingRequest['status'],
    onNotificationCreated?: (payload: CreateNotificationPayload) => Promise<void>
  ) => Promise<void>;
  setRequests: (requests: PendingRequest[]) => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  isLoading: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const res = await requestService.getRequests();
      if (res.success && res.data) {
        set({ requests: res.data });
      }
    } catch (e) {
      console.error('[useRequestStore] Error fetching requests:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addRequest: async (
    senderId,
    senderName,
    role,
    type,
    description,
    reason,
    date,
    hasAttachment,
    attachmentName
  ) => {
    const res = await requestService.createRequest({
      senderId,
      senderName,
      role,
      type,
      description,
      reason,
      date,
      hasAttachment,
      attachmentName,
    });
    if (res.success && res.data) set({ requests: res.data });
  },

  updateRequestStatus: async (id, status, onNotificationCreated) => {
    const targetReq = get().requests.find((r) => r.id === id);
    const res = await requestService.updateRequestStatus(id, status);

    if (res.success && res.data) {
      set({ requests: res.data });

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
    }
  },

  setRequests: (requests) => set({ requests }),
}));
