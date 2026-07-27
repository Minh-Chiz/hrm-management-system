import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiResponse, CreateRequestPayload, PendingRequest } from '@/types';
import { simulateDelay, fetchWithAuth } from './apiUtils';

const STORAGE_KEY_REQUESTS = '@hrm_requests';

export const INITIAL_REQUESTS: PendingRequest[] = [
  {
    id: '1',
    senderId: '2',
    senderName: 'Nguyễn Thị B',
    role: 'Mobile Dev',
    type: 'Nghỉ phép',
    description: 'Xin nghỉ phép chiều Thứ 4 (15/07)',
    reason: 'Đi khám răng',
    date: '15/07/2026',
    timeAgo: '2 giờ trước',
    status: 'pending',
    accentColor: '#e9c400',
    typeIcon: 'event-busy',
  },
];

const mapBackendRequestToPendingRequest = (req: any): PendingRequest => {
  const typeIcons: Record<string, any> = {
    'Nghỉ phép': 'event-busy',
    'WFH': 'event-busy',
    'Chấm công bù': 'edit-calendar',
    'OT': 'more-time',
  };

  const accentColors: Record<string, string> = {
    'Nghỉ phép': '#e9c400',
    'WFH': '#00daf3',
    'Chấm công bù': '#c3f5ff',
    'OT': '#b388ff',
  };

  return {
    id: String(req.id),
    senderId: String(req.senderId),
    senderName: req.sender ? req.sender.name : req.senderName,
    role: req.role,
    type: req.type as PendingRequest['type'],
    description: req.description || '',
    reason: req.reason || '',
    date: req.date,
    timeAgo: req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : 'Mới',
    status: req.status as PendingRequest['status'],
    accentColor: accentColors[req.type] || '#e9c400',
    hasAttachment: Boolean(req.hasAttachment),
    attachmentName: req.attachmentName || undefined,
    typeIcon: typeIcons[req.type] || 'event-busy',
  };
};

export const requestService = {
  /**
   * Fetch all requests
   */
  async getRequests(): Promise<ApiResponse<PendingRequest[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_REQUESTS);
        const data: PendingRequest[] = stored ? (JSON.parse(stored) as PendingRequest[]) : INITIAL_REQUESTS;
        return { success: true, data };
      } catch (e) {
        return { success: true, data: INITIAL_REQUESTS };
      }
    } else {
      const res = await fetchWithAuth<any[]>('/requests');
      if (res.success && Array.isArray(res.data)) {
        const requests = res.data.map(mapBackendRequestToPendingRequest);
        return { success: true, data: requests };
      }
      return { success: false, data: [], message: res.message };
    }
  },

  /**
   * Create a new leave/OT/makeup request
   */
  async createRequest(payload: CreateRequestPayload): Promise<ApiResponse<PendingRequest[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getRequests();
      const requests = res.data || INITIAL_REQUESTS;

      const typeIcons = {
        'Nghỉ phép': 'event-busy' as const,
        'WFH': 'event-busy' as const,
        'Chấm công bù': 'edit-calendar' as const,
        'OT': 'more-time' as const,
      };

      const accentColors = {
        'Nghỉ phép': '#e9c400',
        'WFH': '#00daf3',
        'Chấm công bù': '#c3f5ff',
        'OT': '#b388ff',
      };

      const newReq: PendingRequest = {
        id: String(Date.now()),
        senderId: payload.senderId,
        senderName: payload.senderName,
        role: payload.role,
        type: payload.type,
        description: payload.description,
        reason: payload.reason,
        date: payload.date,
        timeAgo: 'Vừa xong',
        status: 'pending',
        accentColor: accentColors[payload.type] || '#e9c400',
        hasAttachment: payload.hasAttachment,
        attachmentName: payload.attachmentName,
        typeIcon: typeIcons[payload.type],
      };

      const updated = [newReq, ...requests];
      await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Gửi đơn thành công' };
    } else {
      const createRes = await fetchWithAuth<any>('/requests', {
        method: 'POST',
        body: JSON.stringify({
          type: payload.type,
          description: payload.description,
          reason: payload.reason,
          date: payload.date,
          hasAttachment: payload.hasAttachment,
          attachmentName: payload.attachmentName,
        }),
      });

      if (createRes.success) {
        return await this.getRequests();
      }
      return { success: false, message: createRes.message };
    }
  },

  /**
   * Update request status (approved, rejected, pending)
   */
  async updateRequestStatus(
    id: string,
    status: PendingRequest['status']
  ): Promise<ApiResponse<PendingRequest[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getRequests();
      const requests = res.data || INITIAL_REQUESTS;

      const updated = requests.map((req) =>
        req.id === id ? { ...req, status } : req
      );

      await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
      return { success: true, data: updated, message: `Đã cập nhật trạng thái đơn thành ${status}` };
    } else {
      const updateRes = await fetchWithAuth<any>(`/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (updateRes.success) {
        return await this.getRequests();
      }
      return { success: false, message: updateRes.message };
    }
  },

  /**
   * Approve a request
   */
  async approveRequest(id: string): Promise<ApiResponse<PendingRequest[]>> {
    return this.updateRequestStatus(id, 'approved');
  },
};
