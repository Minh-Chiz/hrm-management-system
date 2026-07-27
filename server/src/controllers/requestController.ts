import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../middlewares/errorHandler';
import { sendSuccess } from '../utils/response';
import {
  GetRequestsQueryDTO,
  CreateRequestDTO,
  UpdateRequestStatusDTO,
} from '../types/dtos';

// GET /api/requests
export const getRequests = asyncHandler(
  async (req: Request<{}, {}, {}, GetRequestsQueryDTO>, res: Response): Promise<void> => {
    const { role, id: userId } = req.user!;
    const { status, type } = req.query;

    const where: Record<string, unknown> = {};

    if (role === 'employee') {
      where.senderId = userId;
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
        where.senderId = { in: teamMembers.map((u) => u.id) };
      } else {
        where.senderId = userId;
      }
    }

    if (status) where.status = String(status);
    if (type) where.type = String(type);

    const requests = await prisma.request.findMany({
      where,
      include: {
        sender: {
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
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, requests);
  }
);

// POST /api/requests
export const createRequest = asyncHandler(
  async (req: Request<{}, {}, CreateRequestDTO>, res: Response): Promise<void> => {
    const { id: userId, name: userName, role: userRole } = req.user!;
    const { type, description, reason, date, hasAttachment, attachmentName } = req.body;

    if (!type || !date) {
      throw new AppError('Loại đơn từ và ngày là bắt buộc.', 400);
    }

    const validTypes = ['Nghỉ phép', 'OT', 'Chấm công bù'];
    if (!validTypes.includes(type)) {
      throw new AppError(`Loại đơn không hợp lệ. Phải là: ${validTypes.join(', ')}.`, 400);
    }

    const request = await prisma.request.create({
      data: {
        senderId: userId,
        senderName: userName,
        role: userRole,
        type,
        description: description || null,
        reason: reason || null,
        date,
        status: 'pending',
        hasAttachment: hasAttachment || false,
        attachmentName: attachmentName || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, team: true, accentColor: true },
        },
      },
    });

    sendSuccess(res, request, 'Gửi đơn từ thành công. Vui lòng chờ phê duyệt.', 201);
  }
);

// PATCH /api/requests/:id/status
export const updateRequestStatus = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdateRequestStatusDTO>, res: Response): Promise<void> => {
    const requestId = parseInt(req.params.id, 10);
    if (isNaN(requestId)) {
      throw new AppError('ID đơn từ không hợp lệ.', 400);
    }

    const { status } = req.body;

    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!status || !validStatuses.includes(String(status))) {
      throw new AppError(
        'Trạng thái không hợp lệ. Phải là: approved, rejected, hoặc pending.',
        400
      );
    }

    const existing = await prisma.request.findUnique({ where: { id: requestId } });
    if (!existing) {
      throw new AppError('Không tìm thấy đơn từ.', 404);
    }

    if (req.user!.role === 'teamlead') {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { team: true },
      });
      const sender = await prisma.user.findUnique({
        where: { id: existing.senderId },
        select: { team: true },
      });
      if (currentUser?.team && sender?.team !== currentUser.team) {
        throw new AppError(
          'Team Lead chỉ có thể phê duyệt đơn từ của thành viên thuộc nhóm của mình.',
          403
        );
      }
    }

    if (existing.status !== 'pending') {
      throw new AppError(
        `Đơn từ này đã được ${existing.status === 'approved' ? 'phê duyệt' : 'từ chối'} trước đó.`,
        400
      );
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, team: true, accentColor: true },
        },
      },
    });

    const statusMsg = status === 'approved' ? 'phê duyệt' : 'từ chối';
    sendSuccess(res, updated, `Đã ${statusMsg} đơn từ của ${existing.senderName}.`);
  }
);
