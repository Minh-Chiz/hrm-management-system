import { Router } from 'express';
import {
  getRequests,
  createRequest,
  updateRequestStatus,
} from '../controllers/requestController';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── GET /api/requests ────────────────────────────────────────────────────────
// Lấy danh sách đơn từ (Admin/TeamLead thấy tất cả, Employee thấy của mình)
// Query: ?status=pending&type=Nghỉ phép
router.get('/', getRequests);

// ─── POST /api/requests ───────────────────────────────────────────────────────
// Gửi đơn từ mới - tất cả role đều có thể gửi
router.post('/', createRequest);

// ─── PATCH /api/requests/:id/status ──────────────────────────────────────────
// Phê duyệt/Từ chối đơn từ - Chỉ Admin & TeamLead
router.patch('/:id/status', requireRole(['admin', 'teamlead']), updateRequestStatus);

export default router;
