import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
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
import * as taskService from '../services/taskService';

// GET /api/tasks
export const getTasks = catchAsync(
  async (req: Request<{}, {}, {}, GetTasksQueryDTO>, res: Response): Promise<void> => {
    const formattedTasks = await taskService.getTasks(req.user!, req.query);
    sendSuccess(res, formattedTasks);
  }
);

// POST /api/tasks
export const createTask = catchAsync(
  async (req: Request<{}, {}, CreateTaskDTO>, res: Response): Promise<void> => {
    const task = await taskService.createTask(req.user!, req.body);
    sendSuccess(res, task, 'Tạo task mới thành công.', 201);
  }
);

// PATCH /api/tasks/:id/status
export const updateTaskStatus = catchAsync(
  async (req: Request<{ id: string }, {}, UpdateTaskStatusDTO>, res: Response): Promise<void> => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      throw new AppError('ID task không hợp lệ.', 400);
    }

    const { updatedTask, status } = await taskService.updateTaskStatus(taskId, req.user!, req.body);
    sendSuccess(
      res,
      updatedTask,
      `Đã cập nhật trạng thái task thành "${status}".`
    );
  }
);

// PUT /api/tasks/:id
export const updateTask = catchAsync(
  async (req: Request<{ id: string }, {}, UpdateTaskDTO>, res: Response): Promise<void> => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      throw new AppError('ID task không hợp lệ.', 400);
    }

    const updated = await taskService.updateTask(taskId, req.user!, req.body);
    sendSuccess(res, updated, 'Cập nhật task thành công.');
  }
);

// DELETE /api/tasks/:id
export const deleteTask = catchAsync(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      throw new AppError('ID task không hợp lệ.', 400);
    }

    await taskService.deleteTask(taskId, req.user!);
    sendSuccess(res, undefined, 'Đã xóa task thành công.');
  }
);

// POST /api/tasks/master
export const createMasterProject = catchAsync(
  async (req: Request<{}, {}, CreateMasterProjectDTO>, res: Response): Promise<void> => {
    const formattedTasks = await taskService.createMasterProject(req.user!, req.body);
    sendSuccess(res, formattedTasks, 'Tạo Dự án Lớn & Chặng Thiết kế thành công!');
  }
);

// POST /api/tasks/:id/handover
export const handoverTaskStage = catchAsync(
  async (req: Request<{ id: string }, {}, HandoverTaskStageDTO>, res: Response): Promise<void> => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      throw new AppError('ID task không hợp lệ.', 400);
    }

    const { formattedTasks, toStage } = await taskService.handoverTaskStage(taskId, req.user!, req.body);
    sendSuccess(res, formattedTasks, `Đã bàn giao sang giai đoạn ${toStage}`);
  }
);

// POST /api/tasks/master/:id/advance
export const advanceMasterPipelineStage = catchAsync(
  async (req: Request<{ id: string }, {}, AdvanceMasterPipelineStageDTO>, res: Response): Promise<void> => {
    const masterTaskId = parseInt(req.params.id, 10);
    if (isNaN(masterTaskId)) {
      throw new AppError('ID task không hợp lệ.', 400);
    }

    const { formattedTasks, message } = await taskService.advanceMasterPipelineStage(
      masterTaskId,
      req.user!,
      req.body
    );
    sendSuccess(res, formattedTasks, message);
  }
);

// PATCH /api/tasks/:id/progress
export const updateTaskProgress = catchAsync(
  async (req: Request<{ id: string }, {}, UpdateTaskProgressDTO>, res: Response): Promise<void> => {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      throw new AppError('ID task không hợp lệ.', 400);
    }

    const { formattedTasks, roundedProgress } = await taskService.updateTaskProgress(
      taskId,
      req.user!,
      req.body
    );
    sendSuccess(res, formattedTasks, `Đã cập nhật tiến độ ${roundedProgress}%`);
  }
);
