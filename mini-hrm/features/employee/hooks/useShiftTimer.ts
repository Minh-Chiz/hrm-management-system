import { useCallback } from 'react';
import { useRealTimeClock } from '@/hooks/useRealTimeClock';
import { CheckInRecord } from '@/types';
import { ShiftInfo } from '../types/dashboard';
import {
  getShiftConfigByName,
  evaluateCheckInStatus,
  evaluateCheckOutStatus,
  isShiftEnded,
} from '@/constants/shifts';

export function useShiftTimer(myHistory: CheckInRecord[] = []): ShiftInfo {
  const { timeStr, dateStr } = useRealTimeClock();

  const getShiftNameByTime = useCallback((): string => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour < 12.5) return 'Ca Sáng';
    if (hour < 17.5) return 'Ca Chiều';
    return 'Ca Tối';
  }, []);

  const todayIsoDate = new Date().toISOString().split('T')[0];
  const localTodayDate = new Date().toLocaleDateString('vi-VN');

  const todayRecords = myHistory.filter(
    (c) => c.date === todayIsoDate || c.date === localTodayDate
  );

  const openShift = ['Ca Sáng', 'Ca Chiều', 'Ca Tối'].find((s) => {
    const shiftRecs = todayRecords.filter((r) => (r.shiftName || 'Ca Sáng') === s);
    const hasIn = shiftRecs.some((r) => r.type === 'in');
    const hasOut = shiftRecs.some((r) => r.type === 'out');
    return hasIn && !hasOut;
  });

  const currentTimeShift = getShiftNameByTime();
  const checkedIn = !!openShift;

  const currentShiftRecords = todayRecords.filter(
    (r) => (r.shiftName || 'Ca Sáng') === currentTimeShift
  );
  const isCompletedToday = !checkedIn && currentShiftRecords.some((r) => r.type === 'out');
  const activeShiftName = openShift || currentTimeShift;

  const shiftConfig = getShiftConfigByName(activeShiftName);

  // Latest check-in record for active open shift
  const latestInRecord = checkedIn
    ? todayRecords.find((r) => (r.shiftName || 'Ca Sáng') === activeShiftName && r.type === 'in')
    : undefined;

  // Evaluate current check-in / check-out status
  const checkInEval = evaluateCheckInStatus(activeShiftName, timeStr);
  const checkOutEval = evaluateCheckOutStatus(activeShiftName, timeStr);
  const shiftEnded = isShiftEnded(activeShiftName, timeStr);

  return {
    timeStr,
    dateStr,
    currentTimeShift,
    activeShiftName,
    checkedIn,
    isCompletedToday,
    openShift,
    todayRecords,
    shiftStartTime: shiftConfig.startTime,
    shiftEndTime: shiftConfig.endTime,
    isLateCheckIn: checkInEval.status === 'LATE',
    lateMinutes: checkInEval.lateMinutes,
    isEarlyCheckOut: checkOutEval.isEarly,
    remainingMinutes: checkOutEval.earlyMinutes,
    remainingText: checkOutEval.remainingText,
    isShiftEnded: shiftEnded,
    latestInRecord,
  };
}
