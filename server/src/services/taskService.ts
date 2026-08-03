import { prisma } from '../lib/prisma';
import AppError from '../utils/AppError';
import {
  GetTasksQueryDTO,
  CreateTaskDTO,
  UpdateTaskStatusDTO,
  UpdateTaskDTO,
  CreateMasterProjectDTO,
  HandoverTaskStageDTO,
  AdvanceMasterPipelineStageDTO,
  UpdateTaskProgressDTO,
} from '../types/dtos';

// Helper: Format task output (parse JSON strings)
export const formatTaskResponse = (task: any) => ({
  ...task,
  supporters: task.supporters ? JSON.parse(task.supporters) : [],
  handoverHistory: task.handoverHistory ? JSON.parse(task.handoverHistory) : [],
});

// Helper: format Vietnam date string (dd/mm/yyyy)
export const getVietnamDateString = (): string => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
};

// Helper: Lấy danh sách tasks formatted cho user theo role/visibility
export const fetchFormattedTasksForUser = async (reqUser: { id: number; role: string }) => {
  const { role, id: userId } = reqUser;
  const where: Record<string, unknown> = {};

  if (role === 'employee') {
    where.OR = [
      { assigneeId: userId },
      { isMasterProject: true },
      { masterTaskId: { not: null } },
    ];
  } else if (role === 'teamlead') {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { team: true },
    });

    if (currentUser?.team) {
      const teamMembers = await prisma.user.findMany({
        where: { team: currentUser.team },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((u) => u.id);
      where.OR = [
        { assigneeId: { in: teamMemberIds } },
        { isMasterProject: true },
      ];
    } else {
      where.assigneeId = userId;
    }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          team: true,
          specialization: true,
          accentColor: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks.map(formatTaskResponse);
};

// Helper: Tính toán weighted progress của Master Task theo stage
export const calculateMasterProgress = (masterStage: string, subTasks: any[]) => {
  const stageOrder: Record<string, number> = {
    design: 1,
    development: 2,
    testing: 3,
    completed: 4,
  };
  const currentOrder = stageOrder[masterStage] || 1;

  const getStageProg = (stageName: string, stageOrderVal: number) => {
    if (stageOrderVal < currentOrder) return 100;
    const st = subTasks.find((t) => t.pipelineStage === stageName);
    return st?.progress ?? 0;
  };

  const designProg = getStageProg('design', 1);
  const devProg = getStageProg('development', 2);
  const qaProg = getStageProg('testing', 3);

  const weightedProgress = Math.round(
    (designProg * 33.3 + devProg * 33.3 + qaProg * 33.4) / 100
  );
  return Math.min(100, Math.max(0, weightedProgress));
};

// Helper: Kiểm tra quyền quản lý / chỉnh sửa / xóa Dự án Lớn
export const canManageProject = async (
  task: any,
  reqUser: { id: number; role: string; name: string }
): Promise<boolean> => {
  // Admin có toàn quyền
  if (reqUser.role === 'admin') return true;

  // Nếu là Dự án Lớn hoặc subtask thuộc Dự án Lớn
  if (task.isMasterProject || task.masterTaskId) {
    let masterTask = task;
    if (!task.isMasterProject && task.masterTaskId) {
      masterTask = await prisma.task.findUnique({ where: { id: task.masterTaskId } });
    }

    if (!masterTask) return true;

    const ownerId = masterTask.creatorId || masterTask.assigneeId;
    const ownerName = masterTask.creatorName;

    // Người tạo hoặc được giao dự án mới có quyền quản lý
    const isOwner =
      (ownerId && ownerId === reqUser.id) ||
      (ownerName && ownerName === reqUser.name) ||
      (masterTask.assigneeId === reqUser.id);

    return isOwner;
  }

  return true;
};

export const getTasks = async (
  reqUser: { id: number; role: string },
  query: GetTasksQueryDTO
) => {
  const { role, id: userId } = reqUser;
  const { status, assigneeId } = query;

  const where: Record<string, unknown> = {};

  if (role === 'employee') {
    where.OR = [
      { assigneeId: userId },
      { isMasterProject: true },
      { masterTaskId: { not: null } },
    ];
  } else if (role === 'teamlead') {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { team: true },
    });

    if (currentUser?.team) {
      const teamMembers = await prisma.user.findMany({
        where: { team: currentUser.team },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((u) => u.id);
      where.OR = [
        { assigneeId: { in: teamMemberIds } },
        { isMasterProject: true },
      ];
    } else {
      where.assigneeId = userId;
    }
  }

  if (status) where.status = String(status);
  if (assigneeId && (role === 'admin' || role === 'teamlead')) {
    const parsedAssigneeId = parseInt(String(assigneeId), 10);
    if (!isNaN(parsedAssigneeId)) {
      where.assigneeId = parsedAssigneeId;
    }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          team: true,
          specialization: true,
          accentColor: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks.map(formatTaskResponse);
};

export const createTask = async (
  reqUser: { id: number; role: string; name: string },
  data: CreateTaskDTO
) => {
  const {
    title,
    assigneeId,
    supporters,
    deadline,
    status,
    statusType,
    dueType,
    description,
    isMasterProject,
    masterTaskId,
    masterTaskTitle,
    creatorId,
    creatorName,
    progress,
    pipelineStage,
    handoverHistory,
    budget,
  } = data;

  if (!title || !assigneeId || !deadline) {
    throw new AppError('Tiêu đề task, người được giao và deadline là bắt buộc.', 400);
  }

  const parsedAssigneeId = parseInt(String(assigneeId), 10);
  if (isNaN(parsedAssigneeId)) {
    throw new AppError('ID người được giao không hợp lệ.', 400);
  }

  const assignee = await prisma.user.findUnique({
    where: { id: parsedAssigneeId },
  });
  if (!assignee) {
    throw new AppError('Nhân viên được giao không tồn tại.', 400);
  }

  if (reqUser.role === 'teamlead') {
    const currentUser = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: { team: true },
    });
    if (currentUser?.team && assignee.team !== currentUser.team && !isMasterProject) {
      throw new AppError(
        'Team Lead chỉ có thể giao task cho thành viên trong team của mình.',
        403
      );
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      assigneeId: parsedAssigneeId,
      supporters: supporters ? JSON.stringify(supporters) : '[]',
      deadline,
      status: status || 'Cần làm',
      statusType: statusType || 'default',
      dueType: dueType || 'normal',
      description: description || null,
      isMasterProject: Boolean(isMasterProject),
      masterTaskId: masterTaskId ? parseInt(String(masterTaskId), 10) : null,
      masterTaskTitle: masterTaskTitle || null,
      creatorId: creatorId ? parseInt(String(creatorId), 10) : reqUser.id,
      creatorName: creatorName || reqUser.name,
      progress: progress !== undefined ? progress : 0,
      pipelineStage: pipelineStage || null,
      handoverHistory: handoverHistory ? JSON.stringify(handoverHistory) : '[]',
      budget: budget || null,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          team: true,
          accentColor: true,
        },
      },
    },
  });

  return formatTaskResponse(task);
};

