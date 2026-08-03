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
import { validate } from '../middlewares/validate';
import {
  getTasksSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  deleteTaskSchema,
  createMasterProjectSchema,
  handoverTaskStageSchema,
  advanceMasterPipelineStageSchema,
  updateTaskProgressSchema,
} from '../validations/taskValidation';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Lấy danh sách task (visibility theo role)
// Query: ?status=xxx&assigneeId=xxx
router.get('/', validate(getTasksSchema), getTasks);

// ─── POST /api/tasks/master ──────────────────────────────────────────────────
// Tạo Dự án Lớn (Master Project) & sub-task chặng Thiết kế
router.post(
  '/master',
  requireRole(['admin', 'teamlead']),
  validate(createMasterProjectSchema),
  createMasterProject
);

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
// Tạo task mới - Chỉ Admin & TeamLead
router.post(
  '/',
  requireRole(['admin', 'teamlead']),
  validate(createTaskSchema),
  createTask
);

// ─── POST /api/tasks/:id/handover & /master/:id/advance ──────────────────────
router.post('/:id/handover', validate(handoverTaskStageSchema), handoverTaskStage);
router.post('/master/:id/advance', validate(advanceMasterPipelineStageSchema), advanceMasterPipelineStage);

// ─── PATCH /api/tasks/:id ──────────────────────────────────────────────────────
router.patch('/:id/progress', validate(updateTaskProgressSchema), updateTaskProgress);
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Chỉnh sửa toàn bộ thông tin task - Chỉ Admin & TeamLead
router.put(
  '/:id',
  requireRole(['admin', 'teamlead']),
  validate(updateTaskSchema),
  updateTask
);

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Xóa task - Chỉ Admin & TeamLead
router.delete(
  '/:id',
  requireRole(['admin', 'teamlead']),
  validate(deleteTaskSchema),
  deleteTask
);

export default router;
