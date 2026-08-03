import { Request, Response } from 'express';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { GetUsersQueryDTO, CreateUserDTO, UpdateUserDTO } from '../types/dtos';
import * as userService from '../services/userService';

// GET /api/users
export const getUsers = catchAsync(
  async (req: Request<{}, {}, {}, GetUsersQueryDTO>, res: Response): Promise<void> => {
    const users = await userService.getUsers(req.query);
    sendSuccess(res, users);
  }
);

// POST /api/users
export const createUser = catchAsync(
  async (req: Request<{}, {}, CreateUserDTO>, res: Response): Promise<void> => {
    const user = await userService.createUser(req.body);
    sendSuccess(res, user, 'Tạo tài khoản nhân viên thành công.', 201);
  }
);

// PUT /api/users/:id
export const updateUser = catchAsync(
  async (req: Request<{ id: string }, {}, UpdateUserDTO>, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('ID người dùng không hợp lệ.', 400);
    }

    const updated = await userService.updateUser(userId, req.body);
    sendSuccess(res, updated, 'Cập nhật thông tin nhân viên thành công.');
  }
);

// DELETE /api/users/:id
export const deleteUser = catchAsync(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('ID người dùng không hợp lệ.', 400);
    }

    const deletedUser = await userService.deleteUser(userId, req.user!.id);
    sendSuccess(res, undefined, `Đã xóa nhân viên "${deletedUser.name}" thành công.`);
  }
);