export const updateTaskStatus = async (
  taskId: number,
  reqUser: { id: number; role: string },
  data: UpdateTaskStatusDTO
) => {
  const { status, statusType, dueType, progress, pipelineStage, handoverHistory } = data;

  if (!status) {
    throw new AppError('Trạng thái mới là bắt buộc.', 400);
  }

  const validStatuses = [
    'Cần làm',
    'Đang làm',
    'Chờ test',
    'Chờ review',
    'Hoàn thành',
    'Trễ hạn',
  ];
  if (!validStatuses.includes(String(status))) {
    throw new AppError(
      `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}.`,
      400
    );
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new AppError('Không tìm thấy task.', 404);
  }

  if (reqUser.role === 'employee' && task.assigneeId !== reqUser.id) {
    throw new AppError('Bạn chỉ có thể cập nhật trạng thái task được giao cho mình.', 403);
  }

  const updateData: Record<string, unknown> = {
    status,
    statusType: statusType || undefined,
    dueType: dueType || undefined,
  };

  if (progress !== undefined) updateData.progress = progress;
  if (pipelineStage !== undefined) updateData.pipelineStage = pipelineStage;
  if (handoverHistory !== undefined) updateData.handoverHistory = JSON.stringify(handoverHistory);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: {
        select: { id: true, name: true, email: true, team: true, accentColor: true },
      },
    },
  });

  return {
    updatedTask: formatTaskResponse(updated),
    status,
  };
};

