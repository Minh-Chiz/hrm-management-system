// Auth DTOs
export interface LoginDTO {
  email?: string;
  password?: string;
}

export interface UpdateProfileDTO {
  phone?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}

// User DTOs
export interface GetUsersQueryDTO {
  team?: string;
  specialization?: string;
  status?: string;
  role?: string;
}

export interface CreateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  specialization?: string;
  team?: string;
  phone?: string;
  accentColor?: string;
  avatar?: string;
}

export interface UpdateUserDTO {
  name?: string;
  role?: string;
  specialization?: string;
  team?: string;
  status?: string;
  phone?: string;
  accentColor?: string;
  avatar?: string;
}

// Task DTOs
export interface GetTasksQueryDTO {
  status?: string;
  assigneeId?: string;
}

export interface CreateTaskDTO {
  title?: string;
  assigneeId?: string | number;
  supporters?: any[];
  deadline?: string;
  status?: string;
  statusType?: string;
  dueType?: string;
  description?: string;
  isMasterProject?: boolean;
  masterTaskId?: number;
  masterTaskTitle?: string;
  creatorId?: number;
  creatorName?: string;
  progress?: number;
  pipelineStage?: string;
  handoverHistory?: any[];
  budget?: string;
}

export interface UpdateTaskStatusDTO {
  status?: string;
  statusType?: string;
  dueType?: string;
  progress?: number;
  pipelineStage?: string;
  handoverHistory?: any[];
}

export interface UpdateTaskDTO {
  title?: string;
  assigneeId?: string | number;
  supporters?: any[];
  deadline?: string;
  status?: string;
  statusType?: string;
  dueType?: string;
  description?: string;
  isMasterProject?: boolean;
  masterTaskId?: number;
  masterTaskTitle?: string;
  creatorId?: number;
  creatorName?: string;
  progress?: number;
  pipelineStage?: string;
  handoverHistory?: any[];
  budget?: string;
}

export interface CreateMasterProjectDTO {
  title?: string;
  deadline?: string;
  budget?: string;
}

export interface HandoverTaskStageDTO {
  toStage?: string;
  approvedBy?: string;
  nextAssigneeId?: number | string;
}

export interface AdvanceMasterPipelineStageDTO {
  currentStage?: string;
  approvedBy?: string;
  customTitle?: string;
}

export interface UpdateTaskProgressDTO {
  progress?: number;
}


// Request DTOs
export interface GetRequestsQueryDTO {
  status?: string;
  type?: string;
}

export interface CreateRequestDTO {
  type?: string;
  description?: string;
  reason?: string;
  date?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
}

export interface UpdateRequestStatusDTO {
  status?: string;
}

// CheckIn DTOs
export interface CheckInDTO {
  time?: string;
  shiftName?: string;
  status?: string;
  lateMinutes?: number;
  earlyMinutes?: number;
  note?: string;
}

export interface GetCheckInHistoryQueryDTO {
  userId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: string;
}

// Notification DTOs
export interface CreateNotificationDTO {
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  icon?: string;
  iconColor?: string;
  requestId?: string;
}

