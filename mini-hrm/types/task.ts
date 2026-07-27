export type PipelineStage = 'design' | 'development' | 'testing' | 'completed';

export interface HandoverRecord {
  id: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  approvedBy: string;
  approvedAt: string;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'Cần làm' | 'Đang làm' | 'Chờ test' | 'Chờ review' | 'Hoàn thành' | 'Trễ hạn';
  statusType: 'neutral' | 'warning' | 'primary' | 'success' | 'danger';
  progress?: number; // 0 to 100
  pipelineStage?: PipelineStage;
  handoverHistory?: HandoverRecord[];
  isMasterProject?: boolean;
  masterTaskId?: string;
  masterTaskTitle?: string;
  creatorId?: string;
  creatorName?: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitials: string;
  supporters: string[]; // IDs of supporting employees
  deadline: string;
  dueType?: 'normal' | 'overdue';
  description?: string;
  budget?: string;
}

export interface CreateTaskPayload {
  title: string;
  assigneeId: string;
  supporters: string[];
  deadline: string;
  pipelineStage?: PipelineStage;
  budget?: string;
}

