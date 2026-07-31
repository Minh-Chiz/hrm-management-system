import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../middlewares/errorHandler';
import { sendSuccess } from '../utils/response';
import { CreateNotificationDTO } from '../types/dtos';

const formatRelativeTime = (createdAt: Date): string => {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - createdAt.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) {
    return 'Vừa xong';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const day = String(createdAt.getDate()).padStart(2, '0');
  const month = String(createdAt.getMonth() + 1).padStart(2, '0');
  const year = createdAt.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatNotification = (n: {
  id: number;
  userId: number | null;
  title: string;
  message: string;
  type: string;
  icon: string;
  iconColor: string;
  read: boolean;
  requestId: number | null;
  createdAt: Date;
}) => ({
  id: String(n.id),
  userId: n.userId === null ? 'all' : String(n.userId),
  title: n.title,
  message: n.message,
  time: formatRelativeTime(n.createdAt),
  createdAt: n.createdAt.toISOString(),
  type: n.type,
  icon: n.icon,
  iconColor: n.iconColor,
  read: n.read,
  ...(n.requestId !== null && n.requestId !== undefined ? { requestId: String(n.requestId) } : {}),
});

const fetchUserNotifications = async (userId: number) => {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ userId: userId }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
  });
  return notifications.map(formatNotification);
};

// GET /api/notifications
export const getNotifications = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const list = await fetchUserNotifications(userId);
    sendSuccess(res, list);
  }
);

// POST /api/notifications
export const createNotification = asyncHandler(
  async (req: Request<{}, {}, CreateNotificationDTO>, res: Response): Promise<void> => {
    const { userId, title, message, type, icon, iconColor, requestId } = req.body;

    if (!title || !message || !type) {
      throw new AppError('Tiêu đề, nội dung và loại thông báo là bắt buộc.', 400);
    }

    let parsedUserId: number | null = null;
    if (userId && userId !== 'all') {
      parsedUserId = parseInt(String(userId), 10);
      if (isNaN(parsedUserId)) {
        throw new AppError('User ID không hợp lệ.', 400);
      }
      const existingUser = await prisma.user.findUnique({ where: { id: parsedUserId } });
      if (!existingUser) {
        throw new AppError('Người dùng không tồn tại.', 404);
      }
    }

    let parsedRequestId: number | null = null;
    if (requestId !== undefined && requestId !== null && String(requestId).trim() !== '') {
      parsedRequestId = parseInt(String(requestId), 10);
      if (isNaN(parsedRequestId)) {
        parsedRequestId = null;
      }
    }

    await prisma.notification.create({
      data: {
        userId: parsedUserId,
        title: String(title),
        message: String(message),
        type: String(type),
        icon: icon || 'notifications',
        iconColor: iconColor || '#6366f1',
        requestId: parsedRequestId,
      },
    });

    const updatedList = await fetchUserNotifications(req.user!.id);
    sendSuccess(res, updatedList, 'Tạo thông báo thành công.', 201);
  }
);

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      throw new AppError('ID thông báo không hợp lệ.', 400);
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Không tìm thấy thông báo.', 404);
    }

    if (notification.userId !== null && notification.userId !== req.user!.id) {
      throw new AppError('Bạn không có quyền thực hiện thao tác này.', 403);
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    const updatedList = await fetchUserNotifications(req.user!.id);
    sendSuccess(res, updatedList, 'Đã đánh dấu thông báo là đã đọc.');
  }
);

// PATCH /api/notifications/read-all
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        OR: [{ userId: userId }, { userId: null }],
      },
      data: { read: true },
    });

    const updatedList = await fetchUserNotifications(userId);
    sendSuccess(res, updatedList, 'Đã đánh dấu tất cả thông báo là đã đọc.');
  }
);
