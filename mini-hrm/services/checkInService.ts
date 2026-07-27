import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { ApiResponse, CheckInRecord, CreateCheckInPayload } from '@/types';
import { simulateDelay, fetchWithAuth } from './apiUtils';

const STORAGE_KEY_CHECKINS = '@hrm_checkins';

const mapBackendCheckInToRecord = (item: any): CheckInRecord => ({
  id: String(item.id),
  userId: String(item.userId),
  userName: item.user ? item.user.name : item.userName,
  type: item.type as 'in' | 'out',
  time: item.time,
  date: item.date,
  shiftName: item.shiftName || 'Ca Sáng',
});

export const checkInService = {
  /**
   * Fetch check-in records
   */
  async getCheckIns(): Promise<ApiResponse<CheckInRecord[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(200);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_CHECKINS);
        const data: CheckInRecord[] = stored ? (JSON.parse(stored) as CheckInRecord[]) : [];
        return { success: true, data };
      } catch (e) {
        return { success: true, data: [] };
      }
    } else {
      const res = await fetchWithAuth<any>('/checkin/history');
      if (res.success && res.data) {
        const historyList = Array.isArray(res.data) ? res.data : (res.data.history || []);
        const records = historyList.map(mapBackendCheckInToRecord);
        return { success: true, data: records };
      }
      return { success: false, data: [], message: res.message };
    }
  },

  /**
   * Add a new check-in or check-out record
   */
  async addCheckIn(payload: CreateCheckInPayload): Promise<ApiResponse<CheckInRecord[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(200);
      const res = await this.getCheckIns();
      const checkIns = res.data || [];

      const newRecord: CheckInRecord = {
        id: String(Date.now()),
        userId: payload.userId,
        userName: payload.userName,
        type: payload.type,
        time: payload.time,
        date: payload.date,
        shiftName: payload.shiftName || 'Ca Sáng',
      };

      const updated = [newRecord, ...checkIns];
      await AsyncStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Ghi nhận điểm danh thành công' };
    } else {
      const createRes = await fetchWithAuth<any>('/checkin', {
        method: 'POST',
        body: JSON.stringify({ time: payload.time, shiftName: payload.shiftName }),
      });

      if (createRes.success) {
        return await this.getCheckIns();
      }
      return { success: false, message: createRes.message };
    }
  },
};