export const updateTask = async (
  taskId: number,
  reqUser: { id: number; role: string; name: string },
  data: UpdateTaskDTO
) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new AppError('Không tìm thấy task.', 404);
  }

  const canManage = await canManageProject(task, reqUser);
  if (!canManage) {
    let masterTask: any = task;
    if (!task.isMasterProject && task.masterTaskId) {
      masterTask = await prisma.task.findUnique({ where: { id: task.masterTaskId } });
    }
    const ownerName = masterTask?.creatorName || 'bên khác';
    throw new AppError(
      `Hạn chế quyền 🔒: Dự án Lớn này do ${ownerName} khởi tạo. Bên khác có thể XEM tiến độ nhưng không có quyền CẬP NHẬT.`,
      403
    );
  }

  if (reqUser.role === 'teamlead') {
    const currentUser = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: { team: true },
    });
    const taskAssignee = await prisma.user.findUnique({
      where: { id: task.assigneeId },
      select: { team: true },
    });
    if (currentUser?.team && taskAssignee?.team !== currentUser.team && !task.isMasterProject) {
      throw new AppError(
        'Team Lead chỉ có thể chỉnh sửa công việc của thành viên thuộc nhóm của mình.',
        403
      );
    }
  }

  const {
    title,
    assigneeId,
    supporters,
    deadline,
    status,
    statusType,
    dueType,
    description,
    isMasterProject,
    masterTaskId,
    masterTaskTitle,
    creatorId,
    creatorName,
    progress,
    pipelineStage,
    handoverHistory,
    budget,
  } = data;

  if (reqUser.role === 'teamlead' && assigneeId !== undefined) {
    const parsedAssigneeId = parseInt(String(assigneeId), 10);
    const newAssignee = await prisma.user.findUnique({
      where: { id: parsedAssigneeId },
      select: { team: true },
    });
    const currentUser = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: { team: true },
    });
    if (newAssignee && currentUser?.team && newAssignee.team !== currentUser.team && !isMasterProject) {
      throw new AppError(
        'Team Lead chỉ có thể giao công việc cho thành viên trong nhóm của mình.',
        403
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (assigneeId !== undefined) updateData.assigneeId = parseInt(String(assigneeId), 10);
  if (supporters !== undefined) updateData.supporters = JSON.stringify(supporters);
  if (deadline !== undefined) updateData.deadline = deadline;
  if (status !== undefined) updateData.status = status;
  if (statusType !== undefined) updateData.statusType = statusType;
  if (dueType !== undefined) updateData.dueType = dueType;
  if (description !== undefined) updateData.description = description;
  if (isMasterProject !== undefined) updateData.isMasterProject = isMasterProject;
  if (masterTaskId !== undefined) updateData.masterTaskId = masterTaskId ? parseInt(String(masterTaskId), 10) : null;
  if (masterTaskTitle !== undefined) updateData.masterTaskTitle = masterTaskTitle;
  if (creatorId !== undefined) updateData.creatorId = creatorId ? parseInt(String(creatorId), 10) : null;
  if (creatorName !== undefined) updateData.creatorName = creatorName;
  if (progress !== undefined) updateData.progress = progress;
  if (pipelineStage !== undefined) updateData.pipelineStage = pipelineStage;
  if (handoverHistory !== undefined) updateData.handoverHistory = JSON.stringify(handoverHistory);
  if (budget !== undefined) updateData.budget = budget;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: {
        select: { id: true, name: true, email: true, team: true, accentColor: true },
      },
    },
  });

  return formatTaskResponse(updated);
};

