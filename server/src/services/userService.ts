import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import AppError from '../utils/AppError';
import { GetUsersQueryDTO, CreateUserDTO, UpdateUserDTO } from '../types/dtos';

export const getUsers = async (query: GetUsersQueryDTO) => {
  const { team, specialization, status, role } = query;

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

  return users;
};

export const createUser = async (data: CreateUserDTO) => {
  const { name, email, password, role, specialization, team, phone, accentColor } = data;

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

  return user;
};

export const updateUser = async (userId: number, data: UpdateUserDTO) => {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError('Không tìm thấy nhân viên.', 404);
  }

  const { name, role, specialization, team, status, phone, accentColor } = data;

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
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

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

  return updated;
};

export const deleteUser = async (userId: number, currentUserId: number) => {
  if (currentUserId === userId) {
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
    data: { assigneeId: currentUserId },
  });

  await prisma.user.delete({ where: { id: userId } });

  return existing;
};
