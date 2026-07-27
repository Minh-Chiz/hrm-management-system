import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../middlewares/errorHandler';
import { sendSuccess } from '../utils/response';
import { GetUsersQueryDTO, CreateUserDTO, UpdateUserDTO } from '../types/dtos';

// GET /api/users
export const getUsers = asyncHandler(
  async (req: Request<{}, {}, {}, GetUsersQueryDTO>, res: Response): Promise<void> => {
    const { team, specialization, status, role } = req.query;

    const where: Record<string, unknown> = {};
    if (team) where.team = String(team);
    if (specialization) where.specialization = String(specialization);
    if (status) where.status = String(status);
    if (role) where.role = String(role);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        team: true,
        status: true,
        phone: true,
        accentColor: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, users);
  }
);

// POST /api/users
export const createUser = asyncHandler(
  async (req: Request<{}, {}, CreateUserDTO>, res: Response): Promise<void> => {
    const { name, email, password, role, specialization, team, phone, accentColor } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Tên, email và mật khẩu là bắt buộc.', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Định dạng email không hợp lệ.', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email này đã được sử dụng.', 400);
    }

    const validRoles = ['admin', 'teamlead', 'employee'];
    if (role && !validRoles.includes(role)) {
      throw new AppError(`Role không hợp lệ. Phải là một trong: ${validRoles.join(', ')}.`, 400);
    }

    if (password.length < 6) {
      throw new AppError('Mật khẩu phải có ít nhất 6 ký tự.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'employee',
        specialization: specialization || null,
        team: team || null,
        phone: phone || null,
        accentColor: accentColor || '#6366f1',
        status: 'Active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        team: true,
        status: true,
        phone: true,
        accentColor: true,
        createdAt: true,
      },
    });

    sendSuccess(res, user, 'Tạo tài khoản nhân viên thành công.', 201);
  }
);

// PUT /api/users/:id
export const updateUser = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdateUserDTO>, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('ID người dùng không hợp lệ.', 400);
    }

    const { name, role, specialization, team, status, phone, accentColor } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new AppError('Không tìm thấy nhân viên.', 404);
    }

    const validRoles = ['admin', 'teamlead', 'employee'];
    if (role && !validRoles.includes(String(role))) {
      throw new AppError(`Role không hợp lệ. Phải là một trong: ${validRoles.join(', ')}.`, 400);
    }

    const validStatuses = ['Active', 'Inactive'];
    if (status && !validStatuses.includes(String(status))) {
      throw new AppError('Status không hợp lệ. Phải là: Active hoặc Inactive.', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (team !== undefined) updateData.team = team;
    if (status !== undefined) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone;
    if (accentColor !== undefined) updateData.accentColor = accentColor;
    if ((req.body as any).avatar !== undefined) updateData.avatar = (req.body as any).avatar;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        team: true,
        status: true,
        phone: true,
        accentColor: true,
        avatar: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, updated, 'Cập nhật thông tin nhân viên thành công.');
  }
);

// DELETE /api/users/:id
export const deleteUser = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('ID người dùng không hợp lệ.', 400);
    }

    if (req.user!.id === userId) {
      throw new AppError('Bạn không thể xóa tài khoản của chính mình.', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new AppError('Không tìm thấy nhân viên.', 404);
    }

    await prisma.checkIn.deleteMany({ where: { userId } });
    await prisma.request.deleteMany({ where: { senderId: userId } });
    await prisma.task.updateMany({
      where: { assigneeId: userId },
      data: { assigneeId: req.user!.id },
    });

    await prisma.user.delete({ where: { id: userId } });

    sendSuccess(res, undefined, `Đã xóa nhân viên "${existing.name}" thành công.`);
  }
);
