export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  gracePeriodMinutes: number;
}

export const DEFAULT_SHIFTS: ShiftConfig[] = [
  { id: 'morning', name: 'Ca Sáng', startTime: '08:00', endTime: '12:00', gracePeriodMinutes: 5 },
  { id: 'afternoon', name: 'Ca Chiều', startTime: '13:30', endTime: '17:30', gracePeriodMinutes: 5 },
  { id: 'evening', name: 'Ca Tối', startTime: '18:00', endTime: '22:00', gracePeriodMinutes: 5 },
];

/**
 * Helper to get shift config by name
 */
export function getShiftConfigByName(shiftName: string): ShiftConfig {
  const found = DEFAULT_SHIFTS.find((s) => s.name === shiftName);
  if (found) return found;
  // Default to morning shift if unknown
  return DEFAULT_SHIFTS[0];
}

/**
 * Parse HH:mm time string into total minutes from start of day
 */
export function timeStrToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const upperStr = timeStr.trim().toUpperCase();
  const isPM = upperStr.includes('CH') || upperStr.includes('PM');
  const isAM = upperStr.includes('SA') || upperStr.includes('AM');

  const cleanTime = upperStr.split(' ')[0];
  const parts = cleanTime.split(':');
  if (parts.length < 2) return 0;

  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}


/**
 * Convert minutes to friendly Vietnamese string (e.g. 90 -> "1 giờ 30 phút", 25 -> "25 phút")
 */
export function formatMinutesToText(minutes: number): string {
  if (minutes <= 0) return '0 phút';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} phút`;
  if (mins === 0) return `${hrs} giờ`;
  return `${hrs} giờ ${mins} phút`;
}

export function formatMinutesCompact(minutes: number): string {
  if (minutes <= 0) return '0p';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}p`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}p`;
}

/**
 * Check if check-in time is late
 */
export function evaluateCheckInStatus(shiftName: string, nowTimeStr: string): {
  status: 'ON_TIME' | 'LATE';
  lateMinutes: number;
} {
  const config = getShiftConfigByName(shiftName);
  const startMins = timeStrToMinutes(config.startTime);
  const nowMins = timeStrToMinutes(nowTimeStr);
  const maxAllowedMins = startMins + config.gracePeriodMinutes;

  if (nowMins > maxAllowedMins) {
    const late = nowMins - startMins;
    return { status: 'LATE', lateMinutes: late };
  }
  return { status: 'ON_TIME', lateMinutes: 0 };
}

/**
 * Check if check-out time is early
 */
export function evaluateCheckOutStatus(shiftName: string, nowTimeStr: string): {
  isEarly: boolean;
  earlyMinutes: number;
  remainingText: string;
  status: 'EARLY_LEAVE' | 'NORMAL';
} {
  const config = getShiftConfigByName(shiftName);
  const endMins = timeStrToMinutes(config.endTime);
  const nowMins = timeStrToMinutes(nowTimeStr);

  if (nowMins < endMins) {
    const earlyMins = endMins - nowMins;
    return {
      isEarly: true,
      earlyMinutes: earlyMins,
      remainingText: formatMinutesToText(earlyMins),
      status: 'EARLY_LEAVE',
    };
  }

  return {
    isEarly: false,
    earlyMinutes: 0,
    remainingText: '',
    status: 'NORMAL',
  };
}

/**
 * Check if current shift has ended
 */
export function isShiftEnded(shiftName: string, nowTimeStr: string): boolean {
  const config = getShiftConfigByName(shiftName);
  const endMins = timeStrToMinutes(config.endTime);
  const nowMins = timeStrToMinutes(nowTimeStr);
  return nowMins >= endMins;
}
