import { Router } from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Lấy danh sách thông báo của user hiện tại (bao gồm cả broadcast)
router.get('/', getNotifications);

// ─── POST /api/notifications ──────────────────────────────────────────────────
// Tạo thông báo mới
router.post('/', createNotification);

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
// Đánh dấu tất cả thông báo là đã đọc
router.patch('/read-all', markAllAsRead);

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
// Đánh dấu 1 thông báo là đã đọc
router.patch('/:id/read', markAsRead);

export default router;