export const deleteTask = async (
  taskId: number,
  reqUser: { id: number; role: string; name: string }
) => {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new AppError('Không tìm thấy task.', 404);
  }

  const canManage = await canManageProject(task, reqUser);
  if (!canManage) {
    let masterTask: any = task;
    if (!task.isMasterProject && task.masterTaskId) {
      masterTask = await prisma.task.findUnique({ where: { id: task.masterTaskId } });
    }
    const ownerName = masterTask?.creatorName || 'bên khác';
    throw new AppError(
      `Hạn chế quyền 🔒: Dự án Lớn này do ${ownerName} khởi tạo. Bên khác có thể XEM tiến độ nhưng không có quyền XÓA.`,
      403
    );
  }

  if (reqUser.role === 'teamlead') {
    const currentUser = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: { team: true },
    });
    const taskAssignee = await prisma.user.findUnique({
      where: { id: task.assigneeId },
      select: { team: true },
    });
    if (currentUser?.team && taskAssignee?.team !== currentUser.team && !task.isMasterProject) {
      throw new AppError(
        'Team Lead chỉ có thể xóa công việc của thành viên thuộc nhóm của mình.',
        403
      );
    }
  }

  await prisma.task.delete({ where: { id: taskId } });
};

export const createMasterProject = async (
  reqUser: { id: number; role: string; name: string },
  data: CreateMasterProjectDTO
) => {
  const { title, deadline, budget } = data;

  if (!title || !deadline) {
    throw new AppError('Tiêu đề dự án và deadline là bắt buộc.', 400);
  }

  await prisma.$transaction(async (tx) => {
    const allUsers = await tx.user.findMany();

    // Priority 1: role = teamlead & specialization includes design or ui/ux
    let designLead = allUsers.find((u) => {
      const spec = (u.specialization || '').toLowerCase();
      return u.role === 'teamlead' && (spec.includes('design') || spec.includes('ui/ux'));
    });

    // Priority 2: any user with specialization including design
    if (!designLead) {
      designLead = allUsers.find((u) => {
        const spec = (u.specialization || '').toLowerCase();
        return spec.includes('design');
      });
    }

    // Priority 3: creator (reqUser)
    const assigneeId = designLead ? designLead.id : reqUser.id;

    // Create Master Task
    const masterTask = await tx.task.create({
      data: {
        title: `[Dự án] ${title}`,
        status: 'Đang làm',
        statusType: 'warning',
        pipelineStage: 'design',
        isMasterProject: true,
        creatorId: reqUser.id,
        creatorName: reqUser.name,
        assigneeId,
        deadline,
        budget: budget || null,
        progress: 0,
        supporters: '[]',
        handoverHistory: '[]',
      },
    });

    // Create Sub-task for Design stage
    await tx.task.create({
      data: {
        title: `Vẽ thiết kế giao diện cho: ${title}`,
        status: 'Cần làm',
        statusType: 'neutral',
        pipelineStage: 'design',
        masterTaskId: masterTask.id,
        masterTaskTitle: title,
        creatorId: reqUser.id,
        creatorName: reqUser.name,
        assigneeId,
        deadline,
        supporters: '[]',
        handoverHistory: '[]',
      },
    });
  });

  const formattedTasks = await fetchFormattedTasksForUser(reqUser);
  return formattedTasks;
};

