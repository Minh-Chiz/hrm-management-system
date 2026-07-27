export interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  isLeader?: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: string;
  statusType: string;
  deadline: string;
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  totalTasks: number;
  doneTasks: number;
  statusColor: string;
  deadline: string;
  budget?: string;
  spent?: string;
  tasks: ProjectTask[];
}

export const mockMembers: Member[] = [];
export const MOCK_PROJECTS: Project[] = [];
