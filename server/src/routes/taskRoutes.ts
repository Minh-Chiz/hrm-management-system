import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  createMasterProject,
  handoverTaskStage,
  advanceMasterPipelineStage,
  updateTaskProgress,
} from '../controllers/taskController';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Lấy danh sách task (visibility theo role)
// Query: ?status=xxx&assigneeId=xxx
router.get('/', getTasks);

// ─── POST /api/tasks /master ──────────────────────────────────────────────────
// Tạo Dự án Lớn (Master Project) & sub-task chặng Thiết kế
router.post('/master', requireRole(['admin', 'teamlead']), createMasterProject);

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
// Tạo task mới - Chỉ Admin & TeamLead
router.post('/', requireRole(['admin', 'teamlead']), createTask);

// ─── POST /api/tasks/:id/handover & /master/:id/advance ──────────────────────
router.post('/:id/handover', handoverTaskStage);
router.post('/master/:id/advance', advanceMasterPipelineStage);

// ─── PATCH /api/tasks/:id ──────────────────────────────────────────────────────
router.patch('/:id/progress', updateTaskProgress);
router.patch('/:id/status', updateTaskStatus);

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Chỉnh sửa toàn bộ thông tin task - Chỉ Admin & TeamLead
router.put('/:id', requireRole(['admin', 'teamlead']), updateTask);

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Xóa task - Chỉ Admin & TeamLead
router.delete('/:id', requireRole(['admin', 'teamlead']), deleteTask);

export default router;