export const handoverTaskStage = async (
  taskId: number,
  reqUser: { id: number; role: string; name: string },
  data: HandoverTaskStageDTO
) => {
  const { toStage, approvedBy, nextAssigneeId } = data;

  if (!toStage) {
    throw new AppError('Giai đoạn chuyển giao (toStage) là bắt buộc.', 400);
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new AppError('Không tìm thấy task.', 404);
  }

  const canManage = await canManageProject(task, reqUser);
  if (!canManage) {
    let masterTask: any = task;
    if (!task.isMasterProject && task.masterTaskId) {
      masterTask = await prisma.task.findUnique({ where: { id: task.masterTaskId } });
    }
    const ownerName = masterTask?.creatorName || 'bên khác';
    throw new AppError(
      `Hạn chế quyền 🔒: Dự án Lớn này do ${ownerName} khởi tạo. Bên khác có thể XEM tiến độ nhưng không có quyền CẬP NHẬT.`,
      403
    );
  }

  const fromStage = task.pipelineStage || 'design';

  const history = task.handoverHistory ? JSON.parse(task.handoverHistory) : [];
  history.push({
    id: String(Date.now()),
    fromStage,
    toStage,
    approvedBy: approvedBy || reqUser.name,
    approvedAt: getVietnamDateString(),
  });

  let status = task.status;
  let statusType = task.statusType;
  if (toStage === 'development') {
    status = 'Cần làm';
    statusType = 'neutral';
  } else if (toStage === 'testing') {
    status = 'Chờ test';
    statusType = 'primary';
  } else if (toStage === 'completed') {
    status = 'Hoàn thành';
    statusType = 'success';
  }

  let assigneeId = task.assigneeId;
  if (nextAssigneeId !== undefined && nextAssigneeId !== null) {
    const parsedNextAssigneeId = parseInt(String(nextAssigneeId), 10);
    if (isNaN(parsedNextAssigneeId)) {
      throw new AppError('ID người được giao tiếp theo không hợp lệ.', 400);
    }
    const nextUser = await prisma.user.findUnique({ where: { id: parsedNextAssigneeId } });
    if (!nextUser) {
      throw new AppError('Nhân viên được giao không tồn tại.', 400);
    }
    assigneeId = parsedNextAssigneeId;
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      pipelineStage: toStage,
      status,
      statusType,
      assigneeId,
      handoverHistory: JSON.stringify(history),
    },
  });

  const formattedTasks = await fetchFormattedTasksForUser(reqUser);
  return {
    formattedTasks,
    toStage,
  };
};

