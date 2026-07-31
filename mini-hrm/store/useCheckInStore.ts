import { create } from 'zustand';
import { Alert } from 'react-native';
import { checkInService } from '@/services';
import { CheckInRecord } from '@/types';

interface CheckInState {
  checkIns: CheckInRecord[];
  isLoading: boolean;

  fetchCheckIns: () => Promise<void>;
  addCheckIn: (
    userId: string,
    userName: string,
    type: 'in' | 'out',
    time: string,
    date: string,
    shiftName?: string
  ) => Promise<void>;
  setCheckIns: (checkIns: CheckInRecord[]) => void;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  checkIns: [],
  isLoading: false,

  fetchCheckIns: async () => {
    set({ isLoading: true });
    try {
      const res = await checkInService.getCheckIns();
      if (res.success && res.data) {
        set({ checkIns: res.data });
      }
    } catch (e) {
      console.error('[useCheckInStore] Error fetching check-ins:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addCheckIn: async (userId, userName, type, time, date, shiftName) => {
    const res = await checkInService.addCheckIn({ userId, userName, type, time, date, shiftName });
    if (res.success && res.data) {
      set({ checkIns: res.data });
      Alert.alert(
        type === 'in'
          ? `Check-in ${shiftName ? `[${shiftName}] ` : ''}thành công! ✅`
          : `Check-out ${shiftName ? `[${shiftName}] ` : ''}thành công! ✅`,
        `Ghi nhận lúc: ${time}`,
        [{ text: 'Đã rõ' }]
      );
    } else {
      Alert.alert('Điểm danh không thành công', res.message || 'Không thể thực hiện điểm danh.', [{ text: 'Đã rõ' }]);
    }
  },

  setCheckIns: (checkIns) => set({ checkIns }),
}));
