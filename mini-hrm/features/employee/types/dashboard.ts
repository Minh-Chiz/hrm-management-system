import { Task, PendingRequest, CheckInRecord, AppNotification, Employee } from '@/types';

export type DashboardTab = 'personal' | 'project' | 'profile';

export type TaskFilterType = 'Tất cả' | 'Đang làm' | 'Chờ test/review' | 'Hoàn thành' | 'Trễ hạn';

export interface ShiftInfo {
  timeStr: string;
  dateStr: string;
  currentTimeShift: string;
  activeShiftName: string;
  checkedIn: boolean;
  isCompletedToday: boolean;
  openShift?: string;
  todayRecords: CheckInRecord[];
  shiftStartTime: string;
  shiftEndTime: string;
  isLateCheckIn?: boolean;
  lateMinutes?: number;
  isEarlyCheckOut?: boolean;
  remainingMinutes?: number;
  remainingText?: string;
  isShiftEnded?: boolean;
  latestInRecord?: CheckInRecord;
}


export interface TaskSummaryStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  totalCheckInsCount: number;
}

export interface ProfileHeaderProps {
  user: { name?: string; role?: string; specialization?: string } | null;
  unreadNotiCount: number;
  onOpenNotificationModal: () => void;
  onOpenCreateRequestModal: () => void;
  onLogout: () => void;
}

export interface CheckInCardProps {
  shiftInfo: ShiftInfo;
  checkInsHistory: CheckInRecord[];
  wifiSSID?: string;
  isCompanyWifi?: boolean;
  onToggleWifi?: () => void;
  onCheckInPress: () => void;
}



export interface TaskSummaryWidgetProps {
  tasks: Task[];
  filteredTasks: Task[];
  stats: TaskSummaryStats;
  searchQuery: string;
  activeFilter: string;
  onSearchChange: (text: string) => void;
  onFilterChange: (filter: string) => void;
  onSeeAllPress: () => void;
  onSelectTask: (task: Task) => void;
}

export interface LeaveRequestWidgetProps {
  requests: PendingRequest[];
  onOpenCreateModal: () => void;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'checkin' | 'task' | 'request' | 'notification';
  statusColor?: string;
  iconName: string;
}

export interface RecentActivityListProps {
  activities: RecentActivityItem[];
  onRefresh?: () => void;
}
