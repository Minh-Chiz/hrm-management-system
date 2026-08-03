import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import { prisma } from '../lib/prisma';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { LoginDTO, UpdateProfileDTO } from '../types/dtos';

const generateToken = (user: {
  id: number;
  email: string;
  role: string;
  name: string;
}): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

const sanitizeUser = (user: Record<string, any>) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// POST /api/auth/login
export const login = catchAsync(async (req: Request<{}, {}, LoginDTO>, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Vui lòng cung cấp email và mật khẩu.', 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
  }

  if (user.status === 'Inactive') {
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin.', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  sendSuccess(
    res,
    {
      token,
      user: sanitizeUser(user),
    },
    'Đăng nhập thành công!'
  );
});

// GET /api/auth/me
export const getMe = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Không tìm thấy thông tin người dùng.', 404);
  }

  sendSuccess(res, sanitizeUser(user));
});

// PATCH /api/auth/profile
export const updateProfile = catchAsync(
  async (req: Request<{}, {}, UpdateProfileDTO>, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { phone, avatar, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng.', 404);
    }

    const updateData: Record<string, unknown> = {};

    if (phone !== undefined) {
      updateData.phone = phone;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (newPassword) {
      if (!currentPassword) {
        throw new AppError('Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu.', 400);
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        throw new AppError('Mật khẩu hiện tại không đúng.', 400);
      }

      if (newPassword.length < 6) {
        throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Không có thông tin nào để cập nhật.', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    sendSuccess(res, sanitizeUser(updatedUser), 'Cập nhật thông tin cá nhân thành công.');
  }
);
