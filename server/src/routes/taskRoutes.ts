import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Lấy danh sách task (visibility theo role)
// Query: ?status=xxx&assigneeId=xxx
router.get('/', getTasks);

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
// Tạo task mới - Chỉ Admin & TeamLead
router.post('/', requireRole(['admin', 'teamlead']), createTask);

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
// Cập nhật trạng thái task - tất cả role (employee chỉ cập nhật task của mình)
// Phải đặt TRƯỚC route /:id để tránh conflict
router.patch('/:id/status', updateTaskStatus);

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Chỉnh sửa toàn bộ thông tin task - Chỉ Admin & TeamLead
router.put('/:id', requireRole(['admin', 'teamlead']), updateTask);

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Xóa task - Chỉ Admin & TeamLead
router.delete('/:id', requireRole(['admin', 'teamlead']), deleteTask);

export default router;
