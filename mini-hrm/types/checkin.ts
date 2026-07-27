export interface CheckInRecord {
  id: string;
  userId: string;
  userName: string;
  type: 'in' | 'out';
  time: string;
  date: string;
  shiftName?: string;
}

export interface CreateCheckInPayload {
  userId: string;
  userName: string;
  type: 'in' | 'out';
  time: string;
  date: string;
  shiftName?: string;
}