export const advanceMasterPipelineStage = async (
  masterTaskId: number,
  reqUser: { id: number; role: string; name: string },
  data: AdvanceMasterPipelineStageDTO
) => {
  const { currentStage, approvedBy, customTitle } = data;

  const masterTask = await prisma.task.findUnique({ where: { id: masterTaskId } });
  if (!masterTask) {
    throw new AppError('Không tìm thấy task.', 404);
  }

  const canManage = await canManageProject(masterTask, reqUser);
  if (!canManage) {
    const ownerName = masterTask.creatorName || 'bên khác';
    throw new AppError(
      `Hạn chế quyền 🔒: Dự án Lớn này do ${ownerName} khởi tạo. Bên khác có thể XEM tiến độ nhưng không có quyền CẬP NHẬT.`,
      403
    );
  }

  let nextStage: string;
  if (currentStage === 'design') nextStage = 'development';
  else if (currentStage === 'development') nextStage = 'testing';
  else if (currentStage === 'testing') nextStage = 'completed';
  else {
    throw new AppError('Giai đoạn hiện tại không hợp lệ.', 400);
  }

  if (nextStage !== 'completed') {
    const subTaskTitle = customTitle || `Triển khai giai đoạn ${nextStage} cho: ${masterTask.title}`;
    await prisma.task.create({
      data: {
        title: subTaskTitle,
        assigneeId: masterTask.assigneeId,
        masterTaskId: masterTask.id,
        masterTaskTitle: masterTask.title,
        pipelineStage: nextStage,
        status: 'Cần làm',
        statusType: 'neutral',
        creatorId: masterTask.creatorId || reqUser.id,
        creatorName: masterTask.creatorName || reqUser.name,
        deadline: masterTask.deadline,
        supporters: '[]',
        handoverHistory: '[]',
      },
    });
  }

  const history = masterTask.handoverHistory ? JSON.parse(masterTask.handoverHistory) : [];
  const historyRecord: Record<string, unknown> = {
    id: String(Date.now()),
    fromStage: currentStage,
    toStage: nextStage,
    approvedBy: approvedBy || reqUser.name,
    approvedAt: getVietnamDateString(),
  };
  if (customTitle) {
    historyRecord.note = customTitle;
  }
  history.push(historyRecord);

  const subTasks = await prisma.task.findMany({ where: { masterTaskId: masterTask.id } });
  const weightedProgress = calculateMasterProgress(nextStage, subTasks);

  let message: string;
  let masterStatus = 'Đang làm';
  let masterStatusType = 'warning';
  let finalProgress = weightedProgress;

  if (nextStage === 'completed') {
    masterStatus = 'Hoàn thành';
    masterStatusType = 'success';
    finalProgress = 100;
    message = 'Đã nghiệm thu hoàn thành toàn bộ Dự án Lớn!';
  } else {
    message = `Đã tự động bàn giao Dự án sang giai đoạn ${nextStage}!`;
  }

  await prisma.task.update({
    where: { id: masterTaskId },
    data: {
      pipelineStage: nextStage,
      handoverHistory: JSON.stringify(history),
      progress: finalProgress,
      status: masterStatus,
      statusType: masterStatusType,
    },
  });

  const formattedTasks = await fetchFormattedTasksForUser(reqUser);
  return {
    formattedTasks,
    message,
  };
};

export const updateTaskProgress = async (
  taskId: number,
  reqUser: { id: number; role: string },
  data: UpdateTaskProgressDTO
) => {
  const { progress } = data;
  const parsedProgress = Number(progress);

  if (progress === undefined || progress === null || isNaN(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
    throw new AppError('Tiến độ phải là một số từ 0 đến 100.', 400);
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new AppError('Không tìm thấy task.', 404);
  }

  if (reqUser.role === 'employee' && task.assigneeId !== reqUser.id) {
    throw new AppError('Bạn chỉ có thể cập nhật tiến độ task được giao cho mình.', 403);
  }

  const roundedProgress = Math.round(parsedProgress);
  let status = task.status;
  let statusType = task.statusType;

  if (roundedProgress === 100) {
    status = 'Hoàn thành';
    statusType = 'success';
  } else if (roundedProgress > 0 && task.status === 'Cần làm') {
    status = 'Đang làm';
    statusType = 'warning';
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      progress: roundedProgress,
      status,
      statusType,
    },
  });

  if (task.masterTaskId) {
    const masterTask = await prisma.task.findUnique({ where: { id: task.masterTaskId } });
    if (masterTask) {
      const subTasks = await prisma.task.findMany({ where: { masterTaskId: masterTask.id } });
      const masterStage = masterTask.pipelineStage || 'design';
      const weightedProgress = calculateMasterProgress(masterStage, subTasks);

      const masterStatus = weightedProgress === 100 ? 'Hoàn thành' : 'Đang làm';
      const masterStatusType = weightedProgress === 100 ? 'success' : 'warning';

      await prisma.task.update({
        where: { id: masterTask.id },
        data: {
          progress: weightedProgress,
          status: masterStatus,
          statusType: masterStatusType,
        },
      });
    }
  }

  const formattedTasks = await fetchFormattedTasksForUser(reqUser);
  return {
    formattedTasks,
    roundedProgress,
  };
};
