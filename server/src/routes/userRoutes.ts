import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middlewares/auth';

const router = Router();

// Tất cả route đều yêu cầu xác thực
router.use(authenticateToken);

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Lấy danh sách nhân viên - tất cả role đều có thể xem
// Query: ?team=xxx&specialization=xxx&status=Active&role=employee
router.get('/', getUsers);

// ─── POST /api/users ──────────────────────────────────────────────────────────
// Tạo tài khoản nhân viên mới - Chỉ Admin
router.post('/', requireRole(['admin']), createUser);

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
// Cập nhật thông tin nhân viên - Chỉ Admin
router.put('/:id', requireRole(['admin']), updateUser);

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
// Xóa nhân viên - Chỉ Admin
router.delete('/:id', requireRole(['admin']), deleteUser);

export default router;
