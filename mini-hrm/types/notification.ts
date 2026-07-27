export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  time: string;
  createdAt: string;
  type: 'request_approved' | 'request_rejected' | 'task_assigned' | 'system';
  icon: 'check-circle' | 'cancel' | 'assignment' | 'warning' | 'campaign';
  iconColor: string;
  read: boolean;
  requestId?: string;
}

export interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: AppNotification['type'];
  icon: AppNotification['icon'];
  iconColor: string;
  requestId?: string;
}
