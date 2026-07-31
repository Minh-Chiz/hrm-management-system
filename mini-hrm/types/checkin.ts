export type CheckInStatus = 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'NORMAL';

export interface CheckInRecord {
  id: string;
  userId: string;
  userName: string;
  type: 'in' | 'out';
  time: string;
  date: string;
  shiftName?: string;
  status?: CheckInStatus;
  lateMinutes?: number;
  earlyMinutes?: number;
  wifiSSID?: string;
  isCompanyWifi?: boolean;
  note?: string;
}

export interface CreateCheckInPayload {
  userId: string;
  userName: string;
  type: 'in' | 'out';
  time: string;
  date: string;
  shiftName?: string;
  status?: CheckInStatus;
  lateMinutes?: number;
  earlyMinutes?: number;
  wifiSSID?: string;
  isCompanyWifi?: boolean;
  note?: string;
}



