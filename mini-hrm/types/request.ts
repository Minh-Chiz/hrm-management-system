export interface PendingRequest {
  id: string;
  senderId: string;
  senderName: string;
  role: string;
  type: 'Nghỉ phép' | 'WFH' | 'Chấm công bù' | 'OT';
  description: string;
  reason: string;
  date: string;
  timeAgo: string;
  status: 'pending' | 'approved' | 'rejected';
  accentColor: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  typeIcon?: 'more-time' | 'event-busy' | 'edit-calendar';
}

export interface CreateRequestPayload {
  senderId: string;
  senderName: string;
  role: string;
  type: PendingRequest['type'];
  description: string;
  reason: string;
  date: string;
  hasAttachment?: boolean;
  attachmentName?: string;
}
